/**
 * filter-events.js — Configuración de listeners para:
 *  • setupEventListeners: escucha el formulario y ejecuta filterProcesses + renderResults
 *  • setupResultInteractions: listener en “Seleccionar todo” y “View Observations”
 */

import { filterProcesses } from "./filter-utils.js";
import { renderResults } from "./filter-render.js";

export function setupEventListeners() {
  // Rellenar el campo processType desde queryString
  const params = new URLSearchParams(window.location.search);
  const processType = params.get("processType") || "";
  document.getElementById("processType").value = decodeURIComponent(processType);

  // Listener del form
  const form = document.getElementById("filterForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const resultsContainer = document.getElementById("filterResults");
    document.getElementById("filterError").textContent = "";
    resultsContainer.innerHTML = "";

    // Ocultar cabecera mientras no haya datos
    document.querySelector(".results-header").style.display = "none";

    const typeName  = document.getElementById("processType").value.trim();
    const keyword   = document.getElementById("keywords").value.trim();
    const startTime = document.getElementById("startDate").value;
    const endTime   = document.getElementById("endDate").value;

    try {
      const data = await filterProcesses(typeName, keyword, startTime, endTime);
      renderResults(data);
    } catch (err) {
      const errorMsg = document.createElement("div");
      if (err.message.includes("500")) {
        errorMsg.textContent = "⚠️ Por favor, asegúrese de ingresar también la fecha de fin.";
      } else {
        errorMsg.textContent = `⚠️ ${err.message}`;
      }
      errorMsg.className = "error-msg";
      resultsContainer.appendChild(errorMsg);
    }
  });
}

export function setupResultInteractions() {
  // “Seleccionar todo”
  const selectAllBtn = document.getElementById("selectAllButton");
  if (selectAllBtn) {
    selectAllBtn.onclick = () => {
      const checkboxes = document.querySelectorAll(".result-checkbox");
      const allChecked = Array.from(checkboxes).every((cb) => cb.checked);
      checkboxes.forEach((cb) => (cb.checked = !allChecked));
      selectAllBtn.classList.toggle("active", !allChecked);
    };
  }

  // “View Observations”
  const viewObsBtn = document.getElementById("viewObservationsButton");
  if (viewObsBtn) {
    viewObsBtn.onclick = () => {
      // 1) Recoge todos los checkboxes marcados
      const checked = document.querySelectorAll(".result-checkbox:checked");
      if (checked.length === 0) {
        alert("Por favor, seleccione al menos un proceso para visualizar.");
        return;
      }

      // 2) Extrae, de cada checkbox, el featureTypeName que tengas guardado
      //    (aquí asumimos que el checkbox tiene data-feature-type="ctd_intecmar.ria")
      const featureTypes = Array.from(checked).map((cb) =>
        cb.dataset.featureType // ej. "ctd_intecmar.ria"
      );

      // 3) Construye query string: ?featureTypeName=ctd_intecmar.ria&featureTypeName=...&…
      const params = new URLSearchParams();
      featureTypes.forEach((ft) => params.append("featureTypeName", ft));

      window.open(`view.html?${params.toString()}`, "_blank");
    };
  }
}
