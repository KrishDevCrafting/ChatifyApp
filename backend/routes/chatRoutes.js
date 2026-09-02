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

router.post("/rooms", verifyToken, handleCreateRoom);

router.get("/rooms", handleGetRooms);

router.post("/messages/:roomId", verifyToken, handleGetMessages);

export default router;
