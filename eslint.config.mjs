// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

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
			'@typescript-eslint/no-unused-vars': 'warn',
			'@typescript-eslint/no-unused-expressions': 'warn',
			indent: ['error', 4],
			'linebreak-style': ['warn', 'windows'],
			quotes: ['error', 'single', { avoidEscape: true }],
			semi: ['error', 'always']
		},
		languageOptions: {
			parserOptions: {
				ecmaFeatures: {
					jsx: true
				},
				ecmaVersion: 2020,
				sourceType: 'module'
			},
			parser: tseslint.parser
		}
	},
	{
		ignores: ['**/lib', '**/videos', '**/build', 'dev.js', 'tsc.ts']
	},
	{
		files: ['gui/react/**/*'],
		rules: {
			'no-console': 0,
			indent: 'off'
		}
	},
	// Disables all rules that conflict with prettier
	prettier
);
