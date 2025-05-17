const dotenv = require("dotenv");
const { message } = require("./utilities");

dotenv.config();

const APPLICATION = {
	name: "LELE",
	version: "1.0.0",
	description: "Restful API for IOT Backend",
};
const PORT = process.env.PORT || 9000;
const JWT_SECRET = process.env.JWT_SECRET || "JWTSECRET";
const TOKEN_EXPIRED = 7 * 24 * 60 * 60 * 1000;
const DATA_TAKE = 50;

const ioConfig = {
	cors: {
		origin: "*",
		methods: ["GET", "POST"],
	},
};

const corsConfig = {
	origin: "*",
	methods: ["GET", "POST", "OPTIONS"],
	allowedHeaders: ["Content-Type"],
};

const rateLimiterConfig = {
	windowMs: 10 * 1000,
	max: parseInt(process.env.RATE_LIMIT ?? "100", 10),
	standardHeaders: true,
	legacyHeaders: false,
	handler: (_, response) => {
		return message(response, 429, false, "Terlalu banyak permintaan, silakan coba lagi setelah beberapa saat.", null);
	},
};

module.exports = {
	APPLICATION,
	PORT,
	JWT_SECRET,
	TOKEN_EXPIRED,
	DATA_TAKE,
	ioConfig,
	corsConfig,
	rateLimiterConfig,
};
