import { PlayerID } from '@deities/athena/map/Player.tsx';
import { fbt } from 'fbt';
import { FactionNames } from '../Types.tsx';
import getTranslatedFactionName from './getTranslatedFactionName.tsx';

export default function getPlayerDefeatedMessage(
  factionNames: FactionNames,
  player: PlayerID,
) {
  return String(
    fbt(
      fbt.param('color', getTranslatedFactionName(factionNames, player)) +
        ' was defeated!',
      'Player was defeated',
    ),
  );
}
