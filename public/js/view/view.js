// public/js/view/view.js

import {
  fetchFilterFeatureOfInterest,
  drawPointFeaturesOnMap,
  getColor,
  toCSV,
  groupByStation,
  parseViewParams
} from "./view-utils.js";

let currentChart = null;

// Extraemos los parámetros de la URL
const { procedure, startDate, endDate, featureTypeName } = parseViewParams();

// Mapea featureTypeName al layer WFS correcto
const wfsLayerMap = {
  'ctd_intecmar.estacion':             'ccmm:observacion_ctd_wfs',
  'wrf_meteogalicia.grid_modelo_wrf':  'ccmm:prediccion_diaria_wrf_wfs',
  'roms_meteogalicia.grid_modelo_roms':'ccmm:prediccion_diaria_roms_wfs'
};
const wfsTypeName = wfsLayerMap[featureTypeName];

/**
 * Oculta mapa y filtro de procedure si no estamos en CTD.
 */
function configureFilters() {
  if (featureTypeName !== 'ctd_intecmar.estacion') {
    const mapF = document.getElementById('mapFilter');
    const procF = document.getElementById('procedureFilter');
    if (mapF)  mapF.style.display  = 'none';
    if (procF) procF.style.display = 'none';
  }
}

/**
 * Ajusta el <h1> según el modelo: CTD, WRF o ROMS.
 */
function setPageTitle() {
  const titles = {
    'ctd_intecmar.estacion': 'CTD Viewer',
    'wrf_meteogalicia.grid_modelo_wrf':     'WRF Viewer',
    'roms_meteogalicia.grid_modelo_roms':   'ROMS Viewer'
  };
  document.getElementById('pageTitle').textContent = titles[featureTypeName];
}

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
function createJsonModal() {
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
  modal.querySelector(".modal-close")
       .addEventListener("click", () => hideModal(modal));
}

/**
 * Inicializa en el DOM un modal con:
 *  - Lista de checkboxes para elegir variables.
 *  - Un canvas para el gráfico.
 * El modal se cierra con el botón de cierre y destruye el chart activo.
 */
