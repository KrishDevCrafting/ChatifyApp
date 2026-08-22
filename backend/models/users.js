import pool from "../Config/db.js";

// FindbyEmail
const FindbyEmail = async (email) => {
  const [rows] = await pool.execute("SELECT * FROM users WHERE email = ?", [
    email,
  ]);
  return rows[0];
};

// Find by Username

const findByUsername = async (username) => {
  const [rows] = await pool.execute("SELECT * FROM users WHERE username = ?", [
    username,
  ]);
  return rows[0];
};

const create = async (username, email, hashedPassword) => {
  const [result] = await pool.execute(
    "INSERT INTO users (username,email,password) VALUES (?,?,?)",
    [username, email, hashedPassword],
  );
  return result;
};

export { FindbyEmail, findByUsername, create };
