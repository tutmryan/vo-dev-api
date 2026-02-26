import js from '@eslint/js'
import graphqlPlugin from '@graphql-eslint/eslint-plugin'
import prettierPlugin from 'eslint-plugin-prettier'
import * as tseslint from 'typescript-eslint'
import noHardcodedColumnTypes from './.eslint/no-hardcoded-column-types.mjs'
import uuidRequiresTransformer from './.eslint/uuid-requires-transformer.mjs'

export default [
  // Ignore build artifacts
  {
    ignores: ['build/**', 'node_modules/**'],
  },

  js.configs.recommended,

  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    ignores: ['src/**/*.test.ts', 'src/**/test.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname, // Flat config requires absolute tsconfig path when using project service
        // sourceType: 'module',
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
      '@typescript-eslint/no-unnecessary-condition': 'error',
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

  {
    files: ['src/**/entities/**/*.ts'],
    plugins: {
      vo: {
        rules: {
          'no-hardcoded-column-types': noHardcodedColumnTypes,
          'uuid-requires-transformer': uuidRequiresTransformer,
        },
      },
    },
    rules: {
      'vo/no-hardcoded-column-types': 'error',
      'vo/uuid-requires-transformer': 'error',
    },
  },

  {
    files: ['src/**/*.graphql'],
    languageOptions: {
      parser: graphqlPlugin.parser,
    },
    plugins: {
      '@graphql-eslint': graphqlPlugin,
    },
    rules: graphqlPlugin.configs['flat/schema-recommended'].rules,
  },
]
