import UserModel from "../../models/UserModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import UserProgressService from "./UserProgressService.js";
import { redisClient } from "../../config/server.js";

dotenv.config();

const EXPIRATION_ACCESS_TOKEN = 900;
const EXPIRATION_REFRESH_TOKEN = 2592000;

export default class UserController {
  /**
   * Registra un nuevo usuario en la base de datos.
   *
   * 1. Recibe los datos del usuario (nombre de usuario, correo electrónico, y contraseña) desde el cuerpo de la solicitud.
   * 2. Verifica si ya existe un usuario con el mismo correo electrónico en la base de datos.
   * 3. Si el usuario ya está registrado, responde con un error 400 y un mensaje informativo.
   * 4. Si el usuario no existe, la contraseña se hashea usando bcrypt.
   * 5. Se crea un nuevo usuario con los datos proporcionados y se guarda en la base de datos.
   * 6. Finalmente, responde con un mensaje de éxito y código de estado 201.
   *
   * @param {Object} req - El objeto de la solicitud HTTP.
   * @param {Object} res - El objeto de la respuesta HTTP.
   * @returns {Object} Respuesta HTTP con un mensaje y código de estado.
   */
  static async registerUser(req, res) {
    const { username, email, password } = req.body;

    try {
      const userExists = await UserModel.findOne({ email });

      // Validar si el usuario ya está registrado
      if (userExists) {
        return res
          .status(400)
          .json({ message: "Este usuario ya está registrado." });
      }

      // Hashea la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Instancia el modelo del usuario con los datos del cuerpo de la solicitud
      const newUser = new UserModel({
        username,
        email,
        password: hashedPassword,
      });

      // Almacena el nuevo usuario en la base de datos
      await newUser.save();

      return res.status(201).json({ message: "Usuario creado correctamente." });
    } catch (error) {
      return res.status(500).json({
        message: "Parece que hubo un error, inténtalo de nuevo.",
      });
    }
  }

  /**
   * Permite al usuario iniciar sesión en el sistema.
   *
   * 1. Recibe el nombre de usuario y la contraseña desde el cuerpo de la solicitud.
   * 2. Busca al usuario en la base de datos con el nombre de usuario proporcionado.
   * 3. Si el usuario no existe, responde con un error 404.
   * 4. Si el usuario existe, compara la contraseña proporcionada con la contraseña almacenada en la base de datos.
   * 5. Si las contraseñas no coinciden, responde con un error 400.
   * 6. Si la autenticación es exitosa, genera un token JWT que contiene la información del usuario.
   * 7. Responde con el token JWT y un mensaje de inicio de sesión exitoso.
   *
   * @param {Object} req - El objeto de la solicitud HTTP.
   * @param {Object} res - El objeto de la respuesta HTTP.
   * @returns {Object} Respuesta HTTP con el token y código de estado.
   */
  static async loginUser(req, res) {
    const { username, password } = req.body;

    try {
      const user = await UserModel.findOne({ username });

      // Valida si el usuario existe en la base de datos
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado." });
      }

      // Compara si la contraseña coincide con la contraseña hasheada almacenada en la base de datos
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Contraseña incorrecta." });
      }

      // Genera un token JWT (access token) único para el usuario
      const accessToken = jwt.sign(
        { userId: user.userId },
        process.env.JWT_SECRET,
        { expiresIn: `${EXPIRATION_ACCESS_TOKEN}s` }
      );

      // Genera un refresh token
      const refreshToken = jwt.sign(
        { userId: user.userId },
        process.env.JWT_SECRET,
        { expiresIn: `${EXPIRATION_REFRESH_TOKEN}s` }
      );

      // Almacena el refresh token en Redis con un tiempo de expiración largo
      await redisClient.set(
        `refresh_token:${user.userId}`,
        refreshToken,
        "EX",
        EXPIRATION_REFRESH_TOKEN
      ); // 30 días (en segundos)

      // Almacena el access token en Redis con un tiempo de expiración corto
      await redisClient.set(
        `access_token:${user.userId}`,
        accessToken,
        "EX",
        EXPIRATION_ACCESS_TOKEN
      ); // 15 minutos (en segundos)

