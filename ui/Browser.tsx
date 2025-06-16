import parseInteger from '@nkzw/core/parseInteger.js';

declare global {
  var safari: Record<string, { toString: () => string }>;
}

const maybeWindow =
  typeof window === 'undefined'
    ? {
        HTMLElement: false,
        navigator: { maxTouchPoints: 0, userAgent: '' },
        safari: null,
      }
    : window;

const navigator = maybeWindow.navigator;
const { userAgent } = navigator;

export const isIPhone = /iphone/i.test(userAgent);

export const isIOS =
  !!userAgent.match(/i(?:pad|phone)/i) ||
  (/(macintosh|macintel|macppc|mac68k|macos)/i.test(userAgent) &&
    navigator.maxTouchPoints > 0);

export const isAndroid = /android/i.test(userAgent);

export const isSafari =
  /constructor/i.test(maybeWindow.HTMLElement as unknown as string) ||
  ((pushNotification) =>
    pushNotification.toString() === '[object SafariRemoteNotification]')(
    !maybeWindow['safari'] ||
      (typeof safari !== 'undefined' && maybeWindow['safari'].pushNotification),
  ) ||
  isIOS;

export const isChrome = /Chrome/.test(userAgent);
export const ChromeVersion =
  (isChrome && parseInteger(userAgent.match(/Chrome\/(\d+)/)?.[1] || '')) || 0;

export const isLinux = /Linux/.test(userAgent);
export const isWindows = /Win(dows|32|64|NT)/.test(userAgent);

export const isFirefox = userAgent.toLowerCase().includes('firefox');
