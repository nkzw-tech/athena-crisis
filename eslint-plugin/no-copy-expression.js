export default {
  create(context) {
    return {
      CallExpression(node) {
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.property.type === 'Identifier' &&
          node.callee.property.name === 'copy' &&
          node.parent.type === 'ExpressionStatement'
        ) {
          context.report({
            message: `'copy' calls are side-effect free. Did you forgot to assign the result of this call?`,
            node,
          });
        }
      },
    };
  },
  meta: {
    fixable: false,
    hasSuggestions: false,
    type: 'problem',
  },
};
