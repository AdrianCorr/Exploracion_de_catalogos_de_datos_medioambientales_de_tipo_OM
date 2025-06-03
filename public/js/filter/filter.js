/**
 * filter.js — Punto de entrada para el módulo “Filtrar Proceso”.
 * Importa listeners y demás componentes.
 */

import { setupEventListeners } from "./filter-events.js";

document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
});
