/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3a86ff',
        'primary-hover': '#2d79fe',
        accent: '#ff006e',
        'text-color': '#333333',
        'text-light': '#666666',
        'bg-color': '#ffffff',
        'bg-light': '#f8f9fa',
      },
      boxShadow: {
        'sm': '0 2px 4px rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px rgba(0, 0, 0, 0.07)',
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
      },
    },
  },
  plugins: [],
} 