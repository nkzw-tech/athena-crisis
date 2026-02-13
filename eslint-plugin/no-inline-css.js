export default {
  create(context) {
    return {
      TaggedTemplateExpression(node) {
        const parent = node.parent;
        const nodeToCheck =
          (parent?.type === 'ArrowFunctionExpression' && parent.body === node) ||
          (parent?.parent?.parent?.type === 'ExportNamedDeclaration' && parent.init === node)
            ? parent
            : parent.type === 'Property' &&
                parent.value === node &&
                parent.parent?.type === 'ObjectExpression'
              ? parent.parent
              : node;

        if (
          node.tag.type === 'Identifier' &&
          node.tag.name === 'css' &&
          nodeToCheck.parent?.parent?.type !== 'Program' &&
          nodeToCheck.parent?.parent?.parent?.type !== 'Program'
        ) {
          context.report({
            message: '`css` template literals can only be used at the module top-level.',
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
