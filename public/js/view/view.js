/**
 * view.js — Inicializa el mapa de Leaflet centrado en Galicia,
 *          lee los IDs seleccionados de la URL y luego puede
 *          desplegar marcadores o información en “Results”.
 */

import { coordinatesTemplate } from "./view-utils.js";

document.addEventListener("DOMContentLoaded", () => {
  // 1) Leer IDs seleccionados desde query string: ?selected=1,2,3,...
  const params = new URLSearchParams(window.location.search);
  const selectedParam = params.get("selected") || ""; // p.e. "1,2,3"
  const selectedIds = selectedParam
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s !== "");

  // 2) Inicializar el mapa
  initMap();

  // 3) Añadir marcadores (o lógica) para cada ID en el mapa
  //    (aquí deberías obtener coordenadas reales de cada observación/ID)
  //    Por ahora, simplemente mostramos el array de IDs en “Results”.
  const resultsDiv = document.getElementById("resultsList");
  if (selectedIds.length === 0) {
    resultsDiv.textContent = "No se seleccionaron observaciones.";
  } else {
    const ul = document.createElement("ul");
    selectedIds.forEach((id) => {
      const li = document.createElement("li");
      li.textContent = `Observación ID: ${id}`;
      ul.appendChild(li);
    });
    resultsDiv.appendChild(ul);
  }
});

function initMap() {
  // Centro aproximado de Galicia
  const galiciaCenter = [42.7284, -8.6538]; // lat, lng
  const initialZoom = 8;

  // Crear mapa
  const map = L.map("map").setView(galiciaCenter, initialZoom);

  // Capa base OpenStreetMap
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);

  // Si quieres desactivar controles predeterminados:
  map.zoomControl.remove();

  // Agregar control “zoom home” (opcional)
  if (L.Control && L.Control.zoomHome) {
    const zoomHome = L.Control.zoomHome({
      position: "topleft",
      homeCoordinates: galiciaCenter,
      homeZoom: initialZoom
    });
    zoomHome.addTo(map);
  }

  // Grupo para elementos dibujados (Leaflet Draw)
  const drawnItems = new L.FeatureGroup();
  map.addLayer(drawnItems);

  // Control de dibujo: solo rectángulo activo
  const drawControl = new L.Control.Draw({
    draw: {
      polygon: false,
      polyline: false,
      circle: false,
      marker: false,
      circlemarker: false,
      rectangle: true
    },
    edit: {
      featureGroup: drawnItems
    }
  });
  map.addControl(drawControl);

  // Inicializar contenedor de coordenadas
  document.getElementById("bbox-coordinates").innerHTML = coordinatesTemplate();

  // Evento tras crear un rectángulo
  map.on("draw:created", (e) => {
    const layer = e.layer;
    drawnItems.clearLayers();
    drawnItems.addLayer(layer);
    const bounds = layer.getBounds();
    document.getElementById("bbox-coordinates").innerHTML = coordinatesTemplate(
      bounds.getSouthWest().lat.toFixed(6),
      bounds.getSouthWest().lng.toFixed(6),
      bounds.getNorthEast().lat.toFixed(6),
      bounds.getNorthEast().lng.toFixed(6)
    );
  });

  map.on("draw:deleted", () => {
    document.getElementById("bbox-coordinates").innerHTML = coordinatesTemplate();
  });
}
