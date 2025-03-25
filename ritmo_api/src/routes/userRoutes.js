import express from "express";
import UserController from "../controllers/user/UserController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Controladores de usuario
router.post("/register", UserController.registerUser);
router.post("/login", UserController.loginUser);
router.put("/update/:userId", UserController.updateUser);
router.delete("/delete/:userId", protect, UserController.deleteUser);
router.post(
  "/update-progress/:userId",
  protect,
  UserController.updateUserProgress
);

// Controladores de economía

export default router;
