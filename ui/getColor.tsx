import { DynamicPlayerID, PlayerID } from '@deities/athena/map/Player.tsx';
import UnknownTypeError from '@nkzw/core/UnknownTypeError.js';
import { applyVar } from './cssVar.tsx';

const varBlack = applyVar('color-black');
const varBlue = applyVar('color-blue');
const varCyan = applyVar('color-cyan');
const varGray = applyVar('color-gray');
const varGreen = applyVar('color-green');
const varNeutral = applyVar('color-neutral');
const varOrange = applyVar('color-orange');
const varPink = applyVar('color-pink');
const varPurple = applyVar('color-purple');
const varRed = applyVar('color-red');

const black = `rgb(${varBlack})`;
const blue = `rgb(${varBlue})`;
const cyan = `rgb(${varCyan})`;
const green = `rgb(${varGreen})`;
const neutral = `rgb(${varNeutral})`;
const gray = `rgb(${varGray})`;
const orange = `rgb(${varOrange})`;
const pink = `rgb(${varPink})`;
const purple = `rgb(${varPurple})`;
const red = `rgb(${varRed})`;

export type Color = 'blue' | 'cyan' | 'green' | 'neutral' | 'orange' | 'pink' | 'purple' | 'red';

export type BaseColor = Color | DynamicPlayerID;

const COLORS = {
  0: neutral,
  1: pink,
  2: orange,
  3: blue,
  4: purple,
  5: green,
  6: red,
  7: cyan,
  blue,
  cyan,
  green,
  neutral,
  opponent: black,
  orange,
  pink,
  purple,
  red,
  self: neutral,
  team: gray,
};

const getColorWithAlpha = (color: BaseColor, alpha: number) => {
  switch (color) {
    case 0:
    case 'neutral':
    case 'self':
      return `rgba(${varNeutral}, ${alpha})`;
    case 1:
    case 'pink':
      return `rgba(${varPink}, ${alpha})`;
    case 2:
    case 'orange':
      return `rgba(${varOrange}, ${alpha})`;
    case 3:
    case 'blue':
      return `rgba(${varBlue}, ${alpha})`;
    case 4:
    case 'purple':
      return `rgba(${varPurple}, ${alpha})`;
    case 5:
    case 'green':
      return `rgba(${varGreen}, ${alpha})`;
    case 6:
    case 'red':
      return `rgba(${varRed}, ${alpha})`;
    case 7:
    case 'cyan':
      return `rgba(${varCyan}, ${alpha})`;
    case 'team':
      return `rgba(${varGray}, ${alpha})`;
    case 'opponent':
      return `rgba(${varBlack}, ${alpha})`;
    default: {
      color satisfies never;
      throw new UnknownTypeError('getColorWithAlpha', color);
    }
  }
};

export function playerToColor(player: PlayerID): Color {
  switch (player) {
    case 0:
      return `neutral`;
    case 1:
      return `pink`;
    case 2:
      return `orange`;
    case 3:
      return `blue`;
    case 4:
      return `purple`;
    case 5:
      return `green`;
    case 6:
      return `red`;
    case 7:
      return `cyan`;
    default: {
      player satisfies never;
      throw new UnknownTypeError('playerToColor', player);
    }
  }
}

export default function getColor(color: BaseColor, alpha?: number): string {
  return alpha == null ? COLORS[color] : getColorWithAlpha(color, alpha);
}
