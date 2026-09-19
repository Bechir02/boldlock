/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/web/**/*.{html,js}",
    "./src/extension/**/*.{html,js}"
  ],
  theme: {
    extend: {
      colors: {
        linkedin: {
          blue: '#0a66c2',
          hover: '#004182',
          light: '#e8f3fc',
          bg: '#f3f2ef',
          border: '#e0dfdc',
          text: '#191919',
          muted: '#666666'
        }
      },
      fontFamily: {
        linkedin: [
          '-apple-system',
          'system-ui',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif'
        ]
      }
    }
  },
  plugins: []
};
