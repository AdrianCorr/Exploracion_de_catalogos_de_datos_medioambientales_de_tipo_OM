// public/js/view-map/view-map.js

import { parseViewParams } from '../view/view-utils.js';

// Intenta localizar la función de parseo en las distintas builds posibles
function resolveParseGeoraster() {
  // 1) Build clásica: expone parseGeoraster directamente
  if (typeof window.parseGeoraster === 'function') return window.parseGeoraster;

  // 2) Build browserify muy habitual: window.georaster ES LA FUNCIÓN de parseo
  if (typeof window.georaster === 'function') return window.georaster;

  // 3) Otras builds: exponen un objeto con parseGeoraster o parse
  const g = window.georaster;
  if (g && typeof g.parseGeoraster === 'function') return g.parseGeoraster;
  if (g && typeof g.parse === 'function') return g.parse;

  return null;
}

/* ----------------------------------------------------------
 * Utilidades específicas para WRF/ROMS (coloreado raster)
 * ---------------------------------------------------------- */
function getFechaFromCoverageId(id) {
  const match = id?.match?.(/\d{8}/);
  if (!match) return new Date();
  const dateStr = match[0];
  return new Date(`${dateStr.slice(0,4)}-${dateStr.slice(4,6)}-${dateStr.slice(6,8)}T01:00:00.000Z`);
}

// Color scales separadas para WRF y ROMS (puedes ajustarlas a tu gusto)
const SCALES = {
  WRF: {
    Band1: { min: 0, max: 360, colors: [
      '#ff0000', '#ff8000', '#ffff00', '#80ff00', '#00ff00', '#00ff80', '#00ffff',
      '#0080ff', '#0000ff', '#8000ff', '#ff00ff', '#ff0080', '#ff0000'
    ]}, // Wind direction
    Band2: { min: 0, max: 30, colors: [
      '#001a4d', '#0033a0', '#0055ff', '#00bfff', '#00ffcc', '#00ff66', '#66ff00',
      '#ccff00', '#ffff00', '#ffcc00', '#ff9900', '#ff6600', '#ff3300', '#ff0000'
    ]}, // Wind speed
    Band3: { min: 95000, max: 105000, colors: [
      '#001a4d', '#0055ff', '#00bfff', '#00ffcc', '#66ff66', '#ffff66', '#ffcc00',
      '#ff9900', '#ff6600', '#ff3300', '#ff0000'
    ]}, // Pressure
    Band4: { min: 0, max: 50, colors: [
      '#e0f7fa', '#b2ebf2', '#4dd0e1', '#00bcd4', '#0097a7', '#43a047', '#cddc39',
      '#fff176', '#ffeb3b', '#ffd54f', '#ff9800', '#ff5722', '#f44336', '#b71c1c'
    ]}, // Precipitation
    Band5: { min: 0, max: 1, colors: [
      '#f4e2d8', '#ffe082', '#fff176', '#c5e1a5', '#00ff00', '#00e676', '#00bfae',
      '#00bfff', '#00796b', '#004d40'
    ]}, // Relative humidity
    Band6: { min: 0, max: 50, colors: [
      '#ffffff', '#e0f7fa', '#b2ebf2', '#4dd0e1', '#00bcd4', '#0097a7', '#01579b', '#002f6c'
    ]}, // Snowfall
    Band7: { min: 0, max: 5, colors: [
      '#f5f5f5', '#cfd8dc', '#b0bec5', '#90a4ae', '#78909c', '#607d8b',
      '#37474f', '#263238', '#0000ff'
    ]}, // Snow level
    Band8: { min: 260, max: 315, colors: [
      '#000080', '#0055ff', '#00bfff', '#00ffcc', '#00ff66', '#66ff00', '#ccff00',
      '#ffff00', '#ffcc00', '#ff9900', '#ff6600', '#ff3300', '#ff0000', '#b71c1c'
    ]}  // Temperature (K)
  },
  ROMS: {
    Band1: { min: 33, max: 37, colors: [
      '#000080', '#0055ff', '#00bfff', '#00ffcc', '#00ff66', '#66ff00', '#ccff00',
      '#ffff00', '#ffcc00', '#ff9900', '#ff6600', '#ff3300', '#ff0000', '#b71c1c'
    ]}, // Salinity
    Band2: { min: 0, max: 30, colors: [
      '#000080', '#0055ff', '#00bfff', '#00ffcc', '#00ff66', '#66ff00', '#ccff00',
      '#ffff00', '#ffcc00', '#ff9900', '#ff6600', '#ff3300', '#ff0000', '#b71c1c'
    ]}, // Temperature (K)
    Band3: { min: 0, max: 1, colors: [
      '#000080', '#0055ff', '#00bfff', '#00ffcc', '#00ff66', '#66ff00', '#ccff00',
      '#ffff00', '#ffcc00', '#ff9900', '#ff6600', '#ff3300', '#ff0000', '#b71c1c'
    ]}, // Water velocity U
    Band4: { min: 0, max: 1, colors: [
      '#000080', '#0055ff', '#00bfff', '#00ffcc', '#00ff66', '#66ff00', '#ccff00',
      '#ffff00', '#ffcc00', '#ff9900', '#ff6600', '#ff3300', '#ff0000', '#b71c1c'
    ]}, // Water velocity V
    Band5: { min: 0, max: 1, colors: [
      '#000080', '#0055ff', '#00bfff', '#00ffcc', '#00ff66', '#66ff00', '#ccff00',
      '#ffff00', '#ffcc00', '#ff9900', '#ff6600', '#ff3300', '#ff0000', '#b71c1c'
    ]}  // Sea surface height
  }
};

