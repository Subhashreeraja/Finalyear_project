/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // From Smart City Crowd / CrowdAi design
        header: {
          DEFAULT: '#4F1D7C',
          dark: '#3d1761',
        },
        body: {
          DEFAULT: '#F0ECF9',
          light: '#F8F4FA',
        },
        accent: {
          primary: '#5C3295',
          muted: '#6E44A3',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
