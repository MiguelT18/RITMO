import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./db.js";
import userRoutes from "../routes/userRoutes.js";
import economyRoutes from "../routes/economyRoutes.js";
import { Redis } from "ioredis";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());

app.use("/api/user", userRoutes);
app.use("/api/economy", economyRoutes);

export const startServer = async () => {
  try {
    await connectDB();
    app.listen(port, () => {
      console.log(`Servidor corriendo en http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Error al iniciar el servidor:", error);
  }
};

export const redisClient = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT || 6379,
});
