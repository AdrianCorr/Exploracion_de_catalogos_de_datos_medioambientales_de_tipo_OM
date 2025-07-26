// view-init-map.js

/**
 * Inicializa el mapa Leaflet con las herramientas de dibujo de BBox
 * y lo centra en Galicia.
 * 
 * @param {string} containerId - ID del elemento contenedor del mapa.
 * @returns {{ map: L.Map, drawnItems: L.FeatureGroup }}
 */
export function initLeafletMap(containerId) {
  // 1. Ajustar las URLs de los iconos de Leaflet (workaround CDN)
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
    iconUrl:       "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
    shadowUrl:     "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png"
  });

  // 2. Inicializar mapa centrado en Galicia y capa base OpenStreetMap
  const galiciaCenter = [43.05, -8.15];
  const map = L.map(containerId).setView(galiciaCenter, 7);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);

  // 3. Configurar controles de zoom y “home” si está disponible
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

  // 4. Añadir herramienta de dibujo de BBox
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

  return { map, drawnItems };
}