// public/js/view/view.js

import {
  fetchFilterFeatureOfInterest,
  drawPointFeaturesOnMap
} from "./view-utils.js";

document.addEventListener("DOMContentLoaded", async () => {
  // 0) Fix para los iconos de marcador Leaflet cuando usamos CDN
  //   (borra cualquier _getIconUrl anterior y fuerza las URLs correctas)
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
    iconUrl:
      "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
    shadowUrl:
      "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png"
  });

  // 1) Parámetros de URL
  const params = new URLSearchParams(window.location.search);
  const featureTypeName =
    params.get("featureTypeName") || "ctd_intecmar.estacion";

  // 2) Inicializar mapa
  const galiciaCenter = [42.7, -8.0];
  const map = L.map("map").setView(galiciaCenter, 7);

  // 3) Capa base
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);

  // 4) Eliminar zoom por defecto
  map.zoomControl.remove();

  // 5) Añadir ZoomHome con icono de casa (FontAwesome)
  if (L.Control && L.Control.zoomHome) {
    new L.Control.zoomHome({
      position: "topleft",
      homeCoordinates: galiciaCenter,
      homeZoom: 8,
      zoomHomeIcon: "home",
      zoomHomeTitle: "Volver al inicio"
    }).addTo(map);
  }

  // 6) Grupo para Draw y control
  const drawnItems = new L.FeatureGroup();
  map.addLayer(drawnItems);

  const drawControl = new L.Control.Draw({
    draw: {
      polygon: false,
      polyline: false,
      circle: false,
      circlemarker: false,
      marker: false,
      rectangle: {
        shapeOptions: { color: "#97009c" }
      }
    },
    edit: {
      featureGroup: drawnItems,
      edit: true,
      remove: true
    }
  });
  map.addControl(drawControl);

  // 7) Eventos Draw
  const coordsDiv = document.getElementById("bbox-coordinates");
  const emptyHTML = `<span class="coordinate-label">Coordenadas del BBox:</span>
                     <br>
                     <span class="coordinate-label">SW:</span>
                     <br>
                     <span class="coordinate-label">NE:</span>`;
  coordsDiv.innerHTML = emptyHTML;

  map.on("draw:created", (e) => {
    drawnItems.clearLayers();
    drawnItems.addLayer(e.layer);
    const b = e.layer.getBounds();
    coordsDiv.innerHTML = `<span class="coordinate-label">Coordenadas del BBox:</span>
                           <br>
                           <span class="coordinate-label">SW:</span> ${b.getSouthWest().lat.toFixed(6)} ${b.getSouthWest().lng.toFixed(6)}
                           <br>
                           <span class="coordinate-label">NE:</span> ${b.getNorthEast().lat.toFixed(6)} ${b.getNorthEast().lng.toFixed(6)}`;
  });

  map.on("draw:deleted", () => {
    coordsDiv.innerHTML = emptyHTML;
  });

  // 8) Mostrar en Results y dibujar marcadores
  const resultsDiv = document.getElementById("resultsList");
  resultsDiv.innerHTML = `<p><strong>Feature Type:</strong> ${featureTypeName}</p>
                          <hr><p>Cargando estaciones...</p>`;

  try {
    const features = await fetchFilterFeatureOfInterest(featureTypeName);
    resultsDiv.innerHTML += `<p>Obtenidas <strong>${features.length}</strong> estaciones.</p>`;
    drawPointFeaturesOnMap(map, features);
  } catch (err) {
    console.error(err);
    resultsDiv.innerHTML += `<div class="error-msg">Error: ${err.message}</div>`;
  }
});
