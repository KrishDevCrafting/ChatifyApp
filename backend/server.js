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
const onlineUsers = new Map();

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
    const roomName = typeof room === "object" ? room.room : room;
    const roomId = roomName === "general" ? 1 : Number(roomName) || 1;

    socket.join(roomName);
    socket.data.room = roomName;
    socket.data.roomId = roomId;

    // 🟢 1. Register in onlineUsers map
    onlineUsers.set(socket.id, {
      username: socket.user.username,
      room: roomName,
    });

    // 🟢 2. Calculate unique online users in this room
    const roomUsers = Array.from(
      new Set(
        Array.from(onlineUsers.values())
          .filter((u) => u.room === roomName)
          .map((u) => u.username)
      )
    );

    // 🟢 3. Broadcast updated online list to room
    io.to(roomName).emit("room users", roomUsers);

    io.to(roomName).emit("user joined", {
      username: socket.user.username,
      message: `${socket.user.username} joined the chat`,
    });
  });

  socket.on("chat message", async (data) => {
    try {
      const text = typeof data === "object" ? data.text : data;
      const room =
        (typeof data === "object" && data.room) ||
        socket.data.room ||
        "general";
      const roomId =
        socket.data.roomId || (room === "general" ? 1 : Number(room)) || 1;

      // 1. Save to DB
      await createMessage(roomId, socket.user.id, text);

      // 2. Broadcast to room
      io.to(room).emit("chat message", {
        username: socket.user.username,
        text,
      });
    } catch (err) {
      console.error("Error saving message:", err);
    }
  });

  socket.on("typing", (room = "general") => {
    socket.to(room).emit("user typing", {
      username: socket.user.username,
    });
  });

  socket.on("stop typing", (room = "general") => {
    socket.to(room).emit("user stop typing", {
      username: socket.user.username,
    });
  });

  socket.on("disconnect", () => {
    const user = onlineUsers.get(socket.id);
    onlineUsers.delete(socket.id);

    if (user) {
      const roomUsers = Array.from(
        new Set(
          Array.from(onlineUsers.values())
            .filter((u) => u.room === user.room)
            .map((u) => u.username),
        ),
      );

      io.to(user.room).emit("room users", roomUsers);
    }

    console.log(`❌ ${socket.user.username} disconnected!`);
  });
});
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  }),
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
