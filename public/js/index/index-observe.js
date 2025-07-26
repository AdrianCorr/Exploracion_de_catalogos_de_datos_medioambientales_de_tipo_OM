// public/js/index-observe.js

/**
 * Inicializa un MutationObserver para detectar cambios en el contenedor de resultados.
 * Cuando el texto interno cambia y es JSON válido, invoca la función de callback con el objeto parseado.
 *
 * @param {function(Object): void} onJsonChangeCallback  Función que recibe el JSON parseado.
 */
export function initResultObserver(onJsonChangeCallback) {
  const targetNode = document.getElementById("resultDisplay");

  // Crear observer que vigila adición/eliminación de nodos y cambios de texto
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "childList" || mutation.type === "characterData") {
        try {
          const json = JSON.parse(targetNode.textContent);
          onJsonChangeCallback(json);
        } catch {
          // Ignorar contenido no JSON
        }
      }
    });
  });

  // Iniciar la observación en el contenedor, incluyendo cambios en nodos y texto
  observer.observe(targetNode, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}
