// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      'no-console': 2,
      'react/prop-types': 0,
      'react-hooks/exhaustive-deps': 0,
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-declaration-merging': 'warn',
      '@typescript-eslint/no-unused-vars' : 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',
      'indent': [
        'error',
        2
      ],
      'linebreak-style': [
        'warn',
        'windows'
      ],
      'quotes': [
        'error',
        'single'
      ],
      'semi': [
        'error',
        'always'
      ]
    },
    plugins: {
      react
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 2020,
        sourceType: 'module'
      },
      parser: tseslint.parser
    }
  },
  {
    ignores: [
      '**/lib',
      '**/videos/*.ts',
      '**/build',
      'dev.js',
      'tsc.ts'
    ]
  },
  {
    files: ['gui/react/**/*'],
    rules: {
      'no-console': 0
    }
  }
);