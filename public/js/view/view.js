// public/js/view/view.js

import {
  fetchFilterFeatureOfInterest,
  drawPointFeaturesOnMap
} from "./view-utils.js";

function createJsonModal() {
  if (document.getElementById("jsonModal")) return; // Ya existe

  const modal = document.createElement("div");
  modal.id = "jsonModal";
  modal.style.cssText = `
    display: none;
    position: fixed;
    top: 10%;
    left: 10%;
    max-width: 80vw;
    max-height: 80vh;
    background: white;
    border: 1px solid #ccc;
    padding: 1em;
    overflow: auto;
    z-index: 10001;
    box-shadow: 0 0 15px rgba(0,0,0,0.3);
    white-space: pre-wrap;
    font-family: monospace;
    font-size: 0.9em;
  `;

  modal.innerHTML = `
    <h3>JSON Data</h3>
    <pre id="jsonContent" style="max-height: 70vh; overflow: auto; background: #f4f4f4; padding: 1em;"></pre>
    <button id="closeJsonBtn">Cerrar</button>
  `;

  document.body.appendChild(modal);

  document.getElementById("closeJsonBtn").addEventListener("click", () => {
    modal.style.display = "none";
  });
}

// Crear modal JSON al inicio
createJsonModal();


function createChartModal() {
  if (document.getElementById("chartModal")) return; // Ya existe

  const modal = document.createElement("div");
  modal.id = "chartModal";
  modal.style.cssText = `
    display: none;
    position: fixed;
    top: 10%;
    left: 10%;
    max-width: 80vw;
    max-height: 80vh;
    background: white;
    border: 1px solid #ccc;
    padding: 1em;
    overflow: auto;
    z-index: 10000;
    box-shadow: 0 0 15px rgba(0,0,0,0.3);
  `;

  modal.innerHTML = `
    <h3>Selecciona variables para el gráfico:</h3>
    <div id="chartVariables" style="max-height: 150px; overflow-y: auto; margin-bottom: 1em;">
      <label><input type="checkbox" value="temperatura_its90"> temperatura_its90</label><br>
      <label><input type="checkbox" value="salinidad"> salinidad</label><br>
      <label><input type="checkbox" value="presion"> presion</label><br>
      <label><input type="checkbox" value="ph"> ph</label><br>
      <label><input type="checkbox" value="oxigeno"> oxigeno</label><br>
      <label><input type="checkbox" value="transmitancia"> transmitancia</label><br>
      <label><input type="checkbox" value="irradiancia"> irradiancia</label><br>
      <label><input type="checkbox" value="fluorescencia_uv"> fluorescencia_uv</label><br>
      <label><input type="checkbox" value="fluorescencia"> fluorescencia</label><br>
      <label><input type="checkbox" value="densidad"> densidad</label><br>
      <label><input type="checkbox" value="profundidad"> profundidad</label><br>
      <label><input type="checkbox" value="temperatura-its68"> temperatura-its68</label><br>
      <label><input type="checkbox" value="conductividad"> conductividad</label><br>
    </div>
    <canvas id="chartCanvas" width="800" height="500"></canvas><br>
    <button id="closeChartBtn">Cerrar</button>
  `;

  document.body.appendChild(modal);

  document.getElementById("closeChartBtn").addEventListener("click", () => {
    modal.style.display = "none";
    if (currentChart) {
      currentChart.destroy();
      currentChart = null;
    }
  });
}

// Llamar esta función al inicio para crear el modal vacío
createChartModal();


