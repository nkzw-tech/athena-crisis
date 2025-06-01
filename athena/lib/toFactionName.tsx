import UnknownTypeError from '@nkzw/core/UnknownTypeError.js';
import { PlayerID } from '../map/Player.tsx';

export default function toFactionName(player: PlayerID) {
  switch (player) {
    case 0:
      return 'Neutral';
    case 1:
      return 'Pink Atlas';
    case 2:
      return 'Orange Helios';
    case 3:
      return 'Blue Chronos';
    case 4:
      return 'Purple Horizon';
    case 5:
      return 'Green Gaia';
    case 6:
      return 'Red Ares';
    case 7:
      return 'Cyan Iris';
    default:
      player satisfies never;
      throw new UnknownTypeError('toFactionName', player);
  }
}
