// public/js/view/view.js

import {
  fetchProcessTypesByName,
  fetchFeatureTypeByName,
  extractPolygonFromFeatureMeta,
  fetchFilterFeatureOfInterest,
  drawGeoJSONOnMap
} from "./view-utils.js";

document.addEventListener("DOMContentLoaded", async () => {
  // ───────────────────────────────────────────────
  // 1) Leer parámetros de la URL
  const params = new URLSearchParams(window.location.search);
  const processTypeName = params.get("processTypeName") || "";
  const startTime       = params.get("startTime")       || "";
  const endTime         = params.get("endTime")         || "";

  // Mostrar por consola (debug)
  console.log("view: processTypeName=", processTypeName);
  console.log("view: startTime=", startTime, " endTime=", endTime);

  // 2) Inicializar Leaflet (centro Galicia)
  const galiciaCenter = [42.5, -8.0];
  const map = L.map("map").setView(galiciaCenter, 8);

  // 3) Añadir capa OpenStreetMap
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);

  // 4) Quitar control de zoom predeterminado
  map.zoomControl.remove();

  // 5) Agregar ZoomHome
  if (L.Control && L.Control.zoomHome) {
    const zoomHome = new L.Control.zoomHome({
      position: "topleft",
      homeCoordinates: galiciaCenter,
      homeZoom: 8
    });
    zoomHome.addTo(map);
  }

  // 6) Grupo para Leaflet Draw
  const drawnItems = new L.FeatureGroup();
  map.addLayer(drawnItems);

  // 7) Control de dibujo solo rectángulo
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

  // 8) Inicializar contenedor de coordenadas
  const coordinatesContainer = document.getElementById("bbox-coordinates");
  const emptyCoordsHTML = `<span class="coordinate-label">Coordenadas del BBox:</span><br>
                           <span class="coordinate-label">SW:</span><br>
                           <span class="coordinate-label">NE:</span>`;
  coordinatesContainer.innerHTML = emptyCoordsHTML;

  // 9) Evento tras dibujar rectángulo
  map.on("draw:created", (e) => {
    const layer = e.layer;
    drawnItems.clearLayers();
    drawnItems.addLayer(layer);

    const bounds = layer.getBounds();
    const html = `<span class="coordinate-label">Coordenadas del BBox:</span><br>
                  <span class="coordinate-label">SW:</span> ${bounds.getSouthWest().lat.toFixed(6)} ${
      bounds.getSouthWest().lng.toFixed(6)
    }<br>
                  <span class="coordinate-label">NE:</span> ${bounds.getNorthEast().lat.toFixed(6)} ${
      bounds.getNorthEast().lng.toFixed(6)
    }`;
    coordinatesContainer.innerHTML = html;
  });

  // 10) Evento tras eliminar dibujo
  map.on("draw:deleted", () => {
    coordinatesContainer.innerHTML = emptyCoordsHTML;
  });

  // ───────────────────────────────────────────────
  // 11) Mostrar en “Results” la info recibida
  const resultsDiv = document.getElementById("resultsList");
  resultsDiv.innerHTML = `
    <p><strong>Process Type:</strong> ${processTypeName || "(no proporcionado)"}</p>
    <p><strong>Start Time:</strong> ${startTime || "(no proporcionado)"}</p>
    <p><strong>End Time:</strong> ${endTime   || "(no proporcionado)"}</p>
    <hr/>
    <p>Ejecutando la cadena de llamadas para extraer el polígono ...</p>
  `;

  // ───────────────────────────────────────────────
  // 12) Cadena de fetch:
  try {
    if (!processTypeName) {
      throw new Error("El parámetro 'processTypeName' no fue enviado.");
    }

    // 12.a) /api/process-types?vocabulary=&searchTerm=<processTypeName>
    const procTypesArr = await fetchProcessTypesByName(processTypeName);
    if (!Array.isArray(procTypesArr) || procTypesArr.length === 0) {
      throw new Error(`No se encontró ningún process-type que contenga "${processTypeName}".`);
    }

    // Tomamos el primer elemento que contenga el nombre exacto o similar
    // (Aquí podrías aplicar un filtro más robusto si hay varios resultados).
    const metaProc = procTypesArr.find((p) => p.name === processTypeName) || procTypesArr[0];
    const foiType  = metaProc.feature_of_interest_type;
    if (!foiType) {
      throw new Error(`No se encontró 'feature_of_interest_type' en metadata de "${processTypeName}".`);
    }

    resultsDiv.innerHTML += `<p>Found feature_of_interest_type: <code>${foiType}</code></p>`;

    // 12.b) /api/feature-type-by-name?featureTypeName=<foiType>
    const featureMetaArr = await fetchFeatureTypeByName(foiType);
    if (!Array.isArray(featureMetaArr) || featureMetaArr.length === 0) {
      throw new Error(`No se encontró metadata para FEATURE TYPE "${foiType}".`);
    }
    const featureMeta = featureMetaArr[0];

    // 12.c) extraer sampledFeatureType
    const sampledFT = featureMeta.spatialSamplingFeatureType
      ? featureMeta.spatialSamplingFeatureType.sampledFeatureType
      : null;
    if (!sampledFT) {
      throw new Error(`El FEATURE TYPE "${foiType}" no contiene 'sampledFeatureType'.`);
    }
    resultsDiv.innerHTML += `<p>Sampled Feature Type: <code>${sampledFT}</code></p>`;

    // 12.d) /api/feature-type-by-name?featureTypeName=<sampledFT>
    const nestedFTArr = await fetchFeatureTypeByName(sampledFT);
    if (!Array.isArray(nestedFTArr) || nestedFTArr.length === 0) {
      throw new Error(`No se encontró metadata para FEATURE TYPE "${sampledFT}".`);
    }
    const nestedMeta = nestedFTArr[0];

    // 12.e) extraer geo (Polygon) de nestedMeta
    const polygonGeo = extractPolygonFromFeatureMeta(nestedMeta);
    if (!polygonGeo) {
      throw new Error(`No se encontró campo 'geo' en spatialSamplingFeatureType de "${sampledFT}".`);
    }
    resultsDiv.innerHTML += `<p>Polígono Geo extraído (primer objeto):</p>
                             <pre>${JSON.stringify(polygonGeo, null, 2)}</pre>`;

    // 12.f) Según el formato que devuelva el API, a veces traen directamente WKT, a veces GeoJSON.
    // Si el campo 'polygonGeo' ya es un GeoJSON válido, podemos dibujarlo directamente. 
    // Pero si es un WKT, debemos enviarlo a /api/filter-feature-of-interest?featureTypeName=<sampledFT>&geometryFilter=<WKT>.
    //
    // Para este ejemplo, supongamos que 'polygonGeo' es WKT (string). Si fuera GeoJSON, habría que adaptarlo.
    //
    let finalGeoJSON = null;
    if (typeof polygonGeo === "string") {
      //  12.f.a) invocar /api/filter-feature-of-interest
      const arrFiltered = await fetchFilterFeatureOfInterest(sampledFT, polygonGeo);
      if (!Array.isArray(arrFiltered) || arrFiltered.length === 0) {
        throw new Error(`filter-feature-of-interest devolvió array vacío para "${sampledFT}" con ese WKT.`);
      }
      // Supondremos que arrFiltered es un array de objetos GeoJSON o similar
      finalGeoJSON = arrFiltered;
      resultsDiv.innerHTML += `<p>Recibido array con <strong>${arrFiltered.length}</strong> geometrías:</p>
                               <pre>${JSON.stringify(arrFiltered, null, 2)}</pre>`;
    } else {
      // 12.f.b) Si ya viniera en formato GeoJSON directamente:
      finalGeoJSON = polygonGeo;
      resultsDiv.innerHTML += `<p>Usando directamente geoJSON extraído:</p>
                               <pre>${JSON.stringify(polygonGeo, null, 2)}</pre>`;
    }

    // 12.g) Dibujar finalGeoJSON sobre el mapa
    if (finalGeoJSON) {
      drawGeoJSONOnMap(map, finalGeoJSON);
    }
  } catch (error) {
    console.error("ERROR en la cadena de fetch:", error);
    resultsDiv.innerHTML += `<div class="error-msg">Error: ${error.message}</div>`;
  }
});