      return res.status(200).json({
        message: "Inicio de sesión exitoso.",
        accessToken,
        refreshToken,
        userId: user.userId,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Parece que hubo un error, inténtalo de nuevo.",
        error: error.message,
      });
    }
  }

  /**
   * Renueva el Access Token y el Refresh Token del usuario.
   *
   * 1. Recibe un refresh token proporcionado por el usuario en el cuerpo de la solicitud.
   * 2. Si no se proporciona un refresh token, responde con un error 400 (Bad Request).
   * 3. Verifica la validez del refresh token utilizando el JWT_SECRET.
   * 4. Comprueba si el refresh token está almacenado en Redis y si coincide con el proporcionado.
   * 5. Si el token es válido, genera un nuevo access token con una nueva fecha de expiración.
   * 6. Almacena el nuevo access token en Redis con un tiempo de expiración corto.
   * 7. Genera un nuevo refresh token con una nueva fecha de expiración.
   * 8. Almacena el nuevo refresh token en Redis con un tiempo de expiración largo.
   * 9. Responde con el nuevo access token, refresh token y un mensaje de éxito.
   * 10. Si ocurre algún error durante el proceso, responde con un error 500 (Internal Server Error).
   *
   * @param {Object} req - El objeto de la solicitud HTTP que contiene el refresh token.
   * @param {Object} res - El objeto de la respuesta HTTP con el nuevo access token, refresh token, y un mensaje de éxito.
   *
   * @returns {Object} Respuesta HTTP con el nuevo access token, refresh token y mensaje de éxito, o un error.
   */
  static async refreshToken(req, res) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res
        .status(400)
        .json({ message: "Refresh token no proporcionado." });
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

      // Verifica si el refresh token está en Redis
      const redisToken = await redisClient.get(
        `refresh_token:${decoded.userId}`
      );
      if (!redisToken || redisToken !== refreshToken) {
        return res.status(401).json({ message: "Token inválido o expirado." });
      }

      // Genera un nuevo access token
      const newAccessToken = jwt.sign(
        { userId: decoded.userId },
        process.env.JWT_SECRET,
        { expiresIn: `${EXPIRATION_ACCESS_TOKEN}s` }
      );

      // Almacena el nuevo access token en Redis
      await redisClient.set(
        `access_token:${decoded.userId}`,
        newAccessToken,
        "EX",
        EXPIRATION_ACCESS_TOKEN
      );

      // Genera un nuevo refresh token
      const newRefreshToken = jwt.sign(
        { userId: decoded.userId },
        process.env.JWT_SECRET,
        { expiresIn: `${EXPIRATION_REFRESH_TOKEN}s` }
      );

      // Almacena el nuevo refresh token en Redis
      await redisClient.set(
        `refresh_token:${decoded.userId}`,
        newRefreshToken,
        "EX",
        EXPIRATION_REFRESH_TOKEN
      );

      return res.status(200).json({
        message: "Tokens renovados exitosamente.",
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Parece que hubo un error, inténtalo de nuevo.",
        error: error.message,
      });
    }
  }

  /**
   * Actualiza la información de un usuario existente.
   *
   * 1. Verifica si el `userId` de la solicitud coincide con el `userId` del token JWT proporcionado en la autenticación.
   * 2. Si los IDs no coinciden, responde con un error 403, indicando que el usuario no tiene permiso para actualizar a otro usuario.
   * 3. Si el `userId` coincide, obtiene los datos enviados en el cuerpo de la solicitud (nombre de usuario, correo electrónico, contraseña).
   * 4. Busca al usuario en la base de datos por su ID.
   * 5. Si el usuario no existe, responde con un error 404.
   * 6. Si el usuario existe, actualiza los campos proporcionados.
   * 7. Si se incluye una nueva contraseña, la nueva contraseña se hashea antes de almacenarla.
   * 8. Guarda los cambios en la base de datos.
   * 9. Finalmente, responde con un mensaje de éxito.
   *
   * @param {Object} req - El objeto de la petición HTTP.
   * @param {Object} res - El objeto de la respuesta HTTP.
   * @returns {Object} Respuesta HTTP con un mensaje de éxito o error.
   */
  static async updateUser(req, res) {
    const { userId } = req.params;

    const token = await redisClient.get(`access_token:${userId}`);

    if (!token) return res.status(401).json({ message: "No autorizado." });

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    console.log("Decoded token:", decodedToken.userId);
    console.log("User ID:", userId);
    if (userId !== decodedToken.userId) {
      return res.status(403).json({
        message: "No tienes permiso para actualizar este usuario.",
      });
    }

    try {
      const { username, email, password } = req.body;

      const user = await UserModel.findOne({ userId: String(userId) });

      // Validar si el usuario existe en la base de datos
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado." });
      }

      // Actualizar los campos si se envían en la solicitud
      if (username) {
        const userExists = await UserModel.findOne({ username });
        if (userExists)
          return res
            .status(400)
            .json({ message: "Nombre de usuario ya existe." });
        user.username = username;
      }
      if (email) {
        const userExists = await UserModel.findOne({ email });
        if (userExists)
          return res
            .status(400)
            .json({ message: "Correo electrónico ya existe." });
        user.email = email;
      }
      if (password) {
        // TODO: Añadir confirmación por correo electrónico antes de actualizar la contraseña
        user.password = await bcrypt.hash(password, 10);
      }

      await user.save();

      return res
        .status(200)
        .json({ message: "Usuario actualizado correctamente." });
    } catch (error) {
      return res.status(500).json({
        message: "Parece que hubo un error, inténtalo de nuevo.",
      });
    }
  }

  /**
   * Elimina un usuario de la base de datos.
   *
   * 1. Verifica si el `userId` de la solicitud coincide con el `userId` del token JWT proporcionado en la autenticación.
   * 2. Si los IDs no coinciden, responde con un error 403, indicando que el usuario no tiene permiso para eliminar a otro usuario.
   * 3. Si el `userId` coincide, intenta eliminar el usuario de la base de datos utilizando `findByIdAndDelete`.
   * 4. Si no se encuentra el usuario, responde con un error 404.
   * 5. Si el usuario es eliminado correctamente, responde con un mensaje de éxito.
   *
   * @param {Object} req - El objeto de la solicitud HTTP.
   * @param {Object} res - El objeto de la respuesta HTTP.
   * @returns {Object} Respuesta HTTP con un mensaje de éxito o error.
   */
  static async deleteUser(req, res) {
    const { userId } = req.params;

    if (userId !== req.user.userId) {
      return res.status(403).json({
        message: "No tienes permiso para eliminar este usuario.",
      });
    }

    try {
      const user = await UserModel.findByIdAndDelete({ userId: userId });

      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado." });
      }

      return res
        .status(200)
        .json({ message: "Usuario eliminado correctamente." });
    } catch (error) {
      return res.status(500).json({
        message: "Parece que hubo un error, inténtalo de nuevo.",
        error: error.message,
      });
    }
  }

  /**
   * Actualiza el progreso de experiencia del usuario y, si es necesario, aumenta su nivel.
   *
   * @param {Request} req - Objeto de solicitud HTTP, que debe contener:
   *   - `req.params.userId` (string): ID del usuario a actualizar.
   *   - `req.body.xpGained` (number): Cantidad de experiencia ganada.
   * @param {Response} res - Objeto de respuesta HTTP.
   * @returns {Promise<Response>} - Devuelve una respuesta con el nuevo nivel y experiencia del usuario.
   *
   * @throws {Error} Si ocurre un problema al buscar el usuario o actualizar su experiencia.
   */
  static async updateUserProgress(req, res) {
    const { userId } = req.params;
    const { xpGained } = req.body;

    try {
      const user = await UserModel.findById(userId);

      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado." });
      }

      // Llamada al servicio para calcular el nuevo nivel y experiencia
      const { user: updatedUser, requiredXp } =
        UserProgressService.calculateNewLevelAndExperience(user, xpGained);

      // Guardar los cambios en la base de datos
      await user.save();

      return res.json({
        message: `¡El usuario ${updatedUser.username} ha subido de nivel a ${updatedUser.level}!`,
        user: {
          username: updatedUser.username,
          level: updatedUser.level,
          experience: updatedUser.experience,
          requiredXp,
        },
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Hubo un error al procesar la experiencia.", erro });
    }
  }
}
