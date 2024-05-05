import { PlayerID } from '@deities/athena/map/Player.tsx';

const NAMES: Record<PlayerID, string> = {
  0: 'Neutral',
  1: 'Pink',
  2: 'Orange',
  3: 'Blue',
  4: 'Purple',
  5: 'Green',
  6: 'Red',
  7: 'Cyan',
};

export default function getColorName(player: PlayerID): string {
  return NAMES[player];
}
