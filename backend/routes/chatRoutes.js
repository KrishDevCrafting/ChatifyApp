import express from "express";
import {
  handleCreateRoom,
  handleGetRooms,
} from "../controller/roomController.js";
import verifyToken from "../middleware/verifyToken.js";
import {
  handleGetMessages,
  handleSendMessage,
} from "../controller/messageController.js";
const router = express.Router();

// 🏠 Room Routes
router.post("/rooms", verifyToken, handleCreateRoom);      // Create a room
router.get("/rooms", verifyToken, handleGetRooms);          // Get all rooms

// 💬 Message Routes
router.post("/messages", verifyToken, handleSendMessage);           // Send a message
router.get("/messages/:roomId", verifyToken, handleGetMessages);    // Get messages by room

export default router;
