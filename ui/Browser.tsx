declare global {
  // eslint-disable-next-line no-var
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

export const isIPhone = /iphone/i.test(navigator.userAgent);

export const isIOS =
  !!navigator.userAgent.match(/i(?:pad|phone)/i) ||
  (/(macintosh|macintel|macppc|mac68k|macos)/i.test(navigator.userAgent) &&
    navigator.maxTouchPoints > 0);

export const isAndroid = /android/i.test(navigator.userAgent);

export const isSafari =
  /constructor/i.test(maybeWindow.HTMLElement as unknown as string) ||
  ((pushNotification) =>
    pushNotification.toString() === '[object SafariRemoteNotification]')(
    !maybeWindow['safari'] ||
      (typeof safari !== 'undefined' && maybeWindow['safari'].pushNotification),
  ) ||
  isIOS;

export const isLinux = /Linux/.test(navigator.userAgent);
export const isWindows = /Win(dows|32|64|NT)/.test(navigator.userAgent);

export const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
