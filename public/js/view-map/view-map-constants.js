// view-map-constants.js

// Etiquetas de bandas WRF
export const WRF_BAND_LABELS = {
  Band1: "Dirección del viento (°)",
  Band2: "Velocidad del viento (m/s)",
  Band3: "Presión (Pa)",
  Band4: "Precipitación (kg/m²)",
  Band5: "Humedad relativa (%)",
  Band6: "Nieve acumulada (kg/m²)",
  Band7: "Cota de nieve (m)",
  Band8: "Temperatura (K)"
};

// Etiquetas de bandas ROMS
export const ROMS_BAND_LABELS = {
  Band1: "Salinidad (PSU)",
  Band2: "Temperatura (K)",
  Band3: "Velocidad U (m/s)",
  Band4: "Velocidad V (m/s)",
  Band5: "Altura superficial (m)"
};

// Escalas de colores con rangos min/max
export const SCALES = {
  WRF: {
    Band1: { min: 0, max: 360, colors: [
      '#ff0000', '#ff8000', '#ffff00', '#80ff00', '#00ff00', '#00ff80', '#00ffff',
      '#0080ff', '#0000ff', '#8000ff', '#ff00ff', '#ff0080', '#ff0000'
    ]},
    Band2: { min: 0, max: 30, colors: [
      '#001a4d', '#0033a0', '#0055ff', '#00bfff', '#00ffcc', '#00ff66', '#66ff00',
      '#ccff00', '#ffff00', '#ffcc00', '#ff9900', '#ff6600', '#ff3300', '#ff0000'
    ]},
    Band3: { min: 95000, max: 105000, colors: [
      '#001a4d', '#0055ff', '#00bfff', '#00ffcc', '#66ff66', '#ffff66', '#ffcc00',
      '#ff9900', '#ff6600', '#ff3300', '#ff0000'
    ]},
    Band4: { min: 0, max: 50, colors: [
      '#e0f7fa', '#b2ebf2', '#4dd0e1', '#00bcd4', '#0097a7', '#43a047', '#cddc39',
      '#fff176', '#ffeb3b', '#ffd54f', '#ff9800', '#ff5722', '#f44336', '#b71c1c'
    ]},
    Band5: { min: 0, max: 1, colors: [
      '#f4e2d8', '#ffe082', '#fff176', '#c5e1a5', '#00ff00', '#00e676', '#00bfae',
      '#00bfff', '#00796b', '#004d40'
    ]},
    Band6: { min: 0, max: 50, colors: [
      '#ffffff', '#e0f7fa', '#b2ebf2', '#4dd0e1', '#00bcd4', '#0097a7', '#01579b', '#002f6c'
    ]},
    Band7: { min: 0, max: 5, colors: [
      '#f5f5f5', '#cfd8dc', '#b0bec5', '#90a4ae', '#78909c', '#607d8b',
      '#37474f', '#263238', '#0000ff'
    ]},
    Band8: { min: 260, max: 315, colors: [
      '#000080', '#0055ff', '#00bfff', '#00ffcc', '#00ff66', '#66ff00', '#ccff00',
      '#ffff00', '#ffcc00', '#ff9900', '#ff6600', '#ff3300', '#ff0000', '#b71c1c'
    ]}
  },
  ROMS: {
    Band1: { min: 33, max: 37, colors: [
      '#000080', '#0055ff', '#00bfff', '#00ffcc', '#00ff66', '#66ff00', '#ccff00',
      '#ffff00', '#ffcc00', '#ff9900', '#ff6600', '#ff3300', '#ff0000', '#b71c1c'
    ]},
    Band2: { min: 0, max: 30, colors: [
      '#000080', '#0055ff', '#00bfff', '#00ffcc', '#00ff66', '#66ff00', '#ccff00',
      '#ffff00', '#ffcc00', '#ff9900', '#ff6600', '#ff3300', '#ff0000', '#b71c1c'
    ]},
    Band3: { min: 0, max: 1, colors: [
      '#000080', '#0055ff', '#00bfff', '#00ffcc', '#00ff66', '#66ff00', '#ccff00',
      '#ffff00', '#ffcc00', '#ff9900', '#ff6600', '#ff3300', '#ff0000', '#b71c1c'
    ]},
    Band4: { min: 0, max: 1, colors: [
      '#000080', '#0055ff', '#00bfff', '#00ffcc', '#00ff66', '#66ff00', '#ccff00',
      '#ffff00', '#ffcc00', '#ff9900', '#ff6600', '#ff3300', '#ff0000', '#b71c1c'
    ]},
    Band5: { min: 0, max: 1, colors: [
      '#000080', '#0055ff', '#00bfff', '#00ffcc', '#00ff66', '#66ff00', '#ccff00',
      '#ffff00', '#ffcc00', '#ff9900', '#ff6600', '#ff3300', '#ff0000', '#b71c1c'
    ]}
  }
};

// Profundidades para ROMS
export const ROMS_DEPTHS = [0, 10, 20, 35, 75, 125, 150, 250, 400, 500, 1000, 1500, 2000, 3000, 4000];
