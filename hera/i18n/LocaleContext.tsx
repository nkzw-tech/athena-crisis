/// <reference types="fbtee/ReactTypes.d.ts" />

import { UnitInfo } from '@deities/athena/info/Unit.tsx';
import AvailableLanguages from '@deities/i18n/AvailableLanguages.tsx';
import { Fonts } from '@deities/ui/CSS.tsx';
import Storage from '@deities/ui/Storage.tsx';
import { LocaleContextProps, setupLocaleContext } from 'fbtee';
import {
  createContext,
  ReactNode,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { CharacterMap } from './EntityMap.tsx';
import { injectCharacterNameTranslation } from './injectTranslation.tsx';

const storageKey = 'locale';

export type LocaleContext = {
  locale: string;
  setLocale: (locale: string) => Promise<void>;
  shortLocale: string;
};

export const Context = createContext<LocaleContext>(
  null as unknown as LocaleContext,
);

let currentFonts = ['Athena'];

export function getCurrentFonts() {
  return currentFonts;
}

export default function LocaleContext({
  children,
  fallbackLocale,
  gender,
  hooks,
  loadLocale,
  translations,
}: Omit<
  LocaleContextProps,
  'availableLanguages' | 'clientLocales' | 'loadLocale'
> &
  Readonly<{
    children: ReactNode;
    loadLocale?: LocaleContextProps['loadLocale'];
  }>) {
  const { getLocale, setLocale } = useMemo(
    () =>
      setupLocaleContext({
        availableLanguages: AvailableLanguages,
        clientLocales: [
          Storage.get(storageKey) || '',
          navigator.language,
          ...navigator.languages,
        ],
        fallbackLocale,
        gender,
        hooks,
        loadLocale: loadLocale || (() => Promise.resolve({})),
        translations,
      }),
    [fallbackLocale, gender, hooks, loadLocale, translations],
  );

  const [locale, _setLocale] = useState(getLocale);

  useEffect(() => {
    document.documentElement.lang = locale;

    currentFonts = Fonts[locale as unknown as keyof typeof Fonts] || ['Athena'];

    const listener = () => {
      setLocale(navigator.language);
    };
    window.addEventListener('languagechange', listener);

    return () => {
      window.removeEventListener('languagechange', listener);
    };
  }, [locale, setLocale]);

  return (
    <Context
      value={{
        locale,
        setLocale: useCallback(
          async (locale: string) => {
            Storage.set(storageKey, locale);
            await setLocale(locale);
            injectCharacterNameTranslation(UnitInfo, CharacterMap);
            _setLocale(locale);
          },
          [setLocale],
        ),
        shortLocale: locale.split('_')[0],
      }}
    >
      {children}
    </Context>
  );
}

export function useLocaleContext(): LocaleContext {
  return use(Context);
}
