const { z } = require("zod");

const schema = {
	login: z.object({
		username: z.string({ required_error: "Username harus diisi" }).min(1, { message: "Username harus diisi" }),
		password: z.string({ required_error: "Password harus diisi" }).min(1, { message: "Password harus diisi" }),
	}),
	add: z
		.object({
			type: z.enum(["PINTU", "GERAK"], {
				required_error: "Type harus diisi",
			}),
			value: z.enum(["TERBUKA", "TERTUTUP", "GERAK", "DIAM"], {
				required_error: "Value harus diisi",
			}),
		})
		.refine((data) => (data.type === "PINTU" && ["TERBUKA", "TERTUTUP"].includes(data.value)) || (data.type === "GERAK" && ["GERAK", "DIAM"].includes(data.value)), {
			message: "Value tidak sesuai dengan tipe",
			path: ["value"],
		}),
};

module.exports = schema;
