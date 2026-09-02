import express from "express";
import {
  handleCreateRoom,
  handleGetRooms,
} from "../controller/chatController.js";
import verifyToken from "../middleware/verifyToken.js";
import {
  handleGetMessages,
  handleSendMessage,
} from "../controller/messageController.js";
const router = express.Router();

router.get("/rooms", verifyToken, handleCreateRoom);

router.get("/rooms", verifyToken, handleSendMessage);

router.post("/messages", verifyToken.handleGetMessages);

export default router;
