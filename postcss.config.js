export default {
  plugins: {
    "postcss-import": {},
    "tailwindcss": "./tailwind.config.ts",
    "autoprefixer": {},
    "postcss-preset-env": { stage: 3, preserve: true },
  },
};
