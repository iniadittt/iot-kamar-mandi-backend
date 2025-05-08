const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const schema = require("./schema");
const prisma = require("./prisma");
const { DATA_TAKE, JWT_SECRET, TOKEN_EXPIRED } = require("./config");
const { message } = require("./utilities");

const controller = {
	login: async (request, response) => {
		try {
			const validation = schema.login.safeParse(request.body);
			if (!validation.success) return message(response, 400, false, "Gagal validasi request", validation.error.format());
			const { username, password } = validation.data;
			await prisma.$connect();
			const user = await prisma.user.findUnique({
				where: { username },
				select: {
					id: true,
					username: true,
					password: true,
				},
			});
			await prisma.$disconnect();
			if (!user) return message(response, 200, false, "Username dan password salah", null);
			const isPasswordMatch = await bcrypt.compare(password, user.password);
			if (!isPasswordMatch) return message(response, 200, false, "Username dan password salah", null);
			const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: TOKEN_EXPIRED });
			return message(response, 200, true, "Berhasil login", { token });
		} catch (error) {
			await prisma.$disconnect();
			return message(response, 500, false, error.message, null);
		}
	},

	get: async (request, response, io) => {
		try {
			await prisma.$connect();
			const jadwal = await prisma.jadwal.findMany({
				take: DATA_TAKE,
				orderBy: { createdAt: "desc" },
				include: {
					sensors: {
						where: {
							type: {
								in: ["PINTU", "GERAK"],
							},
						},
						select: {
							type: true,
							value: true,
							createdAt: true,
						},
					},
				},
			});
			const responseMap = jadwal.map((item) => ({
				id: item.id,
				createdAt: item.createdAt,
				sensors: {
					pintu: item.sensors.filter((sensor) => sensor.type === "PINTU"),
					gerak: item.sensors.filter((sensor) => sensor.type === "GERAK"),
				},
			}));
			if (io) {
				io.emit("get", responseMap);
			}
			return message(response, 200, true, "Berhasil mengambil data sensor", responseMap);
		} catch (error) {
			await prisma.$disconnect();
			return message(response, 500, false, error.message, null);
		}
	},

	add: async (request, response, io) => {
		try {
			const validation = schema.add.safeParse(request.body);
			if (!validation.success) return message(response, 200, false, "Gagal validasi request", validation.error.format());
			const { type, value } = validation.data;
			await prisma.$connect();

			const TRANSACTION = await prisma.$transaction(async (database) => {
				let jadwal = await database.jadwal.findFirst({
					orderBy: { createdAt: "desc" },
					select: { id: true },
				});

				if (!jadwal) {
					jadwal = await database.jadwal.create({ data: {} });
					if (!jadwal) return message(response, 500, false, "Gagal menambah data sensor", null);
				}

				let sensorPintu = await database.sensor.findFirst({
					orderBy: { createdAt: "desc" },
					where: { jadwalId: jadwal.id, type: "PINTU" },
					select: { id: true, value: true },
				});

				if (!sensorPintu) {
					sensorPintu = await database.sensor.create({
						data: { type, value, jadwalId: jadwal.id },
						select: { id: true, value: true },
					});
					if (!sensorPintu) return message(response, 500, false, "Gagal menambah data sensor", null);
				}

				const pintuCurrent = sensorPintu.value;

				if (type === "PINTU") {
					if (value === pintuCurrent) {
						return message(response, 400, true, `Pintu masih ${value.toLowerCase()}`, null);
					}

					if (pintuCurrent === "TERBUKA" && value === "TERTUTUP") {
						const createdJadwal = await database.jadwal.create({ data: {} });
						if (!createdJadwal) return message(response, 500, false, "Gagal menambah data sensor", null);

						const createdSensorPintu = await database.sensor.create({
							data: { type, value, jadwalId: createdJadwal.id },
							select: { id: true, value: true },
						});
						if (!createdSensorPintu) return message(response, 500, false, "Gagal menambah data sensor", null);

						const createdSensorGerak = await database.sensor.create({
							data: { type: "GERAK", value: "GERAK", jadwalId: createdJadwal.id },
							select: { id: true, value: true },
						});
						if (!createdSensorGerak) return message(response, 500, false, "Gagal menambah data sensor", null);
					}

					if (pintuCurrent === "TERTUTUP" && value === "TERBUKA") {
						const createdSensor = await database.sensor.create({
							data: { type: "GERAK", value: "GERAK", jadwalId: jadwal.id },
							select: { id: true, value: true },
						});
						if (!createdSensor) return message(response, 500, false, "Gagal menambah data sensor", null);

						const createdSensorPintu = await database.sensor.create({
							data: { type, value, jadwalId: jadwal.id },
							select: { id: true, value: true },
						});
						if (!createdSensorPintu) return message(response, 500, false, "Gagal menambah data sensor", null);
					}
				}

				if (type === "GERAK") {
					if (pintuCurrent === "TERBUKA") {
						return message(response, 400, true, `Sedang tidak ada orang didalam kamar mandi`, null);
					}

					const createdSensor = await database.sensor.create({
						data: { type, value, jadwalId: jadwal.id },
						select: { id: true, value: true },
					});
					if (!createdSensor) return message(response, 500, false, "Gagal menambah data sensor", null);
				}
				return response.status(201).json({ success: true, code: 201, message: "Berhasil menambah data sensor", data: null });
			});
			if (io) {
				const jadwal = await prisma.jadwal.findMany({
					take: DATA_TAKE,
					orderBy: { createdAt: "desc" },
					include: {
						sensors: {
							where: {
								type: {
									in: ["PINTU", "GERAK"],
								},
							},
							select: {
								type: true,
								value: true,
								createdAt: true,
							},
						},
					},
				});
				const responseMap = jadwal.map((item) => ({
					id: item.id,
					createdAt: item.createdAt,
					sensors: {
						pintu: item.sensors.filter((sensor) => sensor.type === "PINTU"),
						gerak: item.sensors.filter((sensor) => sensor.type === "GERAK"),
					},
				}));
				io.emit("get", responseMap);
			}
			await prisma.$disconnect();
			return TRANSACTION;
		} catch (error) {
			await prisma.$disconnect();
			return message(response, 500, false, error.message, null);
		}
	},
};

module.exports = controller;
