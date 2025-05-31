// public/js/modal.js

/**
 * Muestra un modal superpuesto con un título y un contenido (nodo DOM).
 */
export function showModal(titleText, contentElement) {
  const overlay = document.getElementById("modalOverlay");
  overlay.innerHTML = "";

  const modal = document.createElement("div");
  modal.className = "modal";

  // Cabecera del modal
  const header = document.createElement("div");
  header.className = "modal-header";
  header.textContent = titleText;

  const closeBtn = document.createElement("button");
  closeBtn.className = "modal-close";
  closeBtn.textContent = "×";
  closeBtn.onclick = () => hideModal();
  header.appendChild(closeBtn);

  // Cuerpo del modal
  const body = document.createElement("div");
  body.className = "modal-body";
  body.appendChild(contentElement);

  modal.appendChild(header);
  modal.appendChild(body);
  overlay.appendChild(modal);
  overlay.classList.remove("hidden");
}

/**
 * Oculta el modal (añade la clase .hidden a #modalOverlay).
 */
export function hideModal() {
  const overlay = document.getElementById("modalOverlay");
  overlay.classList.add("hidden");
}
