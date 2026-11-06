/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        apple: {
          bg: '#000000',
          green: '#30D158',
          amber: '#FF9F0A',
          red: '#FF453A',
          blue: '#0A84FF',
          silver: '#F5F5F7',
        },
        pcb: {
          bg: '#000000',
          surface: '#0A0A0C',
          border: 'rgba(255, 255, 255, 0.1)',
          trace: '#30D158',
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
        mono: [
          '"SF Mono"',
          '"JetBrains Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
}
