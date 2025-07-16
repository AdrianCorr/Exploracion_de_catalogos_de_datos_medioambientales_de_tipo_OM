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

      // Leer valores actualizados por el usuario
      const procedureVal = document.getElementById("procedure")?.value || "";
      const startVal     = document.getElementById("startDate")?.value || "";
      const endVal       = document.getElementById("endDate")?.value || "";

      // Validación básica
      if (!procedureVal || !startVal || !endVal) {
        resultsDiv.innerHTML = `<div class="error-msg">Faltan valores de fecha o procedimiento.</div>`;
        return;
      }

      // Leer bbox si existe
      const bboxLayer = drawnItems.getLayers()[0];
      if (!bboxLayer) {
        resultsDiv.innerHTML = `<div class="error-msg">Dibuja primero un área sobre el mapa.</div>`;
        return;
      }

      const bounds = bboxLayer.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();

      // Formato de fechas
      const startDateISO = new Date(startVal).toISOString();
      const endDateISO   = new Date(endVal).toISOString();

      // Construir BBOX string
      const bboxString = `${sw.lng},${sw.lat},${ne.lng},${ne.lat}`;

      // Construir URL al servidor local (proxy)
      const localUrl = `/api/geoserver-data?` + new URLSearchParams({
        typeName: "ccmm:observacion_ctd_wfs",
        procedure: procedureVal,
        startTime: startDateISO,
        endTime: endDateISO,
        bbox: bboxString
      });

      console.log("URL local al backend:", localUrl);

      try {
        const response = await fetch(localUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = await response.json();
        if (json.features && json.features.length > 0) {
          resultsDiv.innerHTML = `<pre>${JSON.stringify(json, null, 2)}</pre>`;
        } else {
          resultsDiv.innerHTML = `<div class="no-results-msg">No results found.</div>`;
        }
      } catch (err) {
        resultsDiv.innerHTML = `<div class="error-msg">Error al consultar Geoserver: ${err.message}</div>`;
      }
    });
  }

  // Vaciar el área de Results (pendiente de desarrollo)
  resultsDiv.innerHTML = "";
});