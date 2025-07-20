// public/js/filter/filter.js

/**
 * filter.js
 * Punto de entrada del módulo de filtrado de procesos.
 * - Registra los event listeners al cargar la página.
 */
import { setupEventListeners } from "./filter-events.js";

// Inicializar eventos tras cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
});