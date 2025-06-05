// public/js/view/view.js

/**
 * view.js — Inicializa el mapa de Leaflet centrado en Galicia,
 *          habilita Leaflet Draw y zoomHome (si está disponible).
 */

document.addEventListener("DOMContentLoaded", () => {
  initMap();
});

function initMap() {
  console.log("↗ Iniciando Leaflet en #map");

  // Centro aproximado de Galicia
  const galiciaCenter = [42.7284, -8.6538];
  const initialZoom = 8;

  // 1) Crear el mapa dentro de <div id="map">
  const map = L.map("map").setView(galiciaCenter, initialZoom);

  // 2) Añadir capa base de OpenStreetMap
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);

  // 3) Eliminar controles de zoom predeterminados (opcional)
  map.zoomControl.remove();

  // 4) Agregar zoomHome si existe
  if (L.Control && L.Control.zoomHome) {
    const zoomHome = new L.Control.zoomHome({
      position: "topleft",
      homeCoordinates: galiciaCenter,
      homeZoom: initialZoom
    });
    map.addControl(zoomHome);
  }

  // 5) Preparar Leaflet Draw (solo rectángulo)
  const drawnItems = new L.FeatureGroup();
  map.addLayer(drawnItems);

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

  // 6) Inicializar contenedor de coordenadas vacío
  const bboxDiv = document.getElementById("bbox-coordinates");
  bboxDiv.innerHTML = "";

  // 7) Evento cuando se crea un rectángulo
  map.on("draw:created", (e) => {
    drawnItems.clearLayers();
    drawnItems.addLayer(e.layer);
    const bounds = e.layer.getBounds();

    bboxDiv.innerHTML =
      `<span class="coordinate-label">Coordenadas del BBox:</span><br>` +
      `<span class="coordinate-label">SW:</span> ${bounds.getSouthWest().lat.toFixed(6)} ${bounds.getSouthWest().lng.toFixed(6)}<br>` +
      `<span class="coordinate-label">NE:</span> ${bounds.getNorthEast().lat.toFixed(6)} ${bounds.getNorthEast().lng.toFixed(6)}`;
  });

  // 8) Evento cuando se elimina el rectángulo
  map.on("draw:deleted", () => {
    bboxDiv.innerHTML = "";
  });
}
