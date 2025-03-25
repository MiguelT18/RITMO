import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { redisClient } from "../config/server.js";

dotenv.config();

export const protect = async (req, res, next) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    return res.status(401).json({
      message: "Acceso no autorizado, token no proporcionado.",
      error: authorizationHeader,
    });
  }

  // Si el token no viene con "Bearer", usamos la cadena completa
  const token = authorizationHeader.split(" ")[1] || authorizationHeader;

  if (!token || typeof token !== "string") {
    return res.status(401).json({
      message: "Acceso no autorizado, token no proporcionado.",
      error: token,
    });
  }

  try {
    // Decodificar el token para obtener el userId
    const decodedToken = jwt.decode(token);
    const userId = decodedToken?.userId;

    if (!userId)
      return res.status(401).json({ message: "Token inválido o expirado." });

    // Buscar en Redis el token asociado con el userId
    const redisToken = await redisClient.get(`access_token:${userId}`);

    if (!redisToken || redisToken !== token)
      return res.status(401).json({ message: "Token inválido o expirado." });

    // Verificar el JTW para confirmar su validez
    jwt.verify(token, process.env.JWT_SECRET);

    // Añadir el usuario decodificado a la solicitud
    req.user = decodedToken;
    next();
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Token inválido o expirado.", error: error.message });
  }
};
