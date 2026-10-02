/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sambo: {
          dark: '#111827',
          workspace: '#F8FAFC',
          red: {
            DEFAULT: '#DC2626',
            hover: '#B91C1C',
            dark: '#991B1B',
            light: '#FEF2F2',
          },
          status: {
            verified: '#10B981',
            warning: '#F59E0B',
            error: '#EF4444',
          }
        }
      }
    },
  },
  plugins: [],
}
