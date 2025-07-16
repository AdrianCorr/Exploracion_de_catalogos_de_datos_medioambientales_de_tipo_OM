/**
 * filter-utils.js — Funciones auxiliares:
 *  • filterProcesses  : hace la llamada fetch al endpoint /api/filter-process
 *  • formatDate        : formatea fechas YYYY-MM-DD (solo fecha)
 *  • formatDateWithSeconds: formatea ISO con hora, minutos y segundos
 *  • createHeading     : crea un nodo <h*> con texto y clase opcional
 *  • createLabeledParagraph: crea <p><strong>Key:</strong> Valor</p>
 *  • createTitleWithSpan: crea <h4>Label: <span>texto</span></h4>
 */

export async function filterProcesses(typeName, keyword, startDate, endDate) {
  if (!typeName) throw new Error("Por favor, introduzca un nombre de tipo de proceso.");

  const params = new URLSearchParams({ processTypeName: typeName });
  if (keyword) params.append("keywordFilter", keyword);
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);

  const resp = await fetch(`/api/filter-process?${params.toString()}`);
  if (!resp.ok) throw new Error(`Error HTTP ${resp.status}: ${resp.statusText}`);
  return await resp.json();
}

export function formatDate(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

export function formatDateWithSeconds(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

export function createHeading(tag, text, className = "") {
  const el = document.createElement(tag);
  el.textContent = text;
  if (className) el.className = className;
  return el;
}

export function createLabeledParagraph(key, val, className = "") {
  const p = document.createElement("p");
  p.innerHTML = `<strong>${key}:</strong> ${val ?? "-"}`;
  if (className) p.className = className;
  return p;
}

export function createTitleWithSpan(label, text, className) {
  const heading = createHeading("h4", `${label}: `, className);
  const span = document.createElement("span");
  span.textContent = text;
  heading.appendChild(span);
  return heading;
}
