// public/js/observer.js

/**
 * Inicializa un MutationObserver que vigila cambios en #resultDisplay.
 * onJsonChangeCallback: función que recibirá el JSON parseado cada vez
 *                     que cambie el contenido del div.
 */
export function initResultObserver(onJsonChangeCallback) {
  const disp = document.getElementById("resultDisplay");
  const obs = new MutationObserver((mutations) => {
    mutations.forEach((m) => {
      if (["childList", "characterData"].includes(m.type)) {
        try {
          const json = JSON.parse(disp.textContent);
          onJsonChangeCallback(json);
        } catch {
          // Si el contenido no es JSON válido, simplemente ignorar.
        }
      }
    });
  });
  obs.observe(disp, { childList: true, subtree: true, characterData: true });
}
