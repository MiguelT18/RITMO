export default class UserEconomyService {
  /**
   * Añade gems al usuario.
   * @param {UserModel} user - Usuario al que se le agregan gems.
   * @param {number} amount - Cantidad de gems a añadir.
   * @returns {Promise<UserModel>} - Usuario actualizado.
   */
  static async addGems(user, amount) {
    try {
      user.gems += amount;
      await user.save(); // Guardar los cambios en la base de datos
      return user;
    } catch (error) {
      throw new Error("Hubo un error al agregar gemas al usuario.");
    }
  }

  /**
   * Resta gems al usuario si tiene suficientes.
   * @param {UserModel} user - Usuario al que se le restan gems.
   * @param {number} amount - Cantidad de gems a restar.
   * @returns {Promise<UserModel>} - Usuario actualizado o error si no tiene suficientes gems.
   */
  static async substractGems(user, amount) {
    try {
      if (user.gems < amount) {
        throw new Error("No hay suficientes gemas para realizar la operación.");
      }
      user.gems -= amount;
      await user.save(); // Guardar los cambios en la base de datos
      return user;
    } catch (error) {
      throw new Error(
        "No tienes suficientes gemas para realizar la operación."
      );
    }
  }

  static async getGemsBalance(user) {
    try {
      return user.gems;
    } catch (error) {
      throw new Error("Hubo un error al obtener el balance de gemas.");
    }
  }
}
