export default {
  create(context) {
    return {
      ImportDeclaration(node) {
        if (node.source.value === 'react') {
          for (const specifier of node.specifiers) {
            if (specifier.imported && specifier.imported.name === 'lazy') {
              context.report({
                message: `Importing 'lazy' from 'react' is forbidden. Use '@deities/ui/lib/lazy.tsx' instead.`,
                node: specifier,
              });
              break;
            }
          }
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
