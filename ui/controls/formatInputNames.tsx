import { isLinux, isWindows } from '../Browser.tsx';
import type { EventName } from './Input.tsx';

const gamepadNames: Record<EventName, string> = {
  accept: 'A',
  cancel: 'B',
  detail: '',
  'detail:released': '',
  'field-info': 'B',
  'gamepad:tertiary': '',
  info: 'L2',
  'keyboard:tertiary': 'XX',
  menu: '',
  navigate: '',
  navigateSecondary: '',
  next: '',
  point: '',
  previous: '',
  reset: '',
  save: '',
  secondary: 'X',
  select: '',
  tertiary: 'Y',
  undo: '',
  zoom: '',
} as const;

const keyboardNames: Record<EventName, string> = {
  accept: 'Enter',
  cancel: 'Escape',
  detail: '',
  'detail:released': '',
  'field-info': 'I',
  'gamepad:tertiary': '',
  info: 'Q',
  'keyboard:tertiary': '',
  menu: '',
  navigate: '',
  navigateSecondary: '',
  next: '',
  point: '',
  previous: '',
  reset: '',
  save: '',
  secondary: isWindows || isLinux ? 'ctrl+e' : 'cmd+e',
  select: '',
  tertiary: 'Shift',
  undo: '',
  zoom: '',
} as const;

export function formatInputNames(text: string, type: 'keyboard' | 'gamepad') {
  const buttons = type === 'gamepad' ? gamepadNames : keyboardNames;

  return text.replaceAll(/{button\.([\w:-]+)}/g, (_, button: string) => {
    const buttonName = buttons[button as EventName];
    return buttonName ? `"${buttonName}"` : '';
  });
}
