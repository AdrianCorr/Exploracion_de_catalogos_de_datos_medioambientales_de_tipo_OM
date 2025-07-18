// public/js/view/view.js

import {
  fetchFilterFeatureOfInterest,
  drawPointFeaturesOnMap
} from "./view-utils.js";

let currentChart = null;

// Crear overlay único para modales
const overlay = document.createElement("div");
overlay.id = "modalOverlay";
overlay.classList.add("modal-overlay");
document.body.appendChild(overlay);
overlay.addEventListener("click", () => {
  hideModal(document.getElementById("jsonModal"));
  hideModal(document.getElementById("chartModal"));
});

// Función para crear el modal JSON
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


// Función para crear el modal Chart
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

// Mostrar/ocultar modales junto al overlay
function showModal(modalEl) {
  overlay.style.display = "block";
  modalEl.style.display = "block";
}
function hideModal(modalEl) {
  overlay.style.display = "none";
  modalEl.style.display = "none";
}

// Abre el JSON modal con los datos formateados
function showJsonModal(data) {
  // 1) Extraemos solo properties de cada feature
  const propsArray = data.map(feature => feature.properties);

  // 2) Actualizamos el contador con el número de elementos
  document.getElementById("jsonCountNum").textContent = propsArray.length;

  // 3) Serializamos y coloreamos las claves
  const raw = JSON.stringify(propsArray, null, 2)
    .replace(/"([^"]+)":/g, '"<span class="json-key">$1</span>":');

  // 4) Inyectamos el HTML formateado
  const content = document.getElementById("jsonContent");
  content.innerHTML = raw;

  // 5) Mostramos el modal
  showModal(document.getElementById("jsonModal"));
}



// Genera y muestra el chart modal
function showChartForStation(data) {
  const modal = document.getElementById("chartModal");
  const canvas = document.getElementById("chartCanvas");
  const checkboxes = modal.querySelectorAll("input[type=checkbox]");

  // Selecciona siempre la primera variable al abrir
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

// Paleta de colores reutilizable
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

// Lógica principal al cargar el DOM
document.addEventListener("DOMContentLoaded", async () => {
  // Leer parámetros de la URL
  const params          = new URLSearchParams(window.location.search);
  const procedure       = params.get("procedure")        || "";
  const startDate       = params.get("startDate")        || "";
  const endDate         = params.get("endDate")          || "";
  const featureTypeName = params.get("featureTypeName")  || "ctd_intecmar.estacion";

  // Asignar valores a inputs
  document.getElementById("procedure").value = procedure;
  document.getElementById("startDate").value = startDate;
  document.getElementById("endDate").value   = endDate;

  // Fix iconos Leaflet CDN
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
    iconUrl:       "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
    shadowUrl:     "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png"
  });

  // Inicializar mapa en Galicia
  const galiciaCenter = [42.7, -8.0];
  const map = L.map("map").setView(galiciaCenter, 7);

  // Capa base OpenStreetMap
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);

  // Eliminar control de zoom por defecto
  map.zoomControl.remove();

  // Añadir ZoomHome si está disponible
  if (L.Control && L.Control.zoomHome) {
    new L.Control.zoomHome({
      position: "topleft",
      homeCoordinates: galiciaCenter,
      homeZoom: 8,
      zoomHomeIcon: "home",
      zoomHomeTitle: "Volver al inicio"
    }).addTo(map);
  }

  // Control de dibujo de BBox
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

  // Área de coordenadas del BBox
  const coordsDiv = document.getElementById("bbox-coordinates");
  const emptyHTML = `
    <span class="coordinate-label">Coordenadas del BBox:</span><br>
    <span class="coordinate-label">SW:</span><br>
    <span class="coordinate-label">NE:</span>
  `;
  coordsDiv.innerHTML = emptyHTML;

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

  // Dibujar marcadores iniciales
  try {
    const features = await fetchFilterFeatureOfInterest(featureTypeName);
    drawPointFeaturesOnMap(map, features);
  } catch (err) {
    console.error("Error al cargar features:", err);
  }

  // Lógica de búsqueda y resultados
  const resultsDiv = document.getElementById("resultsList");

  document.getElementById("searchBtn").addEventListener("click", async () => {
    const resultsDiv = document.getElementById("resultsList");
    const counterSpan = document.getElementById("resultsCounter");

    // Estado inicial
    resultsDiv.innerHTML = "Cargando…";
    counterSpan.textContent = `(0/0)`;

    // Parámetros de filtro
    const procedureVal = document.getElementById("procedure").value;
    const startVal = document.getElementById("startDate").value;
    const endVal = document.getElementById("endDate").value;
    const params = new URLSearchParams({ typeName: "ccmm:observacion_ctd_wfs" });
    if (procedureVal) params.append("procedure", procedureVal);
    if (startVal) params.append("startTime", new Date(startVal).toISOString());
    if (endVal) params.append("endTime", new Date(endVal).toISOString());

    // Añadir bbox si existe
    const bboxLayer = drawnItems.getLayers()[0];
    if (bboxLayer) {
      const b = bboxLayer.getBounds();
      params.append("bbox",
        `${b.getSouthWest().lng},${b.getSouthWest().lat},` +
        `${b.getNorthEast().lng},${b.getNorthEast().lat}`
      );
    }

    try {
      const resp = await fetch(`/api/geoserver-data?${params.toString()}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();

      // Total real recibido del servidor o, si no existiera, fallback
      const itemsTotal = Number.isInteger(json.totalCount)
        ? json.totalCount
        : (json.features || []).length;

      // Array de features para mostrar (hasta 2000)
      const features = json.features || [];

      // Agrupar por estación
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

      // Total de observaciones mostradas (suma de longitudes de cada grupo)
      const itemsShown = Object.values(grouped).reduce((sum, g) => sum + g.observations.length, 0);

      // Actualiza el contador con mostrados/total
      counterSpan.textContent = `(${itemsShown}/${itemsTotal})`;

      // Si no hay resultados
      if (itemsTotal === 0) {
        resultsDiv.innerHTML = `<div>No results found.</div>`;
        return;
      }

      // Construir la tabla HTML
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
        // Calcular rango de phenomenon_time y profundidad
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

        // Datos para los botones
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

  // Limpiar al inicio
  resultsDiv.innerHTML = "";
});

// Exponer funciones para botones inline
window.showJsonModal       = showJsonModal;
window.showChartForStation = showChartForStation;
