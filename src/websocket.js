const websocket = (io) => {
	io.on("connection", (socket) => {
		console.log("Client connected:", socket.id);

		socket.on("getDataSensor", (message) => {
			console.log("Mengambil data sensor:", message);
			io.emit("getDataSensor", message);
		});

		socket.on("disconnect", () => {
			console.log("Client disconnected:", socket.id);
		});
	});
};

module.exports = websocket;
