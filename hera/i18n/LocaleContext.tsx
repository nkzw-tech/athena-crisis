/// <reference types="fbtee/ReactTypes.d.ts" />

import { UnitInfo } from '@deities/athena/info/Unit.tsx';
import AvailableLanguages from '@deities/i18n/AvailableLanguages.tsx';
import { Fonts } from '@deities/ui/CSS.tsx';
import Storage from '@deities/ui/Storage.tsx';
import { LocaleContextProps, setupLocaleContext, TranslationDictionary } from 'fbtee';
import { createContext, Fragment, ReactNode, use, useActionState, useEffect } from 'react';
import { CharacterMap } from './EntityMap.tsx';
import { injectCharacterNameTranslation } from './injectTranslation.tsx';

const storageKey = 'locale';

export type LocaleContext = {
  locale: string;
  localeChangeIsPending: boolean;
  setLocale: (locale: string) => void;
  shortLocale: string;
};

export const Context = createContext<LocaleContext>(null as unknown as LocaleContext);

let currentFonts = ['Athena'];

export function getCurrentFonts() {
  return currentFonts;
}

export async function createLocaleContext(props?: Partial<LocaleContextProps>) {
  const translations: TranslationDictionary = {};
  const { getLocale, setLocale } = setupLocaleContext({
    availableLanguages: AvailableLanguages,
    clientLocales: [Storage.get(storageKey) || '', navigator.language, ...navigator.languages],
    loadLocale: () => Promise.resolve({}),
    translations,
    ...props,
  });

  const locale = getLocale();
  if (locale && locale !== 'en_US' && props?.loadLocale) {
    translations[locale] = await props?.loadLocale(locale);
    injectCharacterNameTranslation(UnitInfo, CharacterMap);
  }

  return function LocaleContext({ children }: { children: ReactNode }) {
    const [locale, _setLocale, localeChangeIsPending] = useActionState(
      async (previousLocale: string, locale: string) => {
        if (locale !== previousLocale) {
          Storage.set(storageKey, locale);
          locale = await setLocale(locale);
          injectCharacterNameTranslation(UnitInfo, CharacterMap);
          return locale;
        }
        return locale;
      },
      getLocale(),
    );

    useEffect(() => {
      document.documentElement.lang = locale;

      currentFonts = Fonts[locale as unknown as keyof typeof Fonts] || ['Athena'];

      const listener = () => _setLocale(navigator.language);
      window.addEventListener('languagechange', listener);

      return () => {
        window.removeEventListener('languagechange', listener);
      };
    }, [locale, _setLocale]);

    return (
      <Context
        value={{
          locale,
          localeChangeIsPending,
          setLocale: _setLocale,
          shortLocale: locale.split('_')[0],
        }}
      >
        <Fragment key={locale}>{children}</Fragment>
      </Context>
    );
  };
}

export default await createLocaleContext();

export function useLocaleContext(): LocaleContext {
  return use(Context);
}
