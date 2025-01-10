import noCopyExpression from './no-copy-expression.js';
import noDateNow from './no-date-now.js';
import noInlineCSS from './no-inline-css.js';
import noLazyImport from './no-lazy-import.js';
import requireUseEffectArguments from './require-use-effect-arguments.js';
import useRelayTypes from './use-relay-types.js';

export default {
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
  meta: {
    name: '@deities',
  },
  rules: {
    'no-copy-expression': noCopyExpression,
    'no-date-now': noDateNow,
    'no-inline-css': noInlineCSS,
    'no-lazy-import': noLazyImport,
    'require-use-effect-arguments': requireUseEffectArguments,
    'use-relay-types': useRelayTypes,
  },
};
