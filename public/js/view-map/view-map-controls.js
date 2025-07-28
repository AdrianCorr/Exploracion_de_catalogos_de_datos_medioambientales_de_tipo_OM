// view-map-controls.js

/**
 * Inicializa el <select> de variables con sus etiquetas.
 */
export function initVariableSelect(varSelect, bands, labels) {
  varSelect.innerHTML = "";
  bands.forEach((band) => {
    const opt = document.createElement("option");
    opt.value = band;
    opt.textContent = labels[band] || band;
    varSelect.appendChild(opt);
  });
}

/**
 * Inicializa el <select> de tiempo con valores 1..93
 */
export function initTimeSelect(timeSelect) {
  timeSelect.innerHTML = "";
  for (let i = 1; i <= 93; i++) {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = i;
    timeSelect.appendChild(opt);
  }
}

/**
 * Inicializa el <select> de profundidades (solo ROMS)
 */
export function initDepthSelect(depthSelect, depths) {
  depthSelect.innerHTML = "";
  depths.forEach((d) => {
    const opt = document.createElement("option");
    opt.value = d;
    opt.textContent = d;
    depthSelect.appendChild(opt);
  });
}
