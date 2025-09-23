// Centralized animation/style injections used across the app

export function injectGlobalAnimations(): void {
  if (document.getElementById('rebang-global-animations')) return;

  const style = document.createElement('style');
  style.id = 'rebang-global-animations';
  style.textContent = `
      /* Fade-in animation */
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .fade-in {
        animation: fadeIn 0.6s ease-out forwards;
      }
      
      /* Hue-shift animation */
      @keyframes hue-shift {
        0% { filter: hue-rotate(0deg); }
        50% { filter: hue-rotate(-90deg); }
        100% { filter: hue-rotate(0deg); }
      }
      
      .animate-hue-shift {
        animation: hue-shift 3s infinite ease-in-out;
        mix-blend-mode: normal;
        pointer-events: none;
      }
      
      /* Logo hover effect */
      .logo-hover {
        transform: rotate(5deg) scale(1.1);
      }
      
      /* Brightness filter */
      .brightness-115 {
        filter: brightness(1.15);
      }
      
      /* Typography classes */
      .heebo-heading {
        font-family: "Heebo", sans-serif;
        font-optical-sizing: auto;
        font-weight: 700;
        font-style: normal;
        letter-spacing: -0.02em;
      }
      
      .josefin-sans-exclamation {
        font-family: "Josefin Sans", sans-serif;
        font-optical-sizing: auto;
        font-weight: 900;
        font-style: normal;
        transform: scaleX(1.4);
        display: inline-block;
        letter-spacing: -0.05em;
      }
      
      /* Text shadow animation */
      @keyframes pulse-shadow {
        0% { text-shadow: 0 0 4px rgba(0, 0, 0, 0.7); }
        50% { text-shadow: 0 0 8px rgba(0, 0, 0, 0.9); }
        100% { text-shadow: 0 0 4px rgba(0, 0, 0, 0.7); }
      }
      
      .animate-pulse-shadow {
        animation: pulse-shadow 4s infinite ease-in-out;
      }
      
      .rebang-glow {
        text-shadow: 0 0 10px rgba(186, 85, 211, 0.4);
      }
      
      /* Typewriter animation */
      .animate-typewriter {
        overflow: hidden;
        white-space: nowrap;
        margin: 0 auto;
        border-right: 3px solid #a788ff;
        width: 0;
        animation: typing 3.5s steps(40, end) forwards, blink 1s step-end infinite;
      }
      
      @keyframes typing {
        from { width: 0 }
        to { width: 100% }
      }
      
      @keyframes blink {
        from, to { border-color: transparent }
        50% { border-color: #a788ff; }
      }
  `;
  document.head.appendChild(style);
}


