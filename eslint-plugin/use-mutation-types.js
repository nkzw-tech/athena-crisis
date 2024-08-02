module.exports.meta = {
  fixable: false,
  hasSuggestions: false,
  type: 'problem',
};

module.exports.create = function requireUseMutationType(context) {
  return {
    CallExpression(node) {
      if (node.callee.name === 'useMutation' && !node.typeArguments) {
        context.report({
          message: '`useMutation` calls must have type parameters.',
          node,
        });
      }
    },
  };
};
