import { PlayerID } from '../map/Player.tsx';

const NAMES = {
  0: 'Neutral',
  1: 'Pink',
  2: 'Orange',
  3: 'Blue',
  4: 'Purple',
  5: 'Green',
  6: 'Red',
  7: 'Cyan',
} as const;

export default function getColorName(player: PlayerID): string {
  return NAMES[player];
}
