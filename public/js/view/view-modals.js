// view-modals.js

import {
  getColor,
  toCSV
} from "./view-utils.js";

let currentChart = null;

/**
 * Overlay compartido para todos los modales.
 * Al hacer click sobre él, cierra el modal JSON y el modal Chart.
 */
const overlay = document.createElement("div");
overlay.id = "modalOverlay";
overlay.classList.add("modal-overlay");
document.body.appendChild(overlay);
overlay.addEventListener("click", () => {
  hideModal(document.getElementById("jsonModal"));
  hideModal(document.getElementById("chartModal"));
});

/**
 * Inicializa en el DOM un modal con:
 *  - Cabecera con título “JSON Data” y botón de cierre.
 *  - Cuerpo con contador de elementos y preformateado <pre> para el JSON.
 * No hace nada si ya existe un elemento con id="jsonModal".
 */
export function createJsonModal() {
  if (document.getElementById("jsonModal")) return;
  const modal = document.createElement("div");
  modal.id = "jsonModal";
  modal.classList.add("json-modal");
  modal.innerHTML = `
    <div class="modal-header">
      <h3>JSON Data</h3>
      <!-- Contador de elementos -->
      <div id="jsonCount">Items: <span id="jsonCountNum">0</span></div>
      <button class="modal-close" aria-label="Cerrar">&times;</button>
    </div>
    <div class="modal-body">
      <pre id="jsonContent"></pre>
    </div>
    <!-- Acciones de descarga: siempre visibles -->
    <div class="modal-actions">
      <button id="downloadJsonBtn">Descargar JSON</button>
      <button id="downloadCsvBtn">Descargar CSV</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector(".modal-close").addEventListener("click", () => hideModal(modal));
}

/**
 * Inicializa en el DOM un modal con:
 *  - Lista de checkboxes para elegir variables.
 *  - Un canvas para el gráfico.
 * El modal se cierra con el botón de cierre y destruye el chart activo.
 */
export function createChartModal() {
  if (document.getElementById("chartModal")) return;

  const modal = document.createElement("div");
  modal.id = "chartModal";
  modal.classList.add("chart-modal");
  modal.innerHTML = `
    <button class="modal-close" aria-label="Cerrar">&times;</button>
    <h3>Gráfico de Estación</h3>
    <div id="chartVariables">
      <label><input type="checkbox" value="temperatura_its90"> temperatura_its90</label>
      <label><input type="checkbox" value="salinidad"> salinidad</label>
      <label><input type="checkbox" value="presion"> presion</label>
      <label><input type="checkbox" value="ph"> ph</label>
      <label><input type="checkbox" value="oxigeno"> oxigeno</label>
      <label><input type="checkbox" value="transmitancia"> transmitancia</label>
      <label><input type="checkbox" value="irradiancia"> irradiancia</label>
      <label><input type="checkbox" value="fluorescencia_uv"> fluorescencia_uv</label>
      <label><input type="checkbox" value="fluorescencia"> fluorescencia</label>
      <label><input type="checkbox" value="densidad"> densidad</label>
      <label><input type="checkbox" value="profundidad"> profundidad</label>
      <label><input type="checkbox" value="temperatura-its68"> temperatura-its68</label>
      <label><input type="checkbox" value="conductividad"> conductividad</label>
    </div>
    <canvas id="chartCanvas" width="800" height="500"></canvas>
  `;
  document.body.appendChild(modal);

  modal.querySelector(".modal-close")
       .addEventListener("click", () => {
         hideModal(modal);
         if (currentChart) { currentChart.destroy(); currentChart = null; }
       });
}

/**
 * Muestra el modal dado y el overlay asociado.
 * @param modalEl Elemento <div> del modal a mostrar.
 */
function showModal(modalEl) {
  overlay.style.display = "block";
  modalEl.style.display = "block";
}

/**
 * Oculta el modal dado y el overlay asociado.
 * @param modalEl Elemento <div> del modal a ocultar.
 */
function hideModal(modalEl) {
  overlay.style.display = "none";
  modalEl.style.display = "none";
}

/**
 * Rellena y muestra el modal JSON.
 * - Extrae `feature.properties` de cada feature.
 * - Actualiza contador de elementos.
 * - Inyecta HTML coloreando las claves con <span class="json-key">.
 * @param {Array<Object>} data Array de GeoJSON Feature objects.
 */
export function showJsonModal(data) {

  const propsArray = data.map(feature => feature.properties);

  document.getElementById("jsonCountNum").textContent = propsArray.length;

  const raw = JSON.stringify(propsArray, null, 2).replace(/"([^"]+)":/g, '"<span class="json-key">$1</span>":');
  const content = document.getElementById("jsonContent");
  content.innerHTML = raw;

  // Botones de descarga
  const btnJson = document.getElementById("downloadJsonBtn");
  const btnCsv  = document.getElementById("downloadCsvBtn");

  // Descargar JSON puro
  btnJson.onclick = () => {
    const blob = new Blob([JSON.stringify(propsArray, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Descargar CSV
  btnCsv.onclick = () => {
    const csv = toCSV(propsArray);
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "data.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  showModal(document.getElementById("jsonModal"));
}

/**
 * Muestra el modal de gráfico para una estación.
 * - Inicialmente selecciona la primera variable.
 * - Reconstruye el scatter plot al cambiar checkboxes.
 * @param {Array<Object>} data Array de GeoJSON Feature objects.
 */
export function showChartForStation(data) {
  const modal = document.getElementById("chartModal");
  const canvas = document.getElementById("chartCanvas");

  // Obtenemos los checkboxes ya existentes en el modal
  const checkboxes = modal.querySelectorAll("input[type=checkbox]");

  // Marcamos el primero por defecto
  checkboxes.forEach((cb, i) => (cb.checked = i === 0));

  // Agrupamos los checkboxes en un contenedor estético
  let selectorsContainer = modal.querySelector(".chart-selectors");
  if (!selectorsContainer) {
    selectorsContainer = document.createElement("div");
    selectorsContainer.classList.add("chart-selectors");

    // Movemos los checkboxes existentes dentro del contenedor
    checkboxes.forEach((cb) => {
      const label = cb.closest("label") || document.createElement("label");
      if (!label.contains(cb)) label.appendChild(cb);
      selectorsContainer.appendChild(label);
    });

    // Insertamos el contenedor antes del canvas
    canvas.parentElement.insertBefore(selectorsContainer, canvas);
  }

  // Mostramos el modal
  showModal(modal);

  function updateChart() {
    const selected = Array.from(checkboxes)
      .filter((c) => c.checked)
      .map((c) => c.value);

    if (currentChart) currentChart.destroy();

    const datasets = selected.map((field, idx) => ({
      label: field,
      data: data
        .filter(
          (d) =>
            d.properties[field] != null &&
            d.properties.profundidad != null
        )
        .map((d) => ({
          x: d.properties[field],
          y: +d.properties.profundidad,
        })),
      showLine: false,
      pointRadius: 4,
      backgroundColor: getColor(idx),
    }));

    currentChart = new Chart(canvas, {
      type: "scatter",
      data: { datasets },
      options: {
        responsive: true,
        scales: {
          x: { title: { display: true, text: "Value" }, beginAtZero: false },
          y: { title: { display: true, text: "Depth (m)" }, reverse: true },
        },
      },
    });
  }

  // Listeners
  checkboxes.forEach((cb) => cb.addEventListener("change", updateChart));

  // Primera carga
  updateChart();
}
