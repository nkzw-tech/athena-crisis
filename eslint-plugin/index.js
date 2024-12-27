module.exports = {
  configs: {
    strict: {
      rules: {
        '@deities/no-copy-expression': 2,
        '@deities/no-date-now': 2,
        '@deities/no-inline-css': 2,
        '@deities/no-lazy-import': 2,
        '@deities/require-use-effect-arguments': 2,
        '@deities/use-relay-types': 2,
      },
    },
  },
  rules: {
    'no-copy-expression': require('./no-copy-expression'),
    'no-date-now': require('./no-date-now'),
    'no-inline-css': require('./no-inline-css'),
    'no-lazy-import': require('./no-lazy-import'),
    'require-use-effect-arguments': require('./require-use-effect-arguments'),
    'use-relay-types': require('./use-relay-types'),
  },
};
