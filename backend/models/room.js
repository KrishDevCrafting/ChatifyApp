import pool from "../Config/db.js";

const createRoom = async (name, createdBy) => {
  const [result] = await pool.execute(
    "INSERT INTO rooms (name,created_by) VALUES (?,?)",
    [name, createdBy],
  );

  return result;
};

const getAllRooms = async () => {
  const [rows] = await pool.execute(
    "SELECT rooms.* ,users.username AS creator FROM rooms JOIN users ON rooms.created_by = users.id ORDER BY rooms.created_at DESC",
  );

  return rows;
};

// Get single room by ID

const getRoomsId = async (id) => {
  const [rows] = await pool.execute("SELECT * FROM rooms WHERE id = ?", [id]);
  return rows[0];
};

export { createRoom, getAllRooms, getRoomsId };
