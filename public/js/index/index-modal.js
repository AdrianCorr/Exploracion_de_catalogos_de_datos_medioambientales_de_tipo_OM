// public/js/index-modal.js

/**
 * Muestra un modal con overlay y contenido dinámico.
 * Permite cerrar al clicar fuera o en el botón de cierre.
 *
 * @param {string} titleText         Texto del título del modal.
 * @param {HTMLElement} contentElement Elemento a insertar en el cuerpo del modal.
 */
export function showModal(titleText, contentElement) {
  // Crear overlay semitransparente
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  // Cerrar modal al hacer clic fuera de él
  overlay.addEventListener("click", () => {
    overlay.remove();
  });

  // Crear contenedor principal del modal
  const modal = document.createElement("div");
  modal.className = "modal";
  // Prevenir cierre al hacer clic dentro del modal
  modal.addEventListener("click", (e) => e.stopPropagation());

  // Cabecera: título y botón de cierre
  const header = document.createElement("div");
  header.className = "modal-header";

  const titleElem = document.createElement("span");
  titleElem.textContent = titleText;
  header.appendChild(titleElem);

  const closeBtn = document.createElement("button");
  closeBtn.className = "modal-close";
  closeBtn.textContent = "×";
  closeBtn.onclick = (e) => {
    e.stopPropagation();
    overlay.remove();
  };
  header.appendChild(closeBtn);

  // Cuerpo del modal
  const body = document.createElement("div");
  body.className = "modal-body";
  body.appendChild(contentElement);

  // Ensamblar modal
  modal.appendChild(header);
  modal.appendChild(body);
  overlay.appendChild(modal);

  // Añadir al DOM
  document.body.appendChild(overlay);
}
