import "dotenv/config";
import { Server } from "socket.io";
import express from "express";
import { createServer } from "node:http";
import pool from "./Config/db.js";
import router from "./routes/authRoutes.js";

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("a user connected..!", socket.id);

  socket.on("join room", ({ username, room }) => {
    socket.join(room);
    socket.data.username = username;
    socket.data.room = room;

    io.to(room).emit("user joined", {
      username,
      message: `${username} joined the chat`,
    });
  });

  socket.on("chat message", ({ username, room, text }) => {
    io.to(room).emit("chat message", {
      username,
      text,
    });
  });

  socket.on("disconnect", () => {
    console.log("user disconnected..!", socket.id);
  });
});
app.use(express.json());
app.use("/api/auth", router);

app.get("/", (req, res) => {
  res.send("<h1>Hello world</h1>");
});

server.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}`);
});
