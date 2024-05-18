import type { PlayerID } from '@deities/athena/map/Player.tsx';
import { fbt } from 'fbt';
import type { FactionNames } from '../Types.tsx';
import getTranslatedColorName from './getTranslatedColorName.tsx';

const toFactionName = (player: PlayerID) => {
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
      throw new Error('');
  }
};

export default function getTranslatedFactionName(
  factionNames: FactionNames,
  player: PlayerID,
) {
  const factionName = factionNames.get(player);
  if (factionName) {
    return `${getTranslatedColorName(player)} ${factionName}`;
  }

  return String(
    fbt(
      fbt.enum(toFactionName(player), [
        'Blue Chronos',
        'Cyan Iris',
        'Green Gaia',
        'Neutral',
        'Orange Helios',
        'Pink Atlas',
        'Purple Horizon',
        'Red Ares',
      ]),
      'Enum for faction names',
    ),
  );
}
