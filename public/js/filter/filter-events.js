// public/js/filter/filter-events.js

import { filterProcesses } from "./filter-utils.js";
import { renderResults } from "./filter-render.js";

/**
 * Inicializa los eventos de la interfaz de filtrado:
 * - Carga el tipo de proceso desde la query string.
 * - Gestiona el envío del formulario para aplicar el filtro.
 */
export function setupEventListeners() {
  // Cargar 'processType' desde la URL y asignarlo al campo correspondiente
  const params = new URLSearchParams(window.location.search);
  const processType = decodeURIComponent(params.get("processType") || "");
  document.getElementById("processType").value = processType;

  // Enviar formulario de filtro
  const form = document.getElementById("filterForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Validación: si hay fecha de inicio, se requiere fecha de fin
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    if (startDate && !endDate) {
      // Mostrar error en resultados y eliminar cualquier anterior
      const resultsContainer = document.getElementById("filterResults");
      resultsContainer.innerHTML = `<div class='error-msg'>⚠️ Por favor, asegúrese de ingresar también la fecha de fin.</div>`;
      document.querySelector(".results-header").style.display = "none";
      return;
    }

    // Borrar mensajes de error anteriores y centrar en resultados
    const resultsContainer = document.getElementById("filterResults");
    resultsContainer.innerHTML = "<p class='loading-text'>Cargando...</p>";
    document.querySelector(".results-header").style.display = "none";

    // Recoger valores de los filtros
    const typeName = document.getElementById("processType").value.trim();
    const keyword = document.getElementById("keywords").value.trim();

    try {
      // Llamar a la API y renderizar resultados
      const data = await filterProcesses(typeName, keyword, startDate, endDate);
      renderResults(data);
    } catch (err) {
      // Reemplazar contenido con mensaje de error (sin spinner)
      resultsContainer.innerHTML = `<div class='error-msg'>${err.message.includes("500")
        ? "⚠️ Por favor, asegúrese de ingresar también la fecha de fin."
        : `⚠️ ${err.message}`}
      </div>`;
      document.querySelector(".results-header").style.display = "none";
    }
  });("submit", async (e) => {
    e.preventDefault();

    // Validación: si hay fecha de inicio, se requiere fecha de fin
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    if (startDate && !endDate) {
      document.getElementById("filterError").textContent =
        "⚠️ Por favor, asegúrese de ingresar también la fecha de fin.";
      return;
    }

    // Borrar mensajes anteriores y preparar contenedor de resultados
    document.getElementById("filterError").textContent = "";
    const resultsContainer = document.getElementById("filterResults");
    resultsContainer.innerHTML = "<p class='loading-text'>Cargando...</p>";
    document.querySelector(".results-header").style.display = "none";

    // Recoger valores de los filtros
    const typeName = document.getElementById("processType").value.trim();
    const keyword = document.getElementById("keywords").value.trim();

    try {
      // Llamar a la API y renderizar resultados
      const data = await filterProcesses(typeName, keyword, startDate, endDate);
      renderResults(data);
    } catch (err) {
      // Limpiar indicador de carga y mostrar mensaje de error
      resultsContainer.innerHTML = "";
      document.getElementById("filterError").textContent =
        err.message.includes("500")
          ? "⚠️ Por favor, asegúrese de ingresar también la fecha de fin."
          : `⚠️ ${err.message}`;
    }
  });
}

/**
 * Activa las interacciones tras renderizar los resultados:
 * - Botón de 'Seleccionar todo'.
 * - Botón de 'Ver observaciones' para las filas seleccionadas.
 */
export function setupResultInteractions() {
  // Toggle de selección masiva
  const selectAllBtn = document.getElementById("selectAllButton");
  if (selectAllBtn) {
    selectAllBtn.onclick = () => {
      const checkboxes = document.querySelectorAll(".result-checkbox");
      const allChecked = Array.from(checkboxes).every(cb => cb.checked);
      checkboxes.forEach(cb => cb.checked = !allChecked);
      selectAllBtn.classList.toggle("active", !allChecked);
    };
  }

  // Abrir vista de observaciones para las filas marcadas
  const viewObsBtn = document.getElementById("viewObservationsButton");
  if (viewObsBtn) {
    viewObsBtn.onclick = () => {
      const checked = document.querySelectorAll(".result-checkbox:checked");
      if (checked.length === 0) {
        alert("Por favor, seleccione al menos una fila para visualizar.");
        return;
      }

      const processType = document.getElementById("processType").value;
      const startTimes = [];
      const endTimes = [];
      const procedureIds = [];

      checked.forEach(cb => {
        const st = cb.dataset.start || "";
        let en = cb.dataset.end || "";
        const id = cb.dataset.procedure || "";
        if (!st) {
          console.error("Falta data-start en:", cb);
          alert("Error interno: faltan datos de fecha en alguna fila seleccionada.");
          return;
        }
        // En caso de no haber fecha de fin, usar la actual
        if (!en) {
          en = new Date().toISOString();
        }
        startTimes.push(st);
        endTimes.push(en);
        procedureIds.push(id);
      });

      if (!startTimes.length || !endTimes.length) {
        alert("No se pudo extraer fechas válidas.");
        return;
      }

      // Calcular fecha máxima de inicio y mínima de fin
      const minStart = startTimes.reduce((a, b) => a < b ? a : b);
      const maxEnd = endTimes.map(ts => ts.split('.')[0]).reduce((a, b) => a > b ? a : b);

      // Eliminar duplicados de procedureIds
      const uniqueProcedures = Array.from(new Set(procedureIds.filter(id => id)));

      // Abrir nueva ventana con parámetros filtrados
      const params = new URLSearchParams({
        procedure: uniqueProcedures.join(","),
        startDate: minStart,
        endDate: maxEnd,
        featureTypeName: processType
      });
      window.open(`view.html?${params.toString()}`, "_blank");
    };
  }
}
