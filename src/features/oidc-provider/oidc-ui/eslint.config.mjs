import js from '@eslint/js'
import prettierPlugin from 'eslint-plugin-prettier'
import * as tseslint from 'typescript-eslint'

export default [
  {
    ignores: ['dist/**', 'node_modules/**'],
  },

  js.configs.recommended,

  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    ignores: ['**/*.test.ts', '**/test.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'warn',
      'no-console': 'warn',
      'prefer-template': 'error',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off', 
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          ignoreRestSiblings: true,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '.*',
        },
      ],
    },
  },
]
