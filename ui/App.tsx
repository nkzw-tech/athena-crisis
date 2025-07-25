import { Route } from '@deities/apollo/Routes.tsx';
import {
  FloatingGamepadTextInputMode,
  GamepadTextInputLineMode,
  GamepadTextInputMode,
} from './controls/GamepadTextInput.tsx';
import captureException from './lib/captureException.tsx';

export type NativeApp = Readonly<{
  canToggleFullScreen: () => boolean;
  copyToClipboard: (text: string) => void;
  downloadURL: (url: string) => void;
  getInitialURL: () => string | null;
  getSteamAuthenticationTicket: () => Promise<string | null>;
  getSteamUserId: () => string;
  getSteamUserName: () => string;
  isFullscreen: () => boolean;
  isSteam: () => boolean;
  isSteamDeck: () => boolean;
  quit: () => void;
  reload: () => void;
  showFloatingGamepadTextInput: (
    keyboardMode: FloatingGamepadTextInputMode,
    x: number,
    y: number,
    width: number,
    height: number,
  ) => Promise<boolean>;
  showGamepadTextInput: (
    inputMode: GamepadTextInputMode,
    inputLineMode: GamepadTextInputLineMode,
    description: string,
    maxCharacters: number,
    existingText?: string | undefined | null,
  ) => Promise<boolean>;
  toggleFullscreen: () => void;
}>;

type Navigate = (url: Route) => void;

type App = Omit<NativeApp, 'copyToClipboard'> &
  Readonly<{
    canQuit: boolean;
    getCurrentAppVersion: () => string | null;
    getLatestAppVersion: () => string;
    setNavigationHandler: (_navigate: Navigate) => void;
    writeToClipboard: (text: string | (() => Promise<string>)) => void;
  }>;

export type InitializeData = Readonly<{
  canToggleFullScreen: boolean;
  initialURL: string | null;
  isFullscreen: boolean;
  isSteam: boolean;
  isSteamDeck: boolean;
  steamUserId: string;
  steamUserName: string;
}>;

export type RemoteCallMessage = Readonly<{
  pushState: Readonly<{ url: string }>;
}>;

export type RemoteCallMessageName = keyof RemoteCallMessage;

type RemoteCallInterface = Readonly<{
  message: <T extends RemoteCallMessageName>(
    name: T,
    data: RemoteCallMessage[T],
  ) => void;
}>;

declare global {
  var $__AC__: Partial<NativeApp>;
  var $__AC__R: RemoteCallInterface;
}

let navigate = (url: Route) => {};
const app = typeof $__AC__ !== 'undefined' ? window.$__AC__ : null;
const emptyFunction = () => {};
const emptyFalseFunction = () => Promise.resolve(false);

window.$__AC__R = {
  message: <T extends RemoteCallMessageName>(
    name: T,
    data: RemoteCallMessage[T],
  ) => {
    switch (name) {
      case 'pushState':
        if (data.url) {
          try {
            const route = new URL(data.url).pathname as Route;
            navigate?.(route);
          } catch (error) {
            captureException(
              new Error(`Remote 'pushState' call: Invalid URL: ${data.url}`, {
                cause: error,
              }),
            );
          }
        }
        break;
      default:
        break;
    }
  },
};

export const App: App = {
  canQuit: !!app,
  canToggleFullScreen: app?.canToggleFullScreen || (() => false),
  downloadURL: app?.downloadURL || ((url: string) => window.open(url)),
  getCurrentAppVersion: () =>
    navigator.userAgent.match(/AthenaCrisis\/([\w.-]+)/)?.[1] || null,
  getInitialURL: app?.getInitialURL || (() => null),
  getLatestAppVersion: () => process.env.NATIVE_APP_VERSION || '',
  getSteamAuthenticationTicket:
    app?.getSteamAuthenticationTicket || (() => Promise.resolve(null)),
  getSteamUserId: app?.getSteamUserId || (() => ''),
  getSteamUserName: app?.getSteamUserName || (() => ''),
  isFullscreen:
    app?.isFullscreen ||
    (() => {
      // In some browsers or Electron `fullscreenElement` might be null but report itself as typeof `object`.
      // By checking for a property on the fullscreen Element, we can reliably verify if the app is fullscreen.
      return !!document.fullscreenElement?.nodeName;
    }),
  isSteam: app?.isSteam || (() => false),
  isSteamDeck: app?.isSteamDeck || (() => false),
  quit: app?.quit ?? emptyFunction,
  reload: app?.reload ?? (() => location.reload()),
  setNavigationHandler: (_navigate: Navigate) => {
    navigate = _navigate;
    const initialURL = App.getInitialURL();
    if (initialURL) {
      navigate(initialURL.replace('https://app.athenacrisis.com', '') as Route);
    }
  },
  showFloatingGamepadTextInput:
    app?.showFloatingGamepadTextInput ?? emptyFalseFunction,
  showGamepadTextInput: app?.showGamepadTextInput ?? emptyFalseFunction,
  toggleFullscreen:
    app?.toggleFullscreen ||
    (() => {
      if (App.isFullscreen()) {
        document.exitFullscreen();
      } else {
        document.documentElement.requestFullscreen();
      }
    }),
  writeToClipboard: (text: string | (() => Promise<string>)) => {
    const promise = typeof text === 'string' ? Promise.resolve(text) : text();
    if (app?.copyToClipboard) {
      promise.then(app.copyToClipboard);
      return;
    }

    try {
      navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': promise.then(
            (text) => new Blob([text], { type: 'text/plain' }),
          ),
        }),
      ]);
    } catch {
      /* empty */
    }
  },
};
