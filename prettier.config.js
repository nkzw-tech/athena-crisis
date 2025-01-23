export default {
  importOrderParserPlugins: ['importAssertions', 'typescript', 'jsx'],
  plugins: [
    '@ianvs/prettier-plugin-sort-imports',
    'prettier-plugin-packagejson',
  ],
  singleQuote: true,
};
