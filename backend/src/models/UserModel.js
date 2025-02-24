import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const UserSchema = new mongoose.Schema({
  userId: { type: String, default: uuidv4, unique: true },
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  level: { type: Number, default: 0 },
  experience: { type: Number, default: 0 },
  gems: { type: Number, default: 0 },
});

export default mongoose.model("User", UserSchema);
