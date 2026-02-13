import toFactionName from '@deities/athena/lib/toFactionName.tsx';
import { PlayerID } from '@deities/athena/map/Player.tsx';
import { fbt } from 'fbtee';
import { PlayerDetails } from '../Types.tsx';
import getTranslatedColorName from './getTranslatedColorName.tsx';

export default function getTranslatedFactionName(playerDetails: PlayerDetails, player: PlayerID) {
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
