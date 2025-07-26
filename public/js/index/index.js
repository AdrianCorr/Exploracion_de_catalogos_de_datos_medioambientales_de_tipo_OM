// public/js/index.js

import { initResultObserver } from "./index-observe.js";
import { renderResults } from "./index-render.js";
import { showModal } from "./index-modal.js";
import { fetchProcessTypes } from "./index-api.js";

/**
 * Módulo principal: arranca la aplicación al cargar el DOM.
 * - Inicializa el observador de cambios en el contenedor de resultados.
 * - Configura el botón de búsqueda de procesos.
 */
document.addEventListener("DOMContentLoaded", () => {
  // Registrar el observer para procesar JSON cuando cambie el contenedor
  initResultObserver((jsonData) => {
    renderResults(jsonData);
  });

  // Configurar búsqueda de procesos al hacer clic en el botón
  const btn = document.getElementById("searchProcess");
  btn.addEventListener("click", async () => {
    const resultsContainer = document.getElementById("resultDisplay");
    // Mostrar indicador de carga
    resultsContainer.innerHTML = `<p class="loading-text">Cargando…</p>`;

    const vocabulary = document.getElementById("vocabulary").value;
    const searchTerm = document.getElementById("searchTerm").value;

    try {
      // Llamar a la API y desencadenar el observer
      const data = await fetchProcessTypes(vocabulary, searchTerm);
      // Poner el JSON en texto para que el observer lo detecte y renderice
      resultsContainer.textContent = JSON.stringify(data);
    } catch (err) {
      console.error("Error al buscar procesos:", err);
      // Mostrar modal con el mensaje de error
      showModal("Error", document.createTextNode(err.message));
    }
  });
});
