import {
  fetchFilterFeatureOfInterest,
  drawPointFeaturesOnMap
} from "./view-utils.js";

document.addEventListener("DOMContentLoaded", async () => {
  // 1) Parámetros de URL (ahora pasamos featureTypeName desde filter)
  const params = new URLSearchParams(window.location.search);
  const featureTypeName = params.get("featureTypeName") || "ctd_intecmar.estacion";

  // 2) Inicializar mapa centrado en Galicia
  const galiciaCenter = [42.5, -8.0];
  const map = L.map("map").setView(galiciaCenter, 8);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);
  map.zoomControl.remove();
  if (L.Control && L.Control.zoomHome) {
    new L.Control.zoomHome({
      position: "topleft",
      homeCoordinates: galiciaCenter,
      homeZoom: 8
    }).addTo(map);
  }

  // 3) Mostrar en “Results” qué featureType estamos usando
  const resultsDiv = document.getElementById("resultsList");
  resultsDiv.innerHTML = `<p><strong>Feature Type:</strong> ${featureTypeName}</p>
                          <hr><p>Cargando estaciones...</p>`;

  // 4) Fetch y dibujado de marcadores
  try {
    const features = await fetchFilterFeatureOfInterest(featureTypeName);
    resultsDiv.innerHTML += `<p>Obtenidas <strong>${features.length}</strong> estaciones.</p>`;
    drawPointFeaturesOnMap(map, features);
  } catch (err) {
    console.error(err);
    resultsDiv.innerHTML += `<div class="error-msg">Error: ${err.message}</div>`;
  }
});
