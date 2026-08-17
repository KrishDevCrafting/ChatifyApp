import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test connection
try {
  const connection = await pool.getConnection();
  console.log("Connected to MySQL ✅");
  connection.release();
} catch (err) {
  console.error("Database connection failed ❌:", err.message);
}

export default pool;
