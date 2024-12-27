import { PlayerID } from '@deities/athena/map/Player.tsx';
import UnknownTypeError from '@deities/hephaestus/UnknownTypeError.tsx';
import { fbt } from 'fbtee';
import { PlayerDetails } from '../Types.tsx';
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
      throw new UnknownTypeError('toFactionName', player);
  }
};

export default function getTranslatedFactionName(
  playerDetails: PlayerDetails,
  player: PlayerID,
) {
  const factionName = playerDetails.get(player)?.factionName;
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
