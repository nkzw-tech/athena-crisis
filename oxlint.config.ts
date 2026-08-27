import deities from '@deities/eslint-plugin';
import fbtee from '@nkzw/eslint-plugin-fbtee';
import nkzw from '@nkzw/oxlint-config';
import { defineConfig } from 'oxlint';

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
    'docs/vite.config.ts.timestamp-*',
    'electron/out/',
    'hera/i18n/CampaignMap.tsx',
    'mobile/android',
    'mobile/ios',
  ],
  jsPlugins: ['@deities/eslint-plugin', '@nkzw/eslint-plugin-fbtee', 'eslint-plugin-workspaces'],
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
        'electron/scripts/**/*.ts',
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
        'react/immutability': 'off',
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
    'no-restricted-globals': ['error', 'alert', 'confirm'],
    'workspaces/no-absolute-imports': 'error',
    'workspaces/no-relative-imports': 'error',
  },
});
