const { join } = require('node:path');
const { existsSync, readFileSync } = require('node:fs');

module.exports = {
  extends: ['@nkzw', 'plugin:@deities/strict'],
  ignorePatterns: [
    'artemis/prisma/pothos-types.ts',
    'dist/',
    'electron/out/',
    'hera/i18n/CampaignMap.tsx',
  ],
  overrides: [
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
      files: ['i18n/**/*.cjs', 'hera/i18n/**/EntityMap.tsx'],
      rules: {
        'sort-keys-fix/sort-keys-fix': 0,
      },
    },
    {
      files: [
        '{codegen,infra,scripts,tests}/**/*.tsx',
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
  ],
  plugins: ['@deities'],
  rules: {
    '@typescript-eslint/array-type': [2, { default: 'generic' }],
    '@typescript-eslint/no-restricted-imports': [
      2,
      {
        paths: [
          {
            allowTypeImports: true,
            message: `Use 'react-relay/hooks' instead.`,
            name: 'react-relay',
          },
          {
            message: `Use 'athena-prisma-client' instead.`,
            name: '@prisma/client',
          },
        ],
      },
    ],
    'import/no-extraneous-dependencies': [
      2,
      {
        devDependencies: [
          './{ares,artemis,deimos,offline}/vite.config.ts',
          './{ares,artemis}/scripts/**/*.{js,cjs,tsx}',
          './ares/ares.tsx',
          './artemis/prisma/seed.tsx',
          './codegen/**',
          './docs/vocs.config.tsx',
          './electron/**',
          './infra/**',
          './scripts/**',
          './tests/**',
          './vitest.config.ts',
          '**/__tests__/**',
        ],
        packageDir: [__dirname].concat(
          existsSync(join(__dirname, './electron')) ? ['./electron'] : [],
          readFileSync('./pnpm-workspace.yaml', 'utf8')
            .split('\n')
            .slice(1)
            .map((n) =>
              join(
                __dirname,
                n
                  .replaceAll(/\s*-\s+/g, '')
                  .replaceAll("'", '')
                  .replaceAll('\r', ''),
              ),
            ),
        ),
      },
    ],
    'import/no-unresolved': [
      2,
      {
        ignore: [String.raw`\?worker`, 'athena-crisis:*', 'glob', 'virtual:*'],
      },
    ],
    'no-extra-parens': 0,
    'no-restricted-globals': [2, 'alert', 'confirm'],
  },
};
