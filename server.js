const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
require("dotenv").config();
const { Server } = require("socket.io");

const admin = require("./config/firebaseAdmin");
const db = admin.db;

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: ["https://location-maison-476fb.web.app", "https://location-maison-476fb.firebaseapp.com"], // ton domaine frontend
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const io = new Server(server, {
  path: process.env.SOCKET_PATH || "/socket.io",
  cors: { origin: '*', credentials: true, methods: ["GET","POST"] },
});

app.locals.io = io;
app.locals.db = db;

io.on("connection", (socket) => {
  console.log("⚡ Client connecté :", socket.id);
  socket.on("sendMessage", data => io.emit("receiveMessage", data));
  socket.on("disconnect", () => console.log("❌ Client déconnecté :", socket.id));
});

app.use("/api/proprietaire", require("./routes/proprietaire"));
app.use("/api/maisons", require("./routes/maisons"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/stats", require("./routes/stats"));
app.use("/api/demandes", require("./routes/demandes"));

app.get("/api/test", (req, res) => res.json({ success: true, message: "API fonctionne !" }));

const publicPath = path.join(__dirname, "..", "public");
app.use(express.static(publicPath));
app.get("*", (req, res) => res.sendFile(path.join(publicPath, "index.html")));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Serveur lancé sur le port ${PORT}`));
