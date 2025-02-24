import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const protect = async (req, res, next) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    return res
      .status(401)
      .json({ message: "Acceso no autorizado, token no proporcionado." });
  }

  // Si el token no viene con "Bearer", usamos la cadena completa
  const token = authorizationHeader.split(" ")[1] || authorizationHeader;

  if (!token) {
    return res
      .status(401)
      .json({ message: "Acceso no autorizado, token no proporcionado." });
  }

  try {
    // Verificación del token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(400).json({ message: "Token inválido o expirado." });
  }
};
