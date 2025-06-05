document.addEventListener("DOMContentLoaded", () => {
  const coordinatesTemplate = (swLat = '', swLng = '', neLat = '', neLng = '') =>
    `<span class="coordinate-label">Coordenadas del BBox:</span><br>` +
    `<span class="coordinate-label">SW:</span> ${swLat} ${swLng}<br>` +
    `<span class="coordinate-label">NE:</span> ${neLat} ${neLng}`;

  const map = L.map("map").setView([42.5, -8.0], 8);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);

  // Quitar zoom por defecto
  map.zoomControl.remove();

  // Agregar control de zoom con botón home
  const zoomHome = new L.Control.zoomHome({
    position: "topleft",
    homeCoordinates: [42.5, -8.0],
    homeZoom: 8
  }).addTo(map);

  // Grupo para los elementos dibujados
  const drawnItems = new L.FeatureGroup();
  map.addLayer(drawnItems);

  // Control de dibujo solo para rectángulos
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

  // Inicializar contenedor
  document.getElementById("bbox-coordinates").innerHTML = coordinatesTemplate();

  // Evento al crear rectángulo
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

  // Evento al eliminar
  map.on("draw:deleted", () => {
    document.getElementById("bbox-coordinates").innerHTML = coordinatesTemplate();
  });
});
