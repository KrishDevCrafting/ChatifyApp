import express from "express";
import {
  handleCreateRoom,
  handleGetRooms,
  handleDeleteRoom,
} from "../controller/roomController.js";
import verifyToken from "../middleware/verifyToken.js";
import {
  handleGetMessages,
  handleSendMessage,
} from "../controller/messageController.js";
import upload from "../middleware/uploadMiddleware.js";
import { handleUploadImage } from "../controller/uploadController.js";
const router = express.Router();

// 🏠 Room Routes
router.post("/rooms", verifyToken, handleCreateRoom);      // Create a room
router.get("/rooms", verifyToken, handleGetRooms);          // Get all rooms
router.delete("/rooms/:id", verifyToken, handleDeleteRoom); // Delete a room 🔐

// 💬 Message Routes
router.post("/messages", verifyToken, handleSendMessage);           // Send a message
router.get("/messages/:roomId", verifyToken, handleGetMessages);    // Get messages by room

// 📸 Image Upload Route
router.post("/upload-image", verifyToken, upload.single("image"), handleUploadImage);

export default router;
