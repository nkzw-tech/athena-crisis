import noCopyExpression from './no-copy-expression.js';
import noDateNow from './no-date-now.js';
import noInlineCSS from './no-inline-css.js';
import noLazyImport from './no-lazy-import.js';

export default {
  configs: {
    strict: {
      rules: {
        '@deities/no-copy-expression': 2,
        '@deities/no-date-now': 2,
        '@deities/no-inline-css': 2,
        '@deities/no-lazy-import': 2,
      },
    },
  },
  meta: {
    name: '@deities',
  },
  rules: {
    'no-copy-expression': noCopyExpression,
    'no-date-now': noDateNow,
    'no-inline-css': noInlineCSS,
    'no-lazy-import': noLazyImport,
  },
};
