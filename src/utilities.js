const message = (response, code, success, message, data) => {
	return response.status(code).json({ success, code, message, data });
};

module.exports = { message };
