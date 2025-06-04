/**
 * view-utils.js — Funciones auxiliares para view.html
 *
 * - formatJSON(obj): convierte un objeto JS a un string JSON indentado
 */

export function formatJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}
