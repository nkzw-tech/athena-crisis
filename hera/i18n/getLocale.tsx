import isPresent from '@deities/hephaestus/isPresent.tsx';
import AvailableLanguages from '@deities/i18n/AvailableLanguages.tsx';
import Storage from '@deities/ui/Storage.tsx';
import { TranslationDict } from 'fbt';

type LocaleLoaderFn = (
  locale: string,
) => Promise<{ [hashKey: string]: unknown }>;

const key = 'locale';
const _defaultLanguage = 'en_US';
const availableLocales = new Map<string, string>();
const translations: TranslationDict = { [_defaultLanguage]: {} };

for (const [locale] of AvailableLanguages) {
  availableLocales.set(locale, locale);
  availableLocales.set(locale.split('_')[0], locale);
}

export async function setClientLocale(
  locale: string,
  loadLocale: LocaleLoaderFn,
) {
  if (availableLocales.has(locale)) {
    await maybeLoadLocale(locale, loadLocale);
    Storage.set(key, locale);
    document.documentElement.lang = locale;
    if (locale !== currentLanguage) {
      currentLanguage = null;
    }
  }
}

export function getLocales({
  fallback = _defaultLanguage,
} = {}): ReadonlyArray<string> {
  return Array.from(
    new Set(
      [
        Storage.get(key) || '',
        navigator.language,
        ...navigator.languages,
        fallback,
      ]
        .flatMap((locale: string) => {
          if (!locale) {
            return null;
          }
          const [first = '', second] = locale.split(/-|_/);
          return [
            `${first.toLowerCase()}${second ? `_${second.toUpperCase()}` : ''}`,
            first.toLowerCase(),
          ];
        })
        .filter(isPresent),
    ),
  );
}

window.addEventListener('languagechange', () => {
  currentLanguage = null;
});

let currentLanguage: string | null;

export default function getLocale(defaultLanguage = _defaultLanguage): string {
  if (currentLanguage) {
    return currentLanguage;
  }

  for (const locale of getLocales()) {
    const localeName = availableLocales.get(locale);
    if (localeName) {
      currentLanguage = localeName;
      return localeName;
    }
  }
  currentLanguage = defaultLanguage;
  return defaultLanguage;
}

export function getShortLocale() {
  return getLocale().split('_')[0];
}

export function getTranslationsObject() {
  return translations;
}

export async function maybeLoadLocale(
  locale: string,
  loadLocale: LocaleLoaderFn,
) {
  if (
    availableLocales.has(locale) &&
    !translations[locale] &&
    locale !== _defaultLanguage
  ) {
    translations[locale] = await loadLocale(locale);
  }
}
