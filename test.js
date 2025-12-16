const ioClient = require("socket.io-client");
const socket = ioClient("http://localhost:5000");
socket.on("connect", () => console.log("Connecté!"));
socket.on("connect_error", (err) => console.log("Erreur:",err.message));