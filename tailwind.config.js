/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          50: '#e6f4ea',
          100: '#d1fae5',
          700: '#0f766e',
        },
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          500: '#64748b',
          900: '#0f172a',
        }
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'soft': '0 8px 30px rgb(0,0,0,0.02)',
      }
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
}
