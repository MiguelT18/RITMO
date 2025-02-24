import express from "express";
import EconomyController from "../controllers/economy/EconomyController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Controladores de economía
router.post("/add-funds/:userId", protect, EconomyController.addGems);
router.post(
  "/substract-funds/:userId",
  protect,
  EconomyController.substractGems
);
router.get("/get-balance/:userId", protect, EconomyController.getGemsBalance);

export default router;
