// public/js/view/view.js

import {
  fetchFilterFeatureOfInterest,
  drawPointFeaturesOnMap
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
function createJsonModal() {
  if (document.getElementById("jsonModal")) return;
  const modal = document.createElement("div");
  modal.id = "jsonModal";
  modal.classList.add("json-modal");
  modal.innerHTML = `
    <div class="modal-header">
      <h3>JSON Data</h3>
      <button class="modal-close" aria-label="Cerrar">&times;</button>
    </div>
    <div class="modal-body">
      <!-- Contador de elementos -->
      <div id="jsonCount">Items: <span id="jsonCountNum">0</span></div>
      <pre id="jsonContent"></pre>
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

/**
 * Devuelve un color de la paleta según índice.
 * La paleta tiene hasta 13 colores; cicla si i >= length.
 * @param {number} i Índice de dataset.
 * @returns {string} Color en hex.
 */
function getColor(i) {
  const colors = [
    "#3366cc","#dc3912","#ff9900","#109618","#990099",
    "#0099c6","#dd4477","#66aa00","#b82e2e","#316395",
    "#994499","#22aa99","#aaaa11"
  ];
  return colors[i % colors.length];
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
  // 1. Parsear parámetros de la URL y asignarlos a variables
  const params          = new URLSearchParams(window.location.search);
  const procedure       = params.get("procedure")        || "";
  const startDate       = params.get("startDate")        || "";
  const endDate         = params.get("endDate")          || "";
  const featureTypeName = params.get("featureTypeName")  || "ctd_intecmar.estacion";

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
  const galiciaCenter = [42.7, -8.0];
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
    counterSpan.textContent = `(0/0)`;

    // Recoger valores del formulario y construir query params
    const procedureVal = document.getElementById("procedure").value;
    const startVal = document.getElementById("startDate").value;
    const endVal = document.getElementById("endDate").value;
    const params = new URLSearchParams({ typeName: "ccmm:observacion_ctd_wfs" });
    if (procedureVal) params.append("procedure", procedureVal);
    if (startVal) params.append("startTime", new Date(startVal).toISOString());
    if (endVal) params.append("endTime", new Date(endVal).toISOString());

    // Agregar filtro BBox si existe
    const bboxLayer = drawnItems.getLayers()[0];
    if (bboxLayer) {
      const b = bboxLayer.getBounds();
      params.append("bbox",
        `${b.getSouthWest().lng},${b.getSouthWest().lat},` +
        `${b.getNorthEast().lng},${b.getNorthEast().lat}`
      );
    }

    // Realizar fetch y procesar respuesta
    try {
      const resp = await fetch(`/api/geoserver-data?${params.toString()}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();

      // Calcular total real y agrupar por nombre de estación
      const itemsTotal = Number.isInteger(json.totalCount)
        ? json.totalCount
        : (json.features || []).length;
      const features = json.features || [];
      const grouped = {};
      for (const f of features) {
        const props = f.properties;
        const name = props.nombre || "Sin nombre";
        if (!grouped[name]) {
          grouped[name] = {
            observations: [],
            resultTime: props.result_time,
            procedure: props.procedure
          };
        }
        grouped[name].observations.push(f);
      }

      // Actualizar contador y mostrar tabla o mensaje de “no resultados”
      const itemsShown = Object.values(grouped).reduce((sum, g) => sum + g.observations.length, 0);
      counterSpan.textContent = `(${itemsShown}/${itemsTotal})`;

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
        const times  = observations
                        .map(o => new Date(o.properties.phenomenon_time).getTime())
                        .filter(Boolean);
        const depths = observations
                        .map(o => parseFloat(o.properties.profundidad))
                        .filter(n => !isNaN(n));
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
      counterSpan.textContent = `(0/0)`;
    }
  });

  // 9. Limpiar resultados al iniciar la página
  resultsDiv.innerHTML = "";
});

// Exponer funciones globales para modales y gráficos
window.showJsonModal       = showJsonModal;
window.showChartForStation = showChartForStation;
