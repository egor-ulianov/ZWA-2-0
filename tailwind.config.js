/** @type {import('tailwindcss').Config} */
const tailwindConfig = {
  content: [
    './pages/**/*.{js,jsx}',
    './src/**/*.{js,jsx}',
    './interactive_zwa_*_presentation.jsx',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default tailwindConfig;
