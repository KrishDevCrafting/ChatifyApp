import express from "express";
import { registerUser, loginUser } from "../controller/authController.js";
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

router.post("/signup/", registerUser);

router.post("/login", loginUser);
router.get("/me", verifyToken, (req, res) => {
  res.status(200).json({
    message: "Your protected Token accessed woking perfectly fine...",
  });
});
export default router;
