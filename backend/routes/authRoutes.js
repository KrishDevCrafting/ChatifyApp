import express from "express";

const router = express.Router();

router.get("/api/signup/", (req, res) => {
  res.send("Signup endpoint..!");

  router.get("/api/login/", (req, res) => {
    res.send("Login endpoint..!");
  });

  router.get("/api/auth/logout", (req, res) => {
    res.send("Logout message..!");
  });
});

export default router;
