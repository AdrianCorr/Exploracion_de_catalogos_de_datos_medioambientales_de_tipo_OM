// public/js/filter/filter-events.js

import { filterProcesses } from "./filter-utils.js";
import { renderResults } from "./filter-render.js";

export function setupEventListeners() {
  // 1) Rellenar el campo processType desde query string
  const params = new URLSearchParams(window.location.search);
  const processType = params.get("processType") || "";
  document.getElementById("processType").value = decodeURIComponent(processType);

  // 2) Listener del form “Aplicar Filtro”
  const form = document.getElementById("filterForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    document.getElementById("filterError").textContent = "";
    const resultsContainer = document.getElementById("filterResults");
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
      // 1) Recoger todos los checkboxes marcados
      const checked = document.querySelectorAll(".result-checkbox:checked");
      if (checked.length === 0) {
        alert("Por favor, seleccione al menos una fila para visualizar.");
        return;
      }

      // 2) Extraer arrays de start y end
      const startTimes = [];
      const endTimes   = [];
      const procedureIds   = [];

      checked.forEach((cb) => {
        const st = cb.dataset.start || "";
        const en = cb.dataset.end   || "";
        const id = cb.dataset.procedure || "";
        if (!st || !en) {
          console.error("Falta data-start o data-end en:", cb);
          alert("Error interno: faltan datos de fecha en alguna fila seleccionada.");
          return;
        }
        startTimes.push(st);
        endTimes.push(en);
        procedureIds.push(id);
      });

      // Si no se recogió nada válido:
      if (startTimes.length === 0 || endTimes.length === 0) {
        alert("No se pudo extraer fechas válidas.");
        return;
      }

      // 3) Calcular startGlobal = fecha máxima de startTimes
      //    y endGlobal = fecha mínima de endTimes
      //    (comparar strings ISO es válido)
      const maxStart = startTimes.reduce((prev, cur) => (prev > cur ? prev : cur));
      const minEnd   = endTimes.reduce((prev, cur) => (prev < cur ? prev : cur));

      // 4) Construir URL: view.html?processTypeName=xxx&startTime=<maxStart>&endTime=<minEnd>
      const params = new URLSearchParams();
      params.append("procedure", procedureIds.join(","));
      params.append("startTime", maxStart);
      params.append("endTime",   minEnd);

      window.open(`view.html?${params.toString()}`, "_blank");
    };
  }
}
