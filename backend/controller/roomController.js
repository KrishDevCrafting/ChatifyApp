import { createRoom, getAllRooms } from "../models/room.js";

// 1. Create a new room
const handleCreateRoom = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Room name is required" });
    }
    const result = await createRoom(name, req.user.id);

    return res.status(201).json({
      message: "Room created successfully!",
      roomId: result.insertId,
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Room name already exists" });
    }
    console.error("Error creating room:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// 2. Get all rooms
const handleGetRooms = async (req, res) => {
  try {
    const rooms = await getAllRooms();
    return res
      .status(200)
      .json({ message: "Rooms fetched successfully", rooms });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export { handleCreateRoom, handleGetRooms };
