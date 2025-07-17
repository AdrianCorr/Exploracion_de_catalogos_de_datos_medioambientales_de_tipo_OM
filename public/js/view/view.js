import {
  fetchFilterFeatureOfInterest,
  drawPointFeaturesOnMap
} from "./view-utils.js";

function createJsonModal() {
  if (document.getElementById("jsonModal")) return;

  const modal = document.createElement("div");
  modal.id = "jsonModal";
  modal.classList.add("json-modal");

  modal.innerHTML = `
    <h3>JSON Data</h3>
    <pre id="jsonContent"></pre>
    <button id="closeJsonBtn">Cerrar</button>
  `;

  document.body.appendChild(modal);

  document.getElementById("closeJsonBtn")
    .addEventListener("click", () => modal.style.display = "none");
}

function createChartModal() {
  if (document.getElementById("chartModal")) return;

  const modal = document.createElement("div");
  modal.id = "chartModal";
  modal.classList.add("chart-modal");

  modal.innerHTML = `
    <h3>Selecciona variables para el gráfico:</h3>
    <div id="chartVariables">
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

  document.getElementById("closeChartBtn")
    .addEventListener("click", () => {
      modal.style.display = "none";
      if (currentChart) {
        currentChart.destroy();
        currentChart = null;
      }
    });
}

createJsonModal();
createChartModal();

document.addEventListener("DOMContentLoaded", async () => {
  const params          = new URLSearchParams(window.location.search);
  const procedure       = params.get("procedure")   || "";
  const startDate       = params.get("startDate")   || "";
  const endDate         = params.get("endDate")     || "";
  const featureTypeName = params.get("featureTypeName") || "ctd_intecmar.estacion";

  document.getElementById("procedure").value   = procedure;
  document.getElementById("startDate").value   = startDate;
  document.getElementById("endDate").value     = endDate;

  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
    iconUrl:       "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
    shadowUrl:     "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png"
  });

  const galiciaCenter = [42.7, -8.0];
  const map = L.map("map").setView(galiciaCenter, 7);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);

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

  const drawnItems = new L.FeatureGroup();
  map.addLayer(drawnItems);
  map.addControl(new L.Control.Draw({
    draw: {
      polygon: false, polyline: false,
      circle: false, circlemarker: false,
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

  try {
    const features = await fetchFilterFeatureOfInterest(featureTypeName);
    drawPointFeaturesOnMap(map, features);
  } catch (err) {
    console.error("Error al cargar features:", err);
  }

  const resultsDiv = document.getElementById("resultsList");
  document.getElementById("searchBtn").addEventListener("click", async () => {
    resultsDiv.innerHTML = "Cargando…";

    const procedureVal = document.getElementById("procedure").value;
    const startVal     = document.getElementById("startDate").value;
    const endVal       = document.getElementById("endDate").value;
    const queryParams  = new URLSearchParams({ typeName: "ccmm:observacion_ctd_wfs" });

    if (procedureVal) queryParams.append("procedure", procedureVal);
    if (startVal)     queryParams.append("startTime", new Date(startVal).toISOString());
    if (endVal)       queryParams.append("endTime",   new Date(endVal).toISOString());

    const bboxLayer = drawnItems.getLayers()[0];
    if (bboxLayer) {
      const b = bboxLayer.getBounds();
      queryParams.append("bbox",
        `${b.getSouthWest().lng},${b.getSouthWest().lat},` +
        `${b.getNorthEast().lng},${b.getNorthEast().lat}`
      );
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

      // Agrupar por nombre...
      const grouped = {};
      for (const f of features) {
        const props = f.properties;
        const name  = props.nombre || "Sin nombre";
        if (!grouped[name]) {
          grouped[name] = {
            observations: [], resultTime: props.result_time, procedure: props.procedure
          };
        }
        grouped[name].observations.push({ phenomenon_time: props.phenomenon_time, profundidad: props.profundidad, full: f });
      }

      let tableHTML = `
        <table class="results-table">
          <thead>
            <tr>
              <th>Name</th><th>Procedure</th><th>Result time</th>
              <th>Phenomenon Time</th><th>Depth</th><th>Details</th>
            </tr>
          </thead>
          <tbody>
      `;

      for (const name in grouped) {
        const { observations, resultTime, procedure } = grouped[name];
        const times = observations.map(o => new Date(o.phenomenon_time).getTime()).filter(Boolean);
        const depths = observations.map(o => parseFloat(o.profundidad)).filter(n => !isNaN(n));
        const pMin = new Date(Math.min(...times)), pMax = new Date(Math.max(...times));
        const dMin = Math.min(...depths), dMax = Math.max(...depths);
        const pRange = `[${pMin.toISOString().slice(0,16).replace("T"," ")}, ${pMax.toISOString().slice(0,16).replace("T"," ")}]`;
        const dRange = `[${dMin}, ${dMax}]`;
        const jsonId = `json-${name.replace(/\s+/g,"_")}`;

        tableHTML += `
          <tr>
            <td>${name}</td>
            <td>${procedure}</td>
            <td>${resultTime || "-"}</td>
            <td>${pRange}</td>
            <td>${dRange}</td>
            <td>
              <button onclick='showJsonModal(${JSON.stringify(observations.map(o=>o.full))})'>
                Show JSON
              </button>
              <button onclick='showChartForStation(${JSON.stringify(observations.map(o=>o.full))})'>
                Show Chart
              </button>
              <pre id="${jsonId}" class="json-pre">
                ${JSON.stringify(observations.map(o=>o.full), null, 2)}
              </pre>
            </td>
          </tr>
        `;
      }

      tableHTML += `</tbody></table>`;
      resultsDiv.innerHTML = tableHTML;

    } catch (err) {
      resultsDiv.innerHTML = `<div class="error-msg">
        Error al consultar Geoserver: ${err.message}
      </div>`;
    }
  });

  resultsDiv.innerHTML = "";
});

let currentChart = null;
function showChartForStation(data) {
  const modal = document.getElementById("chartModal");
  const canvas = document.getElementById("chartCanvas");
  const checkboxes = document.querySelectorAll("#chartVariables input[type=checkbox]");

  modal.style.display = "block";
  checkboxes.forEach((cb,i) => cb.checked = (i===0));

  function updateChart() {
    const selected = Array.from(checkboxes).filter(c=>c.checked).map(c=>c.value);
    if (currentChart) currentChart.destroy();
    const datasets = selected.map((field,i) => ({
      label: field,
      data: data
        .filter(d=>d.properties[field]!=null && d.properties.profundidad!=null)
        .map(d=>({ x: d.properties[field], y: parseFloat(d.properties.profundidad) })),
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
          x: { title: { display: true, text: 'Value' }, beginAtZero: false },
          y: { title: { display: true, text: 'Depth (m)' }, reverse: true }
        }
      }
    });
  }

  checkboxes.forEach(cb=>cb.addEventListener("change",updateChart));
  updateChart();
}
function getColor(i) {
  const colors = [
    "#3366cc","#dc3912","#ff9900","#109618","#990099",
    "#0099c6","#dd4477","#66aa00","#b82e2e","#316395",
    "#994499","#22aa99","#aaaa11"
  ];
  return colors[i % colors.length];
}

window.showChartForStation = showChartForStation;

function showJsonModal(data) {
  const modal = document.getElementById("jsonModal");
  const content = document.getElementById("jsonContent");
  content.textContent = JSON.stringify(data, null, 2);
  modal.style.display = "block";
}
window.showJsonModal = showJsonModal;
