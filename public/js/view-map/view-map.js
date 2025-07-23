// File: public/view-map/view-map.js

import 'leaflet-draw'; // si usas el plugin de dibujo
import L from 'leaflet';

(async function() {
  // 1) Leer parámetros de URL
  const params = new URLSearchParams(window.location.search);
  const coverageId = params.get('coverageId');
  const featureTypeName = params.get('featureTypeName'); 

  // 2) Ajustar título y mostrar/ocultar depthControl
  const titleEl = document.getElementById('pageTitle');
  if (featureTypeName === 'wrf_meteogalicia.grid_modelo_wrf') {
    titleEl.textContent = 'WRF Data Viewer';
  } else if (featureTypeName === 'roms_meteogalicia.grid_modelo_roms') {
    titleEl.textContent = 'ROMS Data Viewer';
    document.getElementById('depthControl').style.display = 'block';
  }

  // 3) Inicializar el mapa pequeño con herramienta de dibujo de BBox
  const smallMap = L.map('smallMap').setView([42.7, -8.0], 7);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
    .addTo(smallMap);

  const drawnItems = new L.FeatureGroup();
  smallMap.addLayer(drawnItems);
  smallMap.addControl(new L.Control.Draw({
    draw: { rectangle: { shapeOptions: { color: '#97009c' } }, polygon: false, circle: false, marker: false, polyline: false, circlemarker: false },
    edit: { featureGroup: drawnItems, remove: true }
  }));

  let currentBBox = null;
  smallMap.on('draw:created', e => {
    drawnItems.clearLayers();
    drawnItems.addLayer(e.layer);
    const b = e.layer.getBounds();
    currentBBox = `${b.getSouthWest().lng},${b.getSouthWest().lat},${b.getNorthEast().lng},${b.getNorthEast().lat}`;
  });
  smallMap.on('draw:deleted', () => { drawnItems.clearLayers(); currentBBox = null; });

  // 4) Inicializar el mapa grande
  const map = L.map('map').setView([42.7, -8.0], 7);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
    .addTo(map);

  // 5) Referencias a controles
  const varSelect   = document.getElementById('variableSelect');
  const timeSelect  = document.getElementById('timeSelect');
  const depthSelect = document.getElementById('depthSelect');
  const dateSpan    = document.getElementById('selectedDate');
  const pixelSpan   = document.getElementById('pixelValue');

  // 6) Rellenar opciones (aquí stubs; sustituye por fetch a tu API)
  const variables = ['var1','var2','var3'];     // ejemplo
  const times     = ['2024-09-02T01:00:00.000Z','2024-09-02T02:00:00.000Z'];
  const depths    = ['0','5','10','20'];

  variables.forEach(v => varSelect.add(new Option(v, v)));
  times.forEach(t     => timeSelect.add(new Option(t, t)));
  depths.forEach(d    => depthSelect.add(new Option(d, d)));

  // 7) Función para actualizar el mapa y el infoBox
  async function updateDisplay() {
    const selVars  = Array.from(varSelect.selectedOptions).map(o => o.value);
    const selTimes = Array.from(timeSelect.selectedOptions).map(o => o.value);
    const selDepth = Array.from(depthSelect.selectedOptions).map(o => o.value)[0] || '';

    // Tomamos el primer tiempo para mostrar en infoBox
    const selTime  = selTimes[0] || '';
    dateSpan.textContent = selTime;

    // Aquí iría la llamada a tu WCS/WFS para obtener el valor del pixel en coverageId
    // con selVars, selTime, selDepth y currentBBox.
    // De momento simulamos:
    const fakeValue = Math.random().toFixed(2);
    pixelSpan.textContent = fakeValue;

    // También aquí podrias dibujar la capa ráster/vector en el mapa grande
    // usando L.tileLayer.wms o L.imageOverlay según tu API.
  }

  // 8) Listeners para recálculo
  varSelect.addEventListener('change', updateDisplay);
  timeSelect.addEventListener('change', updateDisplay);
  depthSelect.addEventListener('change', updateDisplay);

  // 9) Trigger inicial si ya hay valores
  updateDisplay();
})();
