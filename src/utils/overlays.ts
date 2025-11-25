import { createElement } from "./dom";

export function showLoadingOverlay(): HTMLDivElement {
  const loadingOverlay = createElement('div', {
    className: 'fixed inset-0 bg-[#000] bg-opacity-90 z-50 flex items-center justify-center',
    style: 'backdrop-filter: blur(5px);'
  });

  const spinner = createElement('div', {
    className: 'w-12 h-12 border-4 border-[#3a86ff] border-t-transparent rounded-full animate-spin'
  });

  loadingOverlay.appendChild(spinner);
  document.body.appendChild(loadingOverlay);
  return loadingOverlay;
}

export function hideOverlay(overlay: HTMLElement | null): void {
  if (overlay && overlay.parentElement) {
    overlay.parentElement.removeChild(overlay);
  }
}



