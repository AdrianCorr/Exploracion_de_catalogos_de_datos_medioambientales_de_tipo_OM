// public/js/main.js

import { initResultObserver } from "./observer.js";
import { renderResults } from "./renderer.js";
import { showModal } from "./modal.js";
import { fetchProcessTypes } from "./api.js";

/**
 * Punto de entrada principal. Monta listeners y arranca el observer.
 */
document.addEventListener("DOMContentLoaded", () => {
  // 1) Inicializar el observer de resultados:
  initResultObserver((jsonData) => {
    renderResults(jsonData);
  });

  // 2) Listener del botón “Buscar Procesos”
  const btn = document.getElementById("searchProcess");
  btn.addEventListener("click", async () => {
    const vocabulary = document.getElementById("vocabulary").value;
    const searchTerm = document.getElementById("searchTerm").value;

    try {
      const data = await fetchProcessTypes(vocabulary, searchTerm);
      // Poner el JSON crudo en el contenedor para que el observer lo detecte
      document.getElementById("resultDisplay").textContent = JSON.stringify(data);
    } catch (err) {
      console.error("Error al buscar procesos:", err);
      // Mostrar modal de error
      showModal("Error", document.createTextNode(err.message));
    }
  });
});
