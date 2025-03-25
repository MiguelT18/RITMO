export default class UserProgressService {
  /**
   * Calcula la experiencia requerida para subir de nivel utilizando un crecimiento lineal.
   *
   * @param {number} level - Nivel actual del usuario.
   * @returns {number} - Experiencia necesaria para alcanzar el siguiente nivel.
   */
  static requiredXpLinear(level) {
    return level * 100;
  }

  /**
   * Calcula la experiencia requerida para subir de nivel utilizando un crecimiento logarítmico.
   * Este método hace que los primeros niveles sean más fáciles de alcanzar y luego se estabiliza.
   *
   * @param {number} level - Nivel actual del usuario.
   * @returns {number} - Experiencia necesaria para alcanzar el siguiente nivel.
   */
  static requiredXpLogarithmic(level) {
    return Math.floor(100 * Math.log(level + 1) * 10);
  }

  /**
   * Calcula la experiencia requerida para subir de nivel utilizando un crecimiento exponencial.
   * A medida que el nivel aumenta, la experiencia requerida crece significativamente.
   *
   * @param {number} level - Nivel actual del usuario.
   * @returns {number} - Experiencia necesaria para alcanzar el siguiente nivel.
   */
  static requiredXpExponential(level) {
    return Math.floor(100 * Math.pow(1.5, level));
  }

  /**
   * Calcula el nuevo nivel y experiencia del usuario tras ganar XP.
   */
  static calculateNewLevelAndExperience(user, xpGained) {
    user.experience += xpGained;

    while (true) {
      const requiredXp = this.calculateRequiredXp(user.level);

      if (user.experience >= requiredXp) {
        user.experience -= requiredXp;
        user.level++;
      } else {
        break;
      }
    }

    // Se calcula nuevamente el requiredXp para el nivel final después del bucle
    const requiredXp = this.calculateRequiredXp(user.level);

    return {
      user: user.toObject ? user.toObject() : { ...user },
      requiredXp,
    };
  }

  /**
   * Calcula la experiencia requerida para el siguiente nivel según el nivel actual.
   */
  static calculateRequiredXp(level) {
    if (level <= 5) {
      return this.requiredXpLinear(level);
    } else if (level <= 15) {
      return this.requiredXpLogarithmic(level);
    } else {
      return this.requiredXpExponential(level);
    }
  }
}