function createChartModal() {
  if (document.getElementById("chartModal")) return;

  const modal = document.createElement("div");
  modal.id = "chartModal";
  modal.classList.add("chart-modal");
  modal.innerHTML = `
    <button class="modal-close" aria-label="Cerrar">&times;</button>
    <h3>Selecciona variables para el gráfico:</h3>
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
function showJsonModal(data) {

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
function showChartForStation(data) {
  const modal = document.getElementById("chartModal");
  const canvas = document.getElementById("chartCanvas");
  const checkboxes = modal.querySelectorAll("input[type=checkbox]");

  checkboxes.forEach((cb, i) => cb.checked = (i === 0));
  showModal(modal);

  function updateChart() {
    const selected = Array.from(checkboxes)
                          .filter(c => c.checked)
                          .map(c => c.value);
    if (currentChart) currentChart.destroy();
    const datasets = selected.map((field, idx) => ({
      label: field,
      data: data
        .filter(d => d.properties[field] != null && d.properties.profundidad != null)
        .map(d => ({ x: d.properties[field], y: +d.properties.profundidad })),
      showLine: false,
      pointRadius: 4,
      backgroundColor: getColor(idx)
    }));
    currentChart = new Chart(canvas, {
      type: 'scatter',
      data: { datasets },
      options: {
        responsive: true,
        scales: {
          x: { title: { display: true, text: 'Value' }, beginAtZero: false },
          y: { title: { display: true, text: 'Depth (m)' }, reverse: true }
        }
      }
    });
  }

  checkboxes.forEach(cb => cb.addEventListener("change", updateChart));
  updateChart();
}

// Inicialización de modales
createJsonModal();
createChartModal();

/**
 * Punto de entrada principal.
 * - Lee parámetros de la URL (procedure, fechas, featureTypeName).
 * - Inicializa el mapa Leaflet con herramientas de dibujo de BBox.
 * - Carga y dibuja las features iniciales.
 * - Configura el handler de búsqueda y renderizado de resultados.
 */
document.addEventListener("DOMContentLoaded", async () => {

  // 1. Configurar título de la página y los filtros
  setPageTitle();
  configureFilters();

  // 2. Rellenar los inputs del formulario con los valores obtenidos
  document.getElementById("procedure").value = procedure;
  document.getElementById("startDate").value = startDate;
  document.getElementById("endDate").value   = endDate;

  // 3. Ajustar las URLs de los iconos de Leaflet (workaround CDN)
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
    iconUrl:       "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
    shadowUrl:     "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png"
  });

  // 4. Inicializar mapa centrado en Galicia y capa base OpenStreetMap
  const galiciaCenter = [43.05, -8.15];
  const map = L.map("map").setView(galiciaCenter, 7);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);

  // 5. Configurar controles de zoom y “home” si está disponible
  map.zoomControl.remove();
  if (L.Control && L.Control.zoomHome) {
    new L.Control.zoomHome({
      position: "topleft",
      homeCoordinates: galiciaCenter,
      homeZoom: 8,
      zoomHomeIcon: "home",
      zoomHomeTitle: "Volver al inicio"
    }).addTo(map);
  }

  // 6. Añadir herramienta de dibujo de BBox y elemento para mostrar coordenadas
  const drawnItems = new L.FeatureGroup();
  map.addLayer(drawnItems);
  map.addControl(new L.Control.Draw({
    draw: {
      polygon: false,
      polyline: false,
      circle: false,
      circlemarker: false,
      marker: false,
      rectangle: { shapeOptions: { color: "#97009c" } }
    },
    edit: { featureGroup: drawnItems, edit: true, remove: true }
  }));

  const coordsDiv = document.getElementById("bbox-coordinates");
  const emptyHTML = `
    <span class="coordinate-label">Coordenadas del BBox:</span><br>
    <span class="coordinate-label">SW:</span><br>
    <span class="coordinate-label">NE:</span>
  `;
  coordsDiv.innerHTML = emptyHTML;

  // Al crear un BBox, actualizar coordenadas; al borrar, resetear
  map.on("draw:created", e => {
    drawnItems.clearLayers();
    drawnItems.addLayer(e.layer);
    const b = e.layer.getBounds();
    coordsDiv.innerHTML = `
      <span class="coordinate-label">Coordenadas del BBox:</span><br>
      <span class="coordinate-label">SW:</span> ${b.getSouthWest().lat.toFixed(6)} ${b.getSouthWest().lng.toFixed(6)}<br>
      <span class="coordinate-label">NE:</span> ${b.getNorthEast().lat.toFixed(6)} ${b.getNorthEast().lng.toFixed(6)}
    `;
  });
  map.on("draw:deleted", () => coordsDiv.innerHTML = emptyHTML);

  // 7. Cargar y dibujar marcadores iniciales sin filtro de geometría
  try {
    const features = await fetchFilterFeatureOfInterest(featureTypeName);
    drawPointFeaturesOnMap(map, features);
  } catch (err) {
    console.error("Error al cargar features:", err);
  }

  // 8. Configurar el botón de búsqueda para consultar Geoserver y mostrar resultados
  const resultsDiv = document.getElementById("resultsList");
  document.getElementById("searchBtn").addEventListener("click", async () => {
    
    const resultsDiv = document.getElementById("resultsList");
    const counterSpan = document.getElementById("resultsCounter");

    // Indicar estado de “cargando”
    resultsDiv.innerHTML = "Cargando…";
    counterSpan.textContent = "Resultados mostrados: 0 Resultados encontrados: 0";

    // Recoger filtros de tiempo
    const startVal = document.getElementById("startDate").value;
    const endVal   = document.getElementById("endDate").value;

    const params = new URLSearchParams({ typeName: wfsTypeName });
    if (startVal) params.append("startTime", new Date(startVal).toISOString());
    if (endVal)   params.append("endTime",   new Date(endVal).toISOString());

    // Para CTD, añadimos también procedure y bbox
    if (featureTypeName === "ctd_intecmar.estacion") {
      const procedureVal = document.getElementById("procedure").value;
      if (procedureVal) params.append("procedure", procedureVal);

      const bboxLayer = drawnItems.getLayers()[0];
      if (bboxLayer) {
        const b = bboxLayer.getBounds();
        params.append("bbox",
          `${b.getSouthWest().lng},${b.getSouthWest().lat},` +
          `${b.getNorthEast().lng},${b.getNorthEast().lat}`
        );
      }
    }

    // Realizar fetch y procesar respuesta
    try {
      const resp = await fetch(`/api/geoserver-data?${params.toString()}`);

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();

      // WRF/ROMS: tabla simple con Name, Phenomenon Time, Result Time, Details
      if (featureTypeName !== "ctd_intecmar.estacion") {
        const features = json.features || [];
        const total = features.length;
        counterSpan.textContent =
          `Resultados mostrados: ${total} Resultados encontrados: ${total}`;

        if (total === 0) {
          resultsDiv.innerHTML = `<div>No results found.</div>`;
          return;
        }

        // Construir tabla
        let html = `
         <table class="results-table">
           <thead>
             <tr>
               <th>Name</th>
               <th>Phenomenon Time</th>
               <th>Result Time</th>
               <th>Details</th>
             </tr>
           </thead>
           <tbody>
        `;
        for (const feat of features) {
         const p = feat.properties;
         const name  = p.nombre || p.name || "—";
         const pheno = (p.phenomenon_time_start && p.phenomenon_time_end) ? `[${p.phenomenon_time_start} - ${p.phenomenon_time_end}]` : (p.phenomenon_time || "—");
         const result = p.result_time || "—";
         const dataJson  = JSON.stringify([feat]);
         const dataChart = JSON.stringify([feat]);

         // Generamos el botón correspondiente (Show Chart, WRF Viewer, ROMS Viewer)
         let viewerBtn = `<button onclick='showChartForStation(${dataChart})'>Show Chart</button>`;
          if (featureTypeName === 'wrf_meteogalicia.grid_modelo_wrf') {
            viewerBtn = `
              <button class="results-table--btn"
                  onclick="window.open('view-map.html?coverageId=${encodeURIComponent(p.subsamples_coverage)}&featureTypeName=${encodeURIComponent(featureTypeName)}','_blank')">
                  WRF Viewer
              </button>`;
          } else if (featureTypeName === 'roms_meteogalicia.grid_modelo_roms') {
              viewerBtn = `
                <button class="results-table--btn"
                  onclick="window.open('view-map.html?coverageId=${encodeURIComponent(p.subsamples_coverage)}&featureTypeName=${encodeURIComponent(featureTypeName)}','_blank')">
                  ROMS Viewer
                </button>`;
          }

          html += `
            <tr>
              <td>${name}</td>
              <td>${pheno}</td>
              <td>${result}</td>
              <td>
                <button onclick='showJsonModal(${dataJson})'>Show JSON</button>
                ${viewerBtn}
              </td>
            </tr>
          `;
        }
        html += `</tbody></table>`;
        resultsDiv.innerHTML = html;
        return;
     }

     // CTD: agrupar por estación y render completo…
     const itemsTotal = Number.isInteger(json.totalCount)
       ? json.totalCount
       : (json.features || []).length;
     const grouped = groupByStation(json.features || []);
     const itemsShown = Object.values(grouped)
       .reduce((sum, g) => sum + g.observations.length, 0);
     counterSpan.textContent =
       `Resultados mostrados: ${itemsShown} Resultados encontrados: ${itemsTotal}`;

     if (itemsTotal === 0) {
       resultsDiv.innerHTML = `<div>No results found.</div>`;
       return;
     }

      let html = `
        <table class="results-table">
          <thead>
            <tr>
              <th>Name</th><th>Procedure</th><th>Result time</th>
              <th>Phenomenon Time</th><th>Depth</th><th>Details</th>
            </tr>
          </thead>
          <tbody>
      `;
      for (const [name, grp] of Object.entries(grouped)) {
        const { observations, resultTime, procedure } = grp;
        // Calcular rango de tiempo y profundidad
        const times  = observations.map(o => new Date(o.properties.phenomenon_time).getTime()).filter(Boolean);
        const depths = observations.map(o => parseFloat(o.properties.profundidad)).filter(n => !isNaN(n));
        const pMin   = new Date(Math.min(...times));
        const pMax   = new Date(Math.max(...times));
        const dMin   = Math.min(...depths);
        const dMax   = Math.max(...depths);
        const pRange = `[${pMin.toISOString().slice(0,16).replace("T"," ")}, ${pMax.toISOString().slice(0,16).replace("T"," ")}]`;
        const dRange = `[${dMin}, ${dMax}]`;

        // Crear JSON y Chart data
        const jsonData  = JSON.stringify(observations);
        const chartData = JSON.stringify(observations);

        html += `
          <tr>
            <td>${name}</td>
            <td>${procedure}</td>
            <td>${resultTime || "-"}</td>
            <td>${pRange}</td>
            <td>${dRange}</td>
            <td>
              <button onclick='showJsonModal(${jsonData})'>Show JSON</button>
              <button onclick='showChartForStation(${chartData})'>Show Chart</button>
            </td>
          </tr>
        `;
      }
      html += `</tbody></table>`;
      resultsDiv.innerHTML = html;

    } catch (err) {
      resultsDiv.innerHTML    = `<div class="error-msg">Error al consultar Geoserver: ${err.message}</div>`;
      counterSpan.textContent = `Resultados mostrados: 0 Resultados encontrados: 0`;
    }
  });

  // 9. Limpiar resultados al iniciar la página
  resultsDiv.innerHTML = "";
});

// Exponer funciones globales para modales y gráficos
window.showJsonModal       = showJsonModal;
window.showChartForStation = showChartForStation;
