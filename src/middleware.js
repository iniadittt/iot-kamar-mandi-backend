const jwt = require("jsonwebtoken");
const { API_KEY, JWT_SECRET } = require("./config");
const { message } = require("./utilities");

const authenticationToken = async (request, response, next) => {
	const authenticationHeader = request.headers["authorization"];
	const token = authenticationHeader && authenticationHeader.split(" ")[1];
	if (token == null || !token) return message(response, 400, false, "Token tidak valid", null);
	jwt.verify(token, JWT_SECRET, (error, decoded) => {
		if (error) return message(response, 400, false, "Token sudah expired", null);
		request.username = decoded.username;
		next();
	});
};

const authentication = async (request, response, next) => {
	const authenticationHeader = request.headers["authorization"];
	const apiKey = authenticationHeader && authenticationHeader.split(" ")[1];
	if (!apiKey || apiKey !== API_KEY) return message(response, 400, false, "Key tidak valid", null);
	next();
};

module.exports = { authenticationToken, authentication };
