const prisma = require("../src/prisma");
const bcrypt = require("bcrypt");

(async () => {
	await prisma.$connect();
	const users = [
		{ username: "admin", password: "password" },
		{ username: "operator1", password: "password" },
		{ username: "operator2", password: "password" },
		{ username: "operator3", password: "password" },
	];

	for (const user of users) {
		const hashPassword = bcrypt.hashSync(user.password, 10);
		await prisma.user.create({
			data: {
				username: user.username,
				password: hashPassword,
			},
		});
	}

	console.log("Berhasil membuat user");

	await prisma.$disconnect();
})();
