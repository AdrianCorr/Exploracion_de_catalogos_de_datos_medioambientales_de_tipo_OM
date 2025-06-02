// public/js/filter.js

/**
 * Al cargar la página, leemos el parámetro `processType` de la URL
 * y lo escribimos en el input correspondiente.
 */
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const processType = params.get("processType") || "";
  document.getElementById("processType").value = decodeURIComponent(processType);
});

/**
 * Función que se llama al enviar el formulario de filtrado.
 * Por ahora, solo muestra un alert con los valores.
 * Más adelante se podrá reemplazar con la lógica de filtrado real.
 */
export function enviarFiltro() {
  const processType = document.getElementById("processType").value;
  const keywords = document.getElementById("keywords").value;
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;

  // Ejemplo de uso: mostramos en consola y en un alert
  console.log("Filtrando:", { processType, keywords, startDate, endDate });
  alert(
    `Filtro aplicado:\n\nProcess Type: ${processType}\nKeywords: ${keywords}\nStart Date: ${startDate}\nEnd Date: ${endDate}`
  );
}
