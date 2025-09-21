import postcssImport from 'postcss-import';
import postcssPresetEnv from 'postcss-preset-env';
import tailwindcss from '@tailwindcss/postcss';

export default {
  plugins: [
    postcssImport(),
    tailwindcss(),
    postcssPresetEnv({ stage: 3, preserve: true }),
  ],
};
