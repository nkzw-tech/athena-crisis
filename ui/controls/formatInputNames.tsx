import { isLinux, isWindows } from '../Browser.tsx';
import type { EventName } from './Input.tsx';

type ButtonNames = Exclude<
  EventName,
  | 'navigateSecondary'
  | 'accept:released'
  | 'detail:released'
  | 'point'
  | 'reset'
>;

const gamepadNames: Record<ButtonNames, string> = {
  accept: 'A',
  cancel: 'B',
  detail: 'R2',
  'field-info': 'B',
  'gamepad:tertiary': 'Y',
  info: 'L2',
  'keyboard:tertiary': 'Y',
  menu: 'Menu',
  navigate: 'Left Stick',
  next: 'R1',
  previous: 'L1',
  save: '',
  secondary: 'X',
  select: 'Select',
  tertiary: 'Y',
  undo: 'L3',
  zoom: 'R3',
} as const;

export const KeyboardNames: Record<ButtonNames, string> = {
  accept: 'Enter',
  cancel: 'Escape',
  detail: 'E',
  'field-info': 'I',
  'gamepad:tertiary': 'A',
  info: 'Q',
  'keyboard:tertiary': 'A',
  menu: 'M',
  navigate: 'Arrow Keys',
  next: 'Tab',
  previous: 'Shift + Tab',
  save: isWindows || isLinux ? 'CTRL + S' : 'CMD + S',
  secondary: isWindows || isLinux ? 'CTRL + E' : 'CMD + E',
  select: 'P',
  tertiary: 'Shift',
  undo: '',
  zoom: '',
} as const;

export function formatInputNames(text: string, type: 'keyboard' | 'gamepad') {
  const buttons = type === 'gamepad' ? gamepadNames : KeyboardNames;

  return text.replaceAll(/{button\.([\w:-]+)}/g, (_, button: string) => {
    const buttonName = buttons[button as ButtonNames];
    return buttonName ? `"${buttonName}"` : '';
  });
}
