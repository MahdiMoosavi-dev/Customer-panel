// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'dist'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },

  // Architectural boundaries: features expose a public API only.
  {
    files: ['src/**/*.ts'],
    ignores: ['src/features/*/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*/*'],
              message:
                'Import a feature through its public API: `@/features/<feature>`.',
            },
          ],
        },
      ],
    },
  },

  // Dependency rule: inner layers never reach outward.
  {
    files: [
      'src/core/**/*.ts',
      'src/features/*/domain/**/*.ts',
      'src/features/*/application/**/*.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/infrastructure/**',
                '**/presentation/**',
                '@/shared/**',
                '@nestjs/*',
                '@nestjs/**',
                'express',
                'rxjs',
              ],
              message:
                'Domain and application layers must stay free of frameworks and outer layers.',
            },
          ],
        },
      ],
    },
  },
);
