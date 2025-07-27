const AvailableLanguages = new Map([
  ['en_US', 'English'],
  ['de_DE', 'Deutsch (German)'],
  ['es_ES', 'Español (Spanish)'],
  ['fr_FR', 'Français (French)'],
  ['it_IT', 'Italiano (Italian)'],
  ['ja_JP', '日本語 (Japanese)'],
  ['ko_KR', '한국어 (Korean)'],
  ['pl_PL', 'Polski (Polish)'],
  ['pt_BR', 'Português (Brazilian Portuguese)'],
  ['ru_RU', 'Русский (Russian)'],
  ['zh_CN', '简体中文 (Simplified Chinese)'],
  ['uk_UA', 'Українська (Ukrainian)'],
] as const);

export type AvailableLanguage =
  typeof AvailableLanguages extends Map<infer K, unknown> ? K : never;

export default AvailableLanguages;
