/**
 * view-utils.js — Funciones auxiliares para view.html
 *
 * Por ahora, solo exporta una utilidad mínima para formatear texto o JSON,
 * pero podrías ampliar con más helpers si lo necesitas.
 */

/**
 * Dado un objeto JavaScript, devuelve su representación en JSON bien indentado.
 */
export function formatJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}
