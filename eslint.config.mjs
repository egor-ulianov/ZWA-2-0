import eslintConfigPrettier from 'eslint-config-prettier';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

const config = [
  ...nextCoreWebVitals,
  {
    ignores: ['node_modules/**', '.next/**', 'out/**'],
  },
  {
    files: ['interactive_zwa_*.jsx'],
    rules: {
      // Lesson examples intentionally use native img markup for instructional content.
      '@next/next/no-img-element': 'off',
    },
  },
  {
    rules: {
      'no-console': 'off',
    },
  },
  eslintConfigPrettier,
];

export default config;
