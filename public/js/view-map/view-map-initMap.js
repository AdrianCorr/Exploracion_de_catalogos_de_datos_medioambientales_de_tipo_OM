// view-map-initMap.js

export function initViewMaps() {
  // Mapa pequeño
  const smallMap = L.map("smallMap").setView([43.05, -8.15], 5);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(smallMap);

  const drawnItems = new L.FeatureGroup();
  smallMap.addLayer(drawnItems);

  smallMap.addControl(
    new L.Control.Draw({
      draw: {
        rectangle: { shapeOptions: { color: "#97009c" } },
        polygon: false, polyline: false, circle: false,
        marker: false, circlemarker: false,
      },
      edit: { featureGroup: drawnItems, remove: true },
    })
  );

  // Mapa principal
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
  });

  const map = L.map("map").setView([43.05, -8.15], 7);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  if (L.Control && L.Control.zoomHome) {
    new L.Control.zoomHome({
      position: "topleft",
      homeCoordinates: [43.05, -8.15],
      homeZoom: 8,
      zoomHomeIcon: "home",
    }).addTo(map);
  }

  return { map, smallMap, drawnItems };
}
