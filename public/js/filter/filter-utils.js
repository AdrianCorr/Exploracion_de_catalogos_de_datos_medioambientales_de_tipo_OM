// public/js/filter/filter-utils.js

/**
 * Realiza la petición al endpoint /api/filter-process con los filtros indicados.
 * @param {string} typeName    Nombre del tipo de proceso (requerido).
 * @param {string} keyword     Filtrado por palabra clave (opcional).
 * @param {string} startDate   Fecha de inicio en formato ISO (opcional).
 * @param {string} endDate     Fecha de fin en formato ISO (opcional).
 * @returns {Promise<Array>}   Array con los resultados del filtro.
 * @throws {Error}             Si falta typeName o la respuesta HTTP no es exitosa.
 */
export async function filterProcesses(typeName, keyword, startDate, endDate) {
  if (!typeName) {
    throw new Error("Por favor, introduzca un nombre de tipo de proceso.");
  }

  const params = new URLSearchParams({ processTypeName: typeName });
  if (keyword)   params.append("keywordFilter", keyword);
  if (startDate) params.append("startDate", startDate);
  if (endDate)   params.append("endDate", endDate);

  const resp = await fetch(`/api/filter-process?${params.toString()}`);
  if (!resp.ok) {
    throw new Error(`Error HTTP ${resp.status}: ${resp.statusText}`);
  }
  return resp.json();
}

/**
 * Formatea una cadena ISO (solo fecha) a "DD/MM/YYYY".
 * @param {string} isoString  Fecha en formato ISO.
 * @returns {string}          Fecha formateada o cadena vacía si no existe.
 */
export function formatDate(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  const day   = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year  = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Formatea una cadena ISO con hora a "DD/MM/YYYY HH:MM:SS".
 * @param {string} isoString  Fecha y hora en formato ISO.
 * @returns {string}          Fecha y hora formateadas o cadena vacía si no existe.
 */
export function formatDateWithSeconds(isoString) {
  if (!isoString) return "";
  const date   = new Date(isoString);
  const day    = String(date.getUTCDate()).padStart(2, "0");
  const month  = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year   = date.getUTCFullYear();
  const hours  = String(date.getUTCHours()).padStart(2, "0");
  const minutes= String(date.getUTCMinutes()).padStart(2, "0");
  const seconds= String(date.getUTCSeconds()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

/**
 * Crea un elemento heading (<h1>…<h6>) con texto y clase opcional.
 * @param {string} tag       Etiqueta de heading (e.g. "h3", "h4").
 * @param {string} text      Texto a mostrar.
 * @param {string} [className] Clase CSS a aplicar (opcional).
 * @returns {HTMLElement}    Nodo heading creado.
 */
export function createHeading(tag, text, className = "") {
  const el = document.createElement(tag);
  el.textContent = text;
  if (className) el.className = className;
  return el;
}

/**
 * Crea un párrafo con formato "<strong>clave:</strong> valor".
 * @param {string} key       Texto de la clave (negrita).
 * @param {string|number} val Valor a mostrar.
 * @param {string} [className] Clase CSS a aplicar (opcional).
 * @returns {HTMLElement}    Nodo párrafo creado.
 */
export function createLabeledParagraph(key, val, className = "") {
  const p = document.createElement("p");
  p.innerHTML = `<strong>${key}:</strong> ${val ?? "-"}`;
  if (className) p.className = className;
  return p;
}

/**
 * Crea un heading con etiqueta y un <span> con el texto adicional.
 * @param {string} label      Texto de la etiqueta antes del span.
 * @param {string} text       Texto del span.
 * @param {string} [className] Clase CSS para el heading.
 * @returns {HTMLElement}     Heading con el span anidado.
 */
export function createTitleWithSpan(label, text, className = "") {
  const heading = createHeading("h4", `${label}: `, className);
  const span    = document.createElement("span");
  span.textContent = text;
  heading.appendChild(span);
  return heading;
}
