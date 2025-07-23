import {
  fetchFilterFeatureOfInterest,
  drawPointFeaturesOnMap,
  parseViewParams
} from '../view/view-utils.js';

// Ejecutar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', async () => {
  // Leer parámetros de la URL
  const { featureTypeName } = parseViewParams();

  // Ajustar título y profundidad
  const titleEl = document.getElementById('pageTitle');
  const depthControl = document.getElementById('depthControl');
  if (featureTypeName === 'wrf_meteogalicia.grid_modelo_wrf') {
    titleEl.textContent = 'WRF Data Viewer';
    depthControl.style.display = 'none';
  } else if (featureTypeName === 'roms_meteogalicia.grid_modelo_roms') {
    titleEl.textContent = 'ROMS Data Viewer';
    depthControl.style.display = 'block';
  } else {
    titleEl.textContent = 'Model Data Viewer';
    depthControl.style.display = 'none';
  }

  // ------ Código de inicialización de mapa tomado de view.js ------
  // Ajustar las URLs de los iconos de Leaflet (workaround CDN)
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
    iconUrl:       "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
    shadowUrl:     "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png"
  });

  // Inicializar mapa centrado en Galicia y capa base OpenStreetMap
  const galiciaCenter = [42.7, -8.0];
  const map = L.map("map").setView(galiciaCenter, 7);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);

  // Configurar controles de zoom y “home” si está disponible
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

  // Añadir herramienta de dibujo de BBox y elemento para mostrar coordenadas
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
  map.on("draw:deleted", () => {
    coordsDiv.innerHTML = emptyHTML;
  });

  // Cargar y dibujar marcadores iniciales sin filtro de geometría
  try {
    const features = await fetchFilterFeatureOfInterest(featureTypeName, '');
    drawPointFeaturesOnMap(map, features);
  } catch (err) {
    console.error("Error al cargar features en view-map:", err);
  }
  // ----------------------------------------------------------------

  // Aquí puedes continuar con el resto de lógica de selectores y updateDisplay...
});
