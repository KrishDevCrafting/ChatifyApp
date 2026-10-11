import {
  createRoom,
  getAllRooms,
  getRoomsId,
  deleteRoomById,
} from "../models/room.js";

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
// Delete a room where we should delete the room by room.created_by

const handleDeleteRoom = async (req, res) => {
  try {
    const { id } = req.params;

    const room = await getRoomsId(id);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Protect general room

    if (room.name === "general" || Number(id) === 1) {
      return res.status(400).json({
        message: "Default room cannot be deleted",
      });
    }

    // Autherization: Only Ownership

    if (room.created_by !== req.user.id) {
      return res.status(403).json({
        message: "Unauthorized: Only the creator can delete this room",
      });
    }

    // Delete room from database (Cascade deletes messages)
    await deleteRoomById(id);

    return res.status(200).json({
      message: "Room deleted successfully!",
      roomId: Number(id),
    });
  } catch (error) {
    console.error("Error deleting room:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export { handleCreateRoom, handleGetRooms, handleDeleteRoom };