document.addEventListener("DOMContentLoaded", async () => {
  // Leer parámetros de la URL: procedure, startDate, endDate y featureTypeName
  const params          = new URLSearchParams(window.location.search);
  const procedure       = params.get("procedure")   || "";
  const startDate       = params.get("startDate")   || "";
  const endDate         = params.get("endDate")     || "";
  const featureTypeName = params.get("featureTypeName") || "ctd_intecmar.estacion";

  // Asignar valores a los inputs de Procedure y Temporal Filter
  const procInput  = document.getElementById("procedure");
  const startInput = document.getElementById("startDate");
  const endInput   = document.getElementById("endDate");
  if (procInput)  procInput.value  = procedure;
  if (startInput) startInput.value = startDate;
  if (endInput)   endInput.value   = endDate;

  // Fix para los iconos de marcador Leaflet cuando usamos CDN
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

  // Añadir ZoomHome con icono de casa (FontAwesome)
  if (L.Control && L.Control.zoomHome) {
    new L.Control.zoomHome({
      position: "topleft",
      homeCoordinates: galiciaCenter,
      homeZoom: 8,
      zoomHomeIcon: "home",
      zoomHomeTitle: "Volver al inicio"
    }).addTo(map);
  }

  // Configurar Draw para BBox
  const drawnItems = new L.FeatureGroup();
  map.addLayer(drawnItems);
  const drawControl = new L.Control.Draw({
    draw: {
      polygon: false,
      polyline: false,
      circle: false,
      circlemarker: false,
      marker: false,
      rectangle: { shapeOptions: { color: "#97009c" } }
    },
    edit: {
      featureGroup: drawnItems,
      edit: true,
      remove: true
    }
  });
  map.addControl(drawControl);

  // Eventos Draw para mostrar BBox
  const coordsDiv = document.getElementById("bbox-coordinates");
  const emptyHTML = `
    <span class="coordinate-label">Coordenadas del BBox:</span><br>
    <span class="coordinate-label">SW:</span><br>
    <span class="coordinate-label">NE:</span>
  `;
  coordsDiv.innerHTML = emptyHTML;

  map.on("draw:created", (e) => {
    drawnItems.clearLayers();
    drawnItems.addLayer(e.layer);
    const b = e.layer.getBounds();
    coordsDiv.innerHTML = `
      <span class="coordinate-label">Coordenadas del BBox:</span><br>
      <span class="coordinate-label">SW:</span> ${b.getSouthWest().lat.toFixed(6)} ${b.getSouthWest().lng.toFixed(6)}<br>
      <span class="coordinate-label">NE:</span> ${b.getNorthEast().lat.toFixed(6)} ${b.getNorthEast().lng.toFixed(6)}
    `;
  });

  map.on("draw:deleted", () => {
    coordsDiv.innerHTML = emptyHTML;
  });

  // Obtener y dibujar marcadores de features en el mapa
  try {
    const features = await fetchFilterFeatureOfInterest(featureTypeName);
    drawPointFeaturesOnMap(map, features);
  } catch (err) {
    console.error("Error al cargar features:", err);
  }

  // Botón Search: muestra JSON en Results
  const resultsDiv = document.getElementById("resultsList");
  const searchBtn  = document.getElementById("searchBtn");

  if (searchBtn) {
    searchBtn.addEventListener("click", async () => {
      resultsDiv.innerHTML = "Cargando…";

      const procedureVal = document.getElementById("procedure")?.value || "";
      const startVal = document.getElementById("startDate")?.value || "";
      const endVal = document.getElementById("endDate")?.value || "";

      const queryParams = new URLSearchParams({ typeName: "ccmm:observacion_ctd_wfs" });

      if (procedureVal) queryParams.append("procedure", procedureVal);
      if (startVal) queryParams.append("startTime", new Date(startVal).toISOString());
      if (endVal) queryParams.append("endTime", new Date(endVal).toISOString());

      const bboxLayer = drawnItems.getLayers()[0];
      if (bboxLayer) {
        const bounds = bboxLayer.getBounds();
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        const bboxString = `${sw.lng},${sw.lat},${ne.lng},${ne.lat}`;
        queryParams.append("bbox", bboxString);
      }

      const localUrl = `/api/geoserver-data?${queryParams.toString()}`;

      try {
        const response = await fetch(localUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = await response.json();

        const features = json.features || [];

        if (features.length === 0) {
          resultsDiv.innerHTML = `<div>No results found.</div>`;
          return;
        }
        
        // Agrupar por 'nombre'
        const grouped = {};
        for (const f of features) {
          const props = f.properties;
          const nombre = props.nombre || "Sin nombre";

          if (!grouped[nombre]) {
            grouped[nombre] = {
              observations: [],
              resultTime: props.result_time,
              procedure: props.procedure
            };
          }

          grouped[nombre].observations.push({
            phenomenon_time: props.phenomenon_time,
            profundidad: props.profundidad,
            full: f
          });
        }

        // Construir tabla
        let tableHTML = `
          <table class="results-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Procedure</th>
                <th>Result time</th>
                <th>Phenomenon Time</th>
                <th>Depth</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
        `;

        for (const nombre in grouped) {
          const { observations, resultTime, procedure } = grouped[nombre];

          const phenomenonTimes = observations.map(o => new Date(o.phenomenon_time).getTime()).filter(Boolean);
          const depths = observations.map(o => parseFloat(o.profundidad)).filter(n => !isNaN(n));

          const phenomenonMin = new Date(Math.min(...phenomenonTimes));
          const phenomenonMax = new Date(Math.max(...phenomenonTimes));
          const depthMin = Math.min(...depths);
          const depthMax = Math.max(...depths);

          const pTimeRange = `[${phenomenonMin.toISOString().slice(0,16).replace("T", " ")}, ${phenomenonMax.toISOString().slice(0,16).replace("T", " ")}]`;
          const depthRange = `[${depthMin}, ${depthMax}]`;

          const jsonStr = JSON.stringify(observations.map(o => o.full), null, 2);
          const jsonId = `json-${nombre.replace(/\s+/g, "_")}`;

          tableHTML += `
            <tr>
              <td>${nombre}</td>
              <td>${procedure}</td>
              <td>${resultTime || "-"}</td>
              <td>${pTimeRange}</td>
              <td>${depthRange}</td>
              <td>
                <button onclick='showJsonModal(${JSON.stringify(observations.map(o => o.full))})'>Show JSON</button>
                <button onclick='showChartForStation(${JSON.stringify(observations.map(o => o.full))})'>Show Chart</button>
                <pre id="${jsonId}" style="display:none; white-space:pre-wrap; max-height:300px; overflow:auto; background:#f4f4f4; padding:0.5em;">${jsonStr}</pre>
              </td>
            </tr>
          `;
        }

        tableHTML += `</tbody></table>`;
        resultsDiv.innerHTML = tableHTML;

      } catch (err) {
        resultsDiv.innerHTML = `<div class="error-msg">Error al consultar Geoserver: ${err.message}</div>`;
      }
    });
  }

  // Vaciar el área de Results (pendiente de desarrollo)
  resultsDiv.innerHTML = "";
});

let currentChart = null;

function showChartForStation(data) {
  const modal = document.getElementById("chartModal");
  const canvas = document.getElementById("chartCanvas");
  const checkboxes = document.querySelectorAll("#chartVariables input[type=checkbox]");

  modal.style.display = "block";

  // Seleccionar siempre el primer checkbox y desmarcar los demás
  checkboxes.forEach((cb, i) => {
    cb.checked = (i === 0);
  });

  function updateChart() {
    const selected = Array.from(checkboxes).filter(c => c.checked).map(c => c.value);

    if (currentChart) currentChart.destroy();

    const datasets = selected.map((field, i) => ({
      label: field,
      data: data
        .filter(d => d.properties[field] != null && d.properties.profundidad != null)
        .map(d => ({
          x: d.properties[field],
          y: parseFloat(d.properties.profundidad)
        })),
      showLine: false,
      pointRadius: 4,
      backgroundColor: getColor(i)
    }));

    currentChart = new Chart(canvas, {
      type: 'scatter',
      data: { datasets },
      options: {
        responsive: true,
        scales: {
          x: {
            title: { display: true, text: 'Value' },
            beginAtZero: false
          },
          y: {
            title: { display: true, text: 'Depth (m)' },
            reverse: true
          }
        }
      }
    });
  }

  checkboxes.forEach(cb => cb.addEventListener("change", updateChart));
  updateChart();
}

function getColor(i) {
  const colors = [
    "#3366cc", "#dc3912", "#ff9900", "#109618", "#990099",
    "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395",
    "#994499", "#22aa99", "#aaaa11"
  ];
  return colors[i % colors.length];
}

document.getElementById("closeChartBtn").addEventListener("click", () => {
  document.getElementById("chartModal").style.display = "none";
  if (currentChart) {
    currentChart.destroy();
    currentChart = null;
  }
});

window.showChartForStation = showChartForStation;


function showJsonModal(data) {
  const modal = document.getElementById("jsonModal");
  const content = document.getElementById("jsonContent");
  content.textContent = JSON.stringify(data, null, 2);
  modal.style.display = "block";
}

window.showJsonModal = showJsonModal;
