import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Clean notebook with burgundy/wine accent
        burgundy: {
          DEFAULT: '#A0353A',  // Main burgundy
          50: '#FAE8E9',
          100: '#F5D1D3',
          200: '#EBA3A7',
          300: '#E1757B',
          400: '#D7474F',
          500: '#CD1923',
          600: '#A0353A',
          700: '#7D2A2E',
          800: '#5A1F22',
          900: '#371416',
        },
        gray: {
          50: '#F9F9F9',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
      },
      fontFamily: {
        sans: ['Pretendard', 'system-ui', 'sans-serif'],
      },
      borderWidth: {
        '1': '1px',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};
export default config;
