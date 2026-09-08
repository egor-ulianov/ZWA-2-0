import eslintConfigPrettier from 'eslint-config-prettier';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

export default [
  ...nextCoreWebVitals,
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'pages/index.jsx',
      'interactive_zwa_*.jsx',
      'src/config/**',
      'src/components/lesson/**',
      'src/components/playground/**',
      'tests/e2e/**',
      'tests/unit/lessons.test.js',
    ],
  },
  {
    rules: {
      'no-console': 'off',
    },
  },
  eslintConfigPrettier,
];
