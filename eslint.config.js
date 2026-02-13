import deities from '@deities/eslint-plugin';
import nkzw from '@nkzw/eslint-config';
import fbtee from '@nkzw/eslint-plugin-fbtee';
import findWorkspaces from '@nkzw/find-workspaces';
import workspaces from 'eslint-plugin-workspaces';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export default [
  ...nkzw,
  deities.configs.strict,
  fbtee.configs.recommended,
  {
    ignores: [
      'ares/vite.config.ts.timestamp-*',
      'artemis/prisma/athena-prisma-client/*',
      'artemis/prisma/pothos-types.ts',
      'dist/',
      'docs/vocs.config.tsx.timestamp-*',
      'electron/out/',
      'hera/i18n/CampaignMap.tsx',
      'mobile/android',
      'mobile/ios',
    ],
  },
  {
    plugins: {
      '@deities': deities,
      '@nkzw/fbtee': fbtee,
      workspaces,
    },
    rules: {
      '@typescript-eslint/array-type': [2, { default: 'generic' }],
      '@typescript-eslint/no-restricted-imports': [
        2,
        {
          paths: [
            {
              allowTypeImports: true,
              message: `Use 'react-relay/hooks.js' instead.`,
              name: 'react-relay',
            },
          ],
        },
      ],
      'import-x/no-extraneous-dependencies': [
        2,
        {
          devDependencies: [
            './{ares,artemis,deimos,offline}/vite.config.ts',
            './{ares,artemis}/scripts/**/*.{js,cjs,tsx}',
            './ares/ares.tsx',
            './artemis/prisma/seed.tsx',
            './artemis/prisma.config.ts',
            './codegen/**',
            './docs/vocs.config.tsx',
            './electron/**',
            './infra/**',
            './mobile/capacitor.config.ts',
            './scripts/**',
            './tests/**',
            './vitest.config.ts',
            '**/__tests__/**',
            'eslint.config.js',
          ],
          packageDir: findWorkspaces(import.meta.dirname).concat(
            existsSync(join(import.meta.dirname, './electron'))
              ? ['./electron']
              : [],
            existsSync(join(import.meta.dirname, './mobile'))
              ? ['./mobile']
              : [],
          ),
        },
      ],
      'import-x/no-unresolved': [
        2,
        {
          ignore: [
            String.raw`\?worker`,
            'athena-crisis:*',
            'glob',
            'virtual:*',
          ],
        },
      ],
      'no-extra-parens': 0,
      'no-restricted-globals': [2, 'alert', 'confirm'],
      'workspaces/no-absolute-imports': 2,
      'workspaces/no-relative-imports': 2,
    },
  },
  {
    files: ['**/__generated__/**/*.ts'],
    rules: {
      'unicorn/no-abusive-eslint-disable': 0,
    },
  },
  {
    files: ['scripts/fixtures/**/*.tsx'],
    rules: {
      'unicorn/numeric-separators-style': 0,
    },
  },
  {
    files: ['i18n/**/*.ts', 'hera/i18n/**/EntityMap.tsx'],
    rules: {
      'perfectionist/sort-objects': 0,
    },
  },
  {
    files: ['artemis/**/*.tsx'],
    rules: {
      'react-hooks/rules-of-hooks': 0,
    },
  },
  {
    files: [
      '{codegen,infra,scripts}/**/*.tsx',
      'artemis/{prisma,scripts}/**/*.tsx',
      'artemis/artemis.tsx',
    ],
    rules: {
      'no-console': 0,
    },
  },
  {
    files: ['artemis/discord/**/*.tsx'],
    rules: {
      'no-console': [2, { allow: ['error'] }],
    },
  },
  {
    files: ['**/__tests__/**/*.tsx'],
    rules: {
      'workspaces/no-relative-imports': 0,
    },
  },
  {
    files: ['hera/behavior/**/*.tsx', 'hera/editor/behavior/**/*.tsx'],
    rules: {
      'react-hooks/rules-of-hooks': 0,
    },
  },
];
