import { createMessage, getMessagesRoom } from "../models/message.js";

const handleSendMessage = async (req, res) => {
  try {
    const { roomId, content } = req.body;

    if (!roomId || !content) {
      return res.status(400).json({
        message: "Room ID and content are required",
      });
    }
    const result = await createMessage(roomId, req.user.id, content);

    return res.status(201).json({
      message: "Message sent successfully!",
      messageId: result.insertId,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({
      message: "internal server error",
    });
  }
};

const handleGetMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    if (!roomId) {
      return res.status(400).json({ message: "Room ID is required" });
    }

    const messages = await getMessagesRoom(roomId);
    return res.status(200).json({
      messages,
    });
  } catch (error) {
    console.error("Error fetching message:", error);
    return res.status(500).json({ message: "internal server error" });
  }
};

export { handleSendMessage, handleGetMessages };
