// public/js/modal.js

/**
 * Crea dinámicamente un overlay <div class="modal-overlay"> + un <div class="modal"> 
 * y lo añade al final del <body>. Cada llamada genera una capa nueva.
 */
export function showModal(titleText, contentElement) {
  // 1) Creamos el overlay
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  // 2) Dentro del overlay, creamos el contenedor principal del modal
  const modal = document.createElement("div");
  modal.className = "modal";

  // 3) Cabecera del modal (header)
  const header = document.createElement("div");
  header.className = "modal-header";

  // 3.1) Título
  const titleElem = document.createElement("span");
  titleElem.textContent = titleText;
  header.appendChild(titleElem);

  // 3.2) Botón "×" de cerrar
  const closeBtn = document.createElement("button");
  closeBtn.className = "modal-close";
  closeBtn.textContent = "×";
  // Cuando el usuario haga clic, eliminamos este overlay (solo el más reciente).
  closeBtn.onclick = (e) => {
    e.stopPropagation();
    overlay.remove();
  };
  header.appendChild(closeBtn);

  // 4) Cuerpo del modal (body)
  const body = document.createElement("div");
  body.className = "modal-body";
  body.appendChild(contentElement);

  // 5) Montar la estructura
  modal.appendChild(header);
  modal.appendChild(body);
  overlay.appendChild(modal);

  // 6) Insertamos el overlay al final de <body>
  document.body.appendChild(overlay);
}
