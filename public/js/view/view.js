// public/js/view/view.js

import {
  fetchFilterFeatureOfInterest,
  drawPointFeaturesOnMap
} from "./view-utils.js";

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
                <button onclick="document.getElementById('${jsonId}').style.display = (document.getElementById('${jsonId}').style.display === 'none' ? 'block' : 'none')">Show JSON</button>
                <button disabled>Show Chart</button>
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