// Valores de profundidad típicos para ROMS (ajusta si quieres)
const ROMS_DEPTHS = [0, 10, 20, 35, 75, 125, 150, 250, 400, 500, 1000, 1500, 2000, 3000, 4000];

// Endpoint WCS (mismo que tus ejemplos)
const WCS_URL = 'https://tec.citius.usc.es/ccmm/geoserver/ows';

document.addEventListener('DOMContentLoaded', async () => {
  // === Parámetros ===
  const { featureTypeName } = parseViewParams();
  const isWRF  = featureTypeName === 'wrf_meteogalicia.grid_modelo_wrf';
  const isROMS = featureTypeName === 'roms_meteogalicia.grid_modelo_roms';

  const urlParams  = new URLSearchParams(window.location.search);
  const coverageId = urlParams.get('coverageId') || '';

  const fechaBase = getFechaFromCoverageId(coverageId);
  let fecha = new Date(fechaBase.getTime()); // fecha mutable

  // === DOM ===
  const titleEl     = document.getElementById('pageTitle');
  const depthCtrl   = document.getElementById('depthControl');
  const varSelect   = document.getElementById('variableSelect');
  const timeSelect  = document.getElementById('timeSelect');
  const depthSelect = document.getElementById('depthSelect');
  const dateSpan    = document.getElementById('selectedDate');
  const pixelSpan   = document.getElementById('pixelValue');

  // Título y visibilidad del selector de profundidad
  if (isWRF) {
    titleEl.textContent = 'WRF Data Viewer';
    depthCtrl.style.display = 'none';
  } else if (isROMS) {
    titleEl.textContent = 'ROMS Data Viewer';
    depthCtrl.style.display = 'block';
  } else {
    titleEl.textContent = 'Model Data Viewer';
    depthCtrl.style.display = 'none';
  }

  // === Mapa pequeño (BBox) ===
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

  let spatialFilter = null;
  smallMap.on(L.Draw.Event.CREATED, e => {
    drawnItemsSmall.clearLayers();
    drawnItemsSmall.addLayer(e.layer);
    const b = e.layer.getBounds();
    spatialFilter = {
      minLat: b.getSouth(),
      maxLat: b.getNorth(),
      minLon: b.getWest(),
      maxLon: b.getEast()
    };
    updateMap();
  });
  smallMap.on(L.Draw.Event.DELETED, () => {
    spatialFilter = null;
    updateMap();
  });

  // === Mapa grande (igual que en tu view.js) ===
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

  const drawnItemsBig = new L.FeatureGroup();
  map.addLayer(drawnItemsBig);
  map.addControl(new L.Control.Draw({
    draw: {
      polygon: false,
      polyline: false,
      circle: false,
      circlemarker: false,
      marker: false,
      rectangle: { shapeOptions: { color: '#97009c' } }
    },
    edit: { featureGroup: drawnItemsBig, edit: true, remove: true }
  }));

  // === Estado raster ===
  let geoRasterLayer = null;
  let currentGeoraster = null;
  let moveHandlerAdded = false;

  // === Controles ===

  // Variables (bandas) según modelo
  const bands = Object.keys(isWRF ? SCALES.WRF : SCALES.ROMS);
  bands.forEach(b => varSelect.add(new Option(b, b)));
  varSelect.value = bands[0];

  // Horas (1..96) como en tus ejemplos
  for (let i = 1; i <= 96; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = i;
    timeSelect.appendChild(opt);
  }

  // Profundidades solo ROMS
  if (isROMS) {
    ROMS_DEPTHS.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d;
      opt.textContent = d;
      depthSelect.appendChild(opt);
    });
  }

  // === Función principal de pintado ===
  const wcsBaseParams = {
    service: 'WCS',
    version: '2.0.1',
    request: 'GetCoverage',
    coverageId: coverageId,
    rangesubset: bands[0] // por defecto la primera banda
  };

  function updateRangeSubset() {
    wcsBaseParams.rangesubset = varSelect.value;
  }

  function buildWcsUrl() {
    updateRangeSubset();

    const urlParams = new URLSearchParams(wcsBaseParams);
    // Añadimos el subset temporal:
    urlParams.append('subset', `time("${fecha.toISOString()}")`);

    // Añadimos espacial si existe
    if (spatialFilter) {
      urlParams.append('subset', `Long(${spatialFilter.minLon},${spatialFilter.maxLon})`);
      urlParams.append('subset', `Lat(${spatialFilter.minLat},${spatialFilter.maxLat})`);
    }

    // Profundidad para ROMS
    if (isROMS) {
      const dVal = depthSelect.value;
      if (dVal !== undefined && dVal !== null && dVal !== '') {
        urlParams.append('subset', `elevation(${dVal})`);
      }
    }

    return `${WCS_URL}?${urlParams.toString()}`;
  }

  function updateMap() {
    const url = buildWcsUrl();

    // Mostrar fecha seleccionada
    dateSpan.textContent = fecha.toISOString();

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`WCS HTTP ${res.status}`);
        return res.arrayBuffer();
      })
      .then(arrayBuffer => {
        const parseFn = resolveParseGeoraster();
        console.debug('parseGeoraster resolved to:', parseFn);
        if (!parseFn) {
          throw new Error('GeoRaster no está cargado: revisa las <script> y la CSP');
        }
        return parseFn(arrayBuffer);
      })
      .then(georaster => {
        currentGeoraster = georaster;

        // Evento para mostrar pixel value
        if (!moveHandlerAdded) {
          map.on('mousemove', (e) => {
            const cr = currentGeoraster;
            if (!cr) return;
            const lon = e.latlng.lng;
            const lat = e.latlng.lat;

            const cols = cr.values[0][0].length;
            const rows = cr.values[0].length;

            const x = Math.floor((lon - cr.xmin) / cr.pixelWidth);
            const y = Math.floor((cr.ymax - lat) / Math.abs(cr.pixelHeight));

            if (x < 0 || x >= cols || y < 0 || y >= rows) {
              pixelSpan.textContent = '—';
              return;
            }
            const val = cr.values[0][y][x];
            if (val === cr.noDataValue || val == null || isNaN(val) || val <= 0) {
              pixelSpan.textContent = '—';
            } else {
              pixelSpan.textContent = val.toString();
            }
          });
          moveHandlerAdded = true;
        }

        // Pintar capa raster con la paleta correcta
        if (geoRasterLayer) map.removeLayer(geoRasterLayer);

        const band = varSelect.value;
        const cfg  = (isWRF ? SCALES.WRF : SCALES.ROMS)[band];

        const rainbow = new Rainbow();
        rainbow.setNumberRange(cfg.min, cfg.max);
        rainbow.setSpectrum.apply(rainbow, cfg.colors);

        geoRasterLayer = new GeoRasterLayer({
          georaster,
          pixelValuesToColorFn: value => {
            if (value == null || isNaN(value) || value <= 0) return null;
            return '#' + rainbow.colourAt(value);
          },
          resolution: 256
        });

        geoRasterLayer.addTo(map);
      })
      .catch(err => {
        console.error('updateMap() error:', err);
      });
  }

  // === Listeners ===
  timeSelect.addEventListener('change', e => {
    // En tus ejemplos: fecha = fechaBase + horasSeleccionadas + 2
    const hours = parseInt(e.target.value, 10);
    fecha = new Date(fechaBase.getTime());
    fecha.setHours(fecha.getHours() + hours + 2);
    updateMap();
  });

  varSelect.addEventListener('change', updateMap);
  if (isROMS) depthSelect.addEventListener('change', updateMap);

  // === Primera render ===
  updateMap();
});
