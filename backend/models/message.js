import pool from "../Config/db.js";

const createMessage = async (roomId, userId, content, messageType = "text") => {
  const [result] = await pool.execute(
    "INSERT INTO messages (room_id, user_id, content, message_type) VALUES (?, ?, ?, ?)",
    [roomId, userId, content, messageType],
  );
  return result;
};

//  GEt all messages of a specific room with username

const getMessagesRoom = async (roomId) => {
  const [rows] = await pool.execute(
    "SELECT messages.*, users.username FROM messages JOIN users ON messages.user_id =  users.id WHERE messages.room_id = ? ORDER BY messages.created_at ASC",
    [roomId],
  );
  return rows;
};

export { createMessage, getMessagesRoom };
