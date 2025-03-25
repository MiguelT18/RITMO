import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const mongo_uri = process.env.MONGO_URI;

// conexión a la base de datos MongoDB
export const connectDB = async () => {
  try {
    await mongoose.connect(mongo_uri);
    console.log(
      "Conexión establecida con éxito a la base de datos MongoDB"
    );
  } catch (error) {
    console.error("Error al conectar a la base de datos MongoDB:", error);
    process.exit(1);
  }
};
