import { FindbyEmail, findByUsername, create } from "../models/users.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// 1. REGISTER USER CONTROLLER
const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const existingEmail = await FindbyEmail(email);
    if (existingEmail) {
      return res.status(400).json({ message: "Email is already in use" });
    }
    const existingUser = await findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: "Username is already taken" });
    }

    // Step D: Password ko securely hash karo (salt rounds = 10)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Step E: Database model ke create method se user insert karo
    const result = await create(username, email, hashedPassword);

    // Step F: Success response bhejo
    return res.status(201).json({
      message: "User registered successfully!",
      userId: result.insertId,
    });
  } catch (error) {
    console.error("Error in registerUser:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// 2. Login users

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await FindbyEmail(email);

    if (!user) {
      return res.status(400).json({ message: "Invalid email and password" });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res.status(400).json({ message: "Invalid email or passwrod" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
      },

      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );
    return res.status(200).json({
      message: "Login successful!",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error in loginUser:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export { registerUser, loginUser };
