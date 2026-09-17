import "dotenv/config";
import { Server } from "socket.io";
import cors from "cors";
import express from "express";
import { createServer } from "node:http";
import pool from "./Config/db.js";
import { createMessage } from "./models/message.js";
import router from "./routes/authRoutes.js";
import chatRouter from "./routes/chatRoutes.js";
import jwt from "jsonwebtoken";
const app = express();
const server = createServer(app);
app.use(cors());
const PORT = process.env.PORT || 3000;

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST"],
  },
});

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authenetication error: No token provided"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    socket.user = decoded;
    next();
  } catch (error) {
    return next(new Error("authenication error: Invalid token"));
  }
});

io.on("connection", (socket) => {
  console.log(`✅ ${socket.user.username} connected! (ID: ${socket.id})`);

  socket.on("join room", (room) => {
    socket.join(room);
    socket.data.room = room;

    io.to(room).emit("user joined", {
      username: socket.user.username,
      message: `${socket.user.username} joined the chat`,
    });
  });

  socket.on("chat message", async ({ room, text }) => {
    await createMessage(socket.data.room, socket.user.id, text);

    io.to(room).emit("chat message", {
      username: socket.user.username,
      text,
    });
  });

  socket.on("disconnect", () => {
    console.log(`❌ ${socket.user.username} disconnected!`);
  });
});
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);
app.use(express.json());
app.use("/api/auth", router);
app.use("/api/chat", chatRouter);
app.get("/", (req, res) => {
  res.send("<h1>Hello world</h1>");
});

server.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}`);
});
