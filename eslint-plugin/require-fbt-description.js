module.exports.meta = {
  fixable: false,
  hasSuggestions: false,
  type: 'problem',
};

module.exports.create = function noInlineCSS(context) {
  return {
    JSXOpeningElement(node) {
      if (node.name?.type === 'JSXIdentifier' && node.name.name === 'fbt') {
        const descriptionNode = node.attributes.find(
          (node) =>
            node.name?.type === 'JSXIdentifier' && node.name.name === 'desc',
        );
        if (
          !descriptionNode ||
          (descriptionNode.type === 'JSXAttribute' &&
            (!descriptionNode.value ||
              descriptionNode.value.type !== 'Literal' ||
              !descriptionNode.value.value.length))
        ) {
          context.report({
            message: '`fbt` elements must have a string description.',
            node: descriptionNode,
          });
        }
      }
    },
  };
};
