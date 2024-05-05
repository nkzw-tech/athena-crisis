module.exports = {
  configs: {
    strict: {
      rules: {
        '@deities/no-copy-expression': 2,
        '@deities/no-date-now': 2,
        '@deities/no-fbt-import': 2,
        '@deities/no-inline-css': 2,
        '@deities/no-lazy-import': 2,
        '@deities/require-fbt-description': 2,
        '@deities/use-mutation-types': 2,
      },
    },
  },
  rules: {
    'no-copy-expression': require('./no-copy-expression'),
    'no-date-now': require('./no-date-now'),
    'no-fbt-import': require('./no-fbt-import'),
    'no-inline-css': require('./no-inline-css'),
    'no-lazy-import': require('./no-lazy-import'),
    'require-fbt-description': require('./require-fbt-description'),
    'use-mutation-types': require('./use-mutation-types'),
  },
};
