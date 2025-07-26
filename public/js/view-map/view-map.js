// view-map.js

import {
  WRF_BAND_LABELS,
  ROMS_BAND_LABELS,
  SCALES,
  ROMS_DEPTHS,
} from "./view-map-constants.js";
import {
  initVariableSelect,
  initTimeSelect,
  initDepthSelect,
} from "./view-map-controls.js";
import { initViewMaps } from "./view-map-initMap.js";
import { resolveParseGeoraster, fetchRasterData } from "./view-map-raster.js";

document.addEventListener("DOMContentLoaded", () => {
  // --- Parámetros ---
  const params = new URLSearchParams(window.location.search);
  const featureTypeName = params.get("featureTypeName") || "";
  const coverageId = params.get("coverageId") || "";

  const isWRF = featureTypeName === "wrf_meteogalicia.grid_modelo_wrf";
  const isROMS = featureTypeName === "roms_meteogalicia.grid_modelo_roms";

  // --- DOM ---
  const titleEl = document.getElementById("pageTitle");
  const depthCtrl = document.getElementById("depthControl");
  const varSelect = document.getElementById("variableSelect");
  const timeSelect = document.getElementById("timeSelect");
  const depthSelect = document.getElementById("depthSelect");
  const dateSpan = document.getElementById("selectedDate");
  const pixelSpan = document.getElementById("pixelValue");

  // --- Inicializar títulos y controles ---
  if (isWRF) {
    titleEl.textContent = "WRF Data Viewer";
    depthCtrl.style.display = "none";
  } else if (isROMS) {
    titleEl.textContent = "ROMS Data Viewer";
    depthCtrl.style.display = "block";
  } else {
    titleEl.textContent = "Model Data Viewer";
    depthCtrl.style.display = "none";
  }

  const bands = Object.keys(isWRF ? SCALES.WRF : SCALES.ROMS);
  initVariableSelect(varSelect, bands, isWRF ? WRF_BAND_LABELS : ROMS_BAND_LABELS);
  initTimeSelect(timeSelect);
  if (isROMS) initDepthSelect(depthSelect, ROMS_DEPTHS);

  // --- Inicializar mapas ---
  const { map, smallMap, drawnItems } = initViewMaps();

  // --- Estado ---
  let fechaBase = getFechaFromCoverageId(coverageId);
  let fecha = new Date(fechaBase.getTime());
  let geoRasterLayer = null;
  let currentGeoraster = null;
  let moveHandlerAdded = false;
  let spatialFilter = null;

  // --- Default bbox ---
  const galiciaBounds = L.latLngBounds([41.8, -10.0], [44.5, -5.0]);
  const defaultBox = L.rectangle(galiciaBounds, { color: "#97009c", weight: 2 });
  drawnItems.addLayer(defaultBox);
  smallMap.fitBounds(galiciaBounds);

  spatialFilter = {
    minLat: galiciaBounds.getSouth(),
    maxLat: galiciaBounds.getNorth(),
    minLon: galiciaBounds.getWest(),
    maxLon: galiciaBounds.getEast(),
  };

  // --- Funciones ---
  function getFechaFromCoverageId(id) {
    const match = id?.match?.(/\d{8}/);
    if (!match) return new Date();
    const dateStr = match[0];
    return new Date(
      `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}T01:00:00.000Z`
    );
  }

  function buildWcsUrl() {
    const band = varSelect.value;
    const baseParams = new URLSearchParams({
      service: "WCS",
      version: "2.0.1",
      request: "GetCoverage",
      coverageId: coverageId,
      rangesubset: band,
    });

    baseParams.append("subset", `time("${fecha.toISOString()}")`);
    if (spatialFilter) {
      baseParams.append("subset", `Long(${spatialFilter.minLon},${spatialFilter.maxLon})`);
      baseParams.append("subset", `Lat(${spatialFilter.minLat},${spatialFilter.maxLat})`);
    }
    if (isROMS) {
      const depth = depthSelect.value;
      if (depth) baseParams.append("subset", `elevation(${depth})`);
    }
    return `/api/wcs?${baseParams.toString()}`;
  }

  function updateMap() {
    const url = buildWcsUrl();
    dateSpan.textContent = fecha.toISOString();

    fetchRasterData(url)
      .then((arrayBuffer) => {
        const parseFn = resolveParseGeoraster();
        if (!parseFn) throw new Error("GeoRaster no está cargado correctamente");
        return parseFn(arrayBuffer);
      })
      .then((georaster) => {
        currentGeoraster = georaster;

        if (!moveHandlerAdded) {
          map.on("mousemove", (e) => {
            if (!currentGeoraster) return;
            const lon = e.latlng.lng;
            const lat = e.latlng.lat;
            const cols = currentGeoraster.values[0][0].length;
            const rows = currentGeoraster.values[0].length;
            const x = Math.floor((lon - currentGeoraster.xmin) / currentGeoraster.pixelWidth);
            const y = Math.floor((currentGeoraster.ymax - lat) / Math.abs(currentGeoraster.pixelHeight));
            if (x < 0 || x >= cols || y < 0 || y >= rows) {
              pixelSpan.textContent = "—";
              return;
            }
            const val = currentGeoraster.values[0][y][x];
            pixelSpan.textContent = val && val > 0 ? val.toString() : "—";
          });
          moveHandlerAdded = true;
        }

        if (geoRasterLayer) map.removeLayer(geoRasterLayer);

        const band = varSelect.value;
        const cfg = (isWRF ? SCALES.WRF : SCALES.ROMS)[band];
        const rainbow = new Rainbow();
        rainbow.setNumberRange(cfg.min, cfg.max);
        rainbow.setSpectrum(...cfg.colors);

        geoRasterLayer = new GeoRasterLayer({
          georaster,
          pixelValuesToColorFn: (value) => {
            if (value == null || isNaN(value) || value <= 0) return null;
            return "#" + rainbow.colourAt(value);
          },
          resolution: 256,
        });

        geoRasterLayer.addTo(map);
      })
      .catch((err) => {
        console.error("updateMap() error:", err);
      });
  }

  // --- Listeners ---
  timeSelect.addEventListener("change", (e) => {
    const hours = parseInt(e.target.value, 10);
    fecha = new Date(fechaBase.getTime());
    fecha.setHours(fecha.getHours() + hours + 2);
    updateMap();
  });
  varSelect.addEventListener("change", updateMap);
  if (isROMS) depthSelect.addEventListener("change", updateMap);

  smallMap.on(L.Draw.Event.CREATED, (e) => {
    drawnItems.clearLayers();
    drawnItems.addLayer(e.layer);
    const b = e.layer.getBounds();
    spatialFilter = {
      minLat: b.getSouth(),
      maxLat: b.getNorth(),
      minLon: b.getWest(),
      maxLon: b.getEast(),
    };
    updateMap();
  });

  smallMap.on(L.Draw.Event.DELETED, () => {
    spatialFilter = null;
    updateMap();
  });

  // --- Inicialización ---
  updateMap();
});
