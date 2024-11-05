module.exports.meta = {
  fixable: false,
  hasSuggestions: false,
  type: 'problem',
};

module.exports = {
  create(context) {
    const useEffectNames = new Set();
    return {
      CallExpression(node) {
        let name = null;
        if (node.callee.type === 'Identifier') {
          name = node.callee.name;
        } else if (node.callee.type === 'MemberExpression') {
          const object = node.callee.object;
          const property = node.callee.property;

          if (object.type === 'Identifier' && property.type === 'Identifier') {
            name = `${object.name}.${property.name}`;
          }
        }

        if (name && useEffectNames.has(name) && node.arguments.length < 2) {
          context.report({
            message:
              'useEffect must be called with a second argument (dependency array).',
            node,
          });
        }
      },

      ImportDeclaration(node) {
        if (node.source.value === 'react') {
          for (const specifier of node.specifiers) {
            if (
              specifier.type === 'ImportSpecifier' &&
              specifier.imported.name === 'useEffect'
            ) {
              useEffectNames.add(specifier.local.name);
            } else if (specifier.type === 'ImportDefaultSpecifier') {
              useEffectNames.add(`${specifier.local.name}.useEffect`);
            }
          }
        }
      },
    };
  },
};
