// @ts-nocheck
export default {
  create(context) {
    return {
      CallExpression(node) {
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.object.name === 'Date' &&
          node.callee.property.name === 'now'
        ) {
          context.report({
            fix(fixer) {
              return fixer.replaceText(node, 'dateNow()');
            },
            message: `Use 'dateNow()' instead of 'Date.now()'.`,
            node,
          });
        }
      },
    };
  },
  meta: {
    fixable: 'code',
  },
};
