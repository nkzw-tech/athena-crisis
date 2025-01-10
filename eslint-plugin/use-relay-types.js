export default {
  create(context) {
    return {
      CallExpression(node) {
        if (
          (node.callee.name === 'useMutation' ||
            node.callee.name === 'usePaginationFragment') &&
          !node.typeArguments
        ) {
          context.report({
            message:
              '`' + node.callee.name + '` calls must have type parameters.',
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
