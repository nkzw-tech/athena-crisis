import deities from '@deities/eslint-plugin';
import fbtee from '@nkzw/eslint-plugin-fbtee';
import findWorkspaces from '@nkzw/find-workspaces';
import nkzw from '@nkzw/oxlint-config';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from 'oxlint';

const packageDir = findWorkspaces(import.meta.dirname).concat(
  existsSync(join(import.meta.dirname, './electron')) ? ['./electron'] : [],
  existsSync(join(import.meta.dirname, './mobile')) ? ['./mobile'] : [],
);

export default defineConfig({
  env: {
    browser: true,
    builtin: true,
    es2024: true,
    node: true,
  },
  extends: [nkzw],
  ignorePatterns: [
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
  jsPlugins: [
    '@deities/eslint-plugin',
    '@nkzw/eslint-plugin-fbtee',
    'eslint-plugin-workspaces',
    { name: 'import-x-js', specifier: 'eslint-plugin-import-x' },
  ],
  overrides: [
    {
      files: ['**/__generated__/**/*.ts'],
      rules: {
        'unicorn/no-abusive-eslint-disable': 'off',
      },
    },
    {
      files: ['scripts/fixtures/**/*.tsx'],
      rules: {
        'unicorn/numeric-separators-style': 'off',
      },
    },
    {
      files: ['i18n/**/*.ts', 'hera/i18n/**/EntityMap.tsx'],
      rules: {
        'perfectionist/sort-objects': 'off',
      },
    },
    {
      files: ['artemis/**/*.tsx'],
      rules: {
        'react-hooks/rules-of-hooks': 'off',
      },
    },
    {
      files: [
        '{codegen,infra,scripts}/**/*.tsx',
        'artemis/{prisma,scripts}/**/*.tsx',
        'artemis/artemis.tsx',
      ],
      rules: {
        'no-console': 'off',
      },
    },
    {
      files: ['artemis/discord/**/*.tsx'],
      rules: {
        'no-console': ['error', { allow: ['error'] }],
      },
    },
    {
      files: ['**/__tests__/**/*.tsx'],
      rules: {
        'workspaces/no-relative-imports': 'off',
      },
    },
    {
      files: ['hera/behavior/**/*.tsx', 'hera/editor/behavior/**/*.tsx'],
      rules: {
        'react-hooks/rules-of-hooks': 'off',
      },
    },
    {
      files: ['tests/display.tsx', 'ares/src/entitlements/useIAPCheckout.tsx'],
      rules: {
        'react-hooks-js/immutability': 'off',
      },
    },
    {
      files: ['hera/GameMap.tsx'],
      rules: {
        'react/display-name': 'off',
      },
    },
    {
      files: ['hera/ui/SkillDescription.tsx', 'hera/ui/TeamSelector.tsx'],
      rules: {
        'react/jsx-key': 'off',
      },
    },
    {
      files: [
        'artemis/graphql/mutations/testPushNotification.tsx',
        'athena/lib/__tests__/assignUnitNames.test.tsx',
        'codegen/generate-actions.tsx',
        'hera/card/UnitCard.tsx',
        'ui/Form.tsx',
      ],
      rules: {
        'unicorn/consistent-function-scoping': 'off',
      },
    },
    {
      files: ['ares/src/game/ContinueGameListHeader.tsx'],
      rules: {
        'unicorn/no-useless-spread': 'off',
      },
    },
  ],
  rules: {
    ...deities.configs.strict.rules,
    ...fbtee.configs.recommended.rules,
    '@typescript-eslint/array-type': ['error', { default: 'generic' }],
    '@typescript-eslint/no-restricted-imports': [
      'error',
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
    'import-x-js/no-extraneous-dependencies': [
      'error',
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
          'oxlint.config.ts',
        ],
        packageDir,
      },
    ],
    'import-x-js/no-unresolved': [
      'error',
      {
        ignore: [String.raw`\?worker`, 'athena-crisis:*', 'glob', 'virtual:*'],
      },
    ],
    'no-restricted-globals': ['error', 'alert', 'confirm'],
    'workspaces/no-absolute-imports': 'error',
    'workspaces/no-relative-imports': 'error',
  },
  settings: {
    'import-x-js/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import-x-js/resolver': {
      node: true,
      typescript: true,
    },
    'import-x/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import-x/resolver': {
      node: true,
      typescript: true,
    },
  },
});
