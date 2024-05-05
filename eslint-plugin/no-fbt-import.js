module.exports.meta = {
  fixable: false,
  hasSuggestions: false,
  type: 'problem',
};

module.exports.create = function noFbtImport(context) {
  return {
    ImportDefaultSpecifier(node) {
      if (
        node.local.type === 'Identifier' &&
        node.local.name === 'fbt' &&
        node.parent.source.type === 'Literal' &&
        node.parent.source.value === 'fbt'
      ) {
        context.report({
          message: `You must use "import { fbt } from 'fbt'"; instead of a default import.`,
          node,
        });
      }
    },
  };
};
