import {
  fetchFilterFeatureOfInterest,
  drawPointFeaturesOnMap,
  parseViewParams
} from '../view/view-utils.js';

// Ejecutar cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', async () => {
  // 1) Leer parámetros de la URL
  const { featureTypeName } = parseViewParams();
  const coverageId = new URLSearchParams(window.location.search).get('coverageId');

  // 2) Ajustar título y mostrar/ocultar selector de profundidad
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

  /* --------------------------- MAPA PEQUEÑO --------------------------- */
  const smallMap = L.map('smallMap').setView([43.05, -8.15], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(smallMap);
  const drawnItemsSmall = new L.FeatureGroup();
  smallMap.addLayer(drawnItemsSmall);
  smallMap.addControl(new L.Control.Draw({
    draw: {
      rectangle: { shapeOptions: { color: '#97009c' } },
      polygon: false, polyline: false, circle: false,
      marker: false, circlemarker: false
    },
    edit: { featureGroup: drawnItemsSmall, remove: true }
  }));
  let currentBBox = '';
  smallMap.on('draw:created', e => {
    drawnItemsSmall.clearLayers();
    drawnItemsSmall.addLayer(e.layer);
    const b = e.layer.getBounds();
    currentBBox = `${b.getSouthWest().lng},${b.getSouthWest().lat},${b.getNorthEast().lng},${b.getNorthEast().lat}`;
  });
  smallMap.on('draw:deleted', () => {
    drawnItemsSmall.clearLayers();
    currentBBox = '';
  });

  /* --------------------------- MAPA GRANDE ---------------------------- */
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png',
    iconUrl:       'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
    shadowUrl:     'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png'
  });

  const galiciaCenter = [43.05, -8.15];
  const map = L.map('map').setView(galiciaCenter, 7);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  map.zoomControl.remove();
  if (L.Control && L.Control.zoomHome) {
    new L.Control.zoomHome({
      position: 'topleft',
      homeCoordinates: galiciaCenter,
      homeZoom: 8,
      zoomHomeIcon: 'home',
      zoomHomeTitle: 'Volver al inicio'
    }).addTo(map);
  }

  const drawnItems = new L.FeatureGroup();
  map.addLayer(drawnItems);
  map.addControl(new L.Control.Draw({
    draw: {
      polygon: false,
      polyline: false,
      circle: false,
      circlemarker: false,
      marker: false,
      rectangle: { shapeOptions: { color: '#97009c' } }
    },
    edit: { featureGroup: drawnItems, edit: true, remove: true }
  }));
});
