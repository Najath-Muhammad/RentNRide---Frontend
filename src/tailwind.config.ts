import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    "./index.html",       
    "./src/**/*.{ts,tsx}", // all TS/TSX files in src
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
