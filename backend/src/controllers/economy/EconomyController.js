import UserModel from "../../models/UserModel.js";
import UserEconomyService from "./EconomyService.js";

export default class UserEconomyController {
  /**
   * Añade gemas al usuario desde una petición HTTP.
   */
  static async addGems(req, res) {
    try {
      const { userId } = req.params;
      let { amount } = req.body;

      amount = Number(amount);
      if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: "Cantidad incorrecta." });
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado." });
      }

      const updatedUser = await UserEconomyService.addGems(user, amount);

      return res.json({
        message: `Se añadieron ${amount} gemas correctamente.`,
        gems: updatedUser.gems,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Hubo un error al procesar la operación.",
        error: error.message,
      });
    }
  }

  /**
   * Resta gemas al usuario desde una petición HTTP.
   */
  static async substractGems(req, res) {
    try {
      const { userId } = req.params;
      let { amount } = req.body;

      amount = Number(amount);
      if (isNaN(amount) || amount <= 0) {
        return res
          .status(400)
          .json({ message: "El monto debe ser un número positivo." });
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado." });
      }

      const updatedUser = await UserEconomyService.substractGems(user, amount);

      return res.json({
        message: `Se descontaron ${amount} gemas de tu cuenta.`,
        gems: updatedUser.gems,
      });
    } catch (error) {
      return res.status(400).json({
        message: "Hubo un error al procesar la operación.",
        error: error.message,
      });
    }
  }

  /**
   * Devuelve el balance de gems del usuario.
   */
  static async getGemsBalance(req, res) {
    try {
      const { userId } = req.params;

      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado." });
      }

      const balance = await UserEconomyService.getGemsBalance(user);
      return res.json({
        message: "Balance de gemas obtenido correctamente.",
        balance,
      });
    } catch (error) {
      return res
        .status(500)
        .json({
          message: "Hubo un error al procesar la operación.",
          error: error.message,
        });
    }
  }
}
