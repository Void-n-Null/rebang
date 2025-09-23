export function ensureRecursiveInputStyling(): void {
  if (document.getElementById('recursive-style')) return;
  const style = document.createElement('style');
  style.id = 'recursive-style';
  style.textContent = `
    .recursive-input {
      border-color: rgba(138, 43, 226, 0.3) !important;
      transition: all 0.3s ease;
    }
    .recursive-input:focus {
      border-color: rgba(138, 43, 226, 0.5) !important;
      box-shadow: 0 0 10px rgba(138, 43, 226, 0.2);
    }
  `;
  document.head.appendChild(style);
}


