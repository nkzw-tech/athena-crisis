import { UnitInfo } from '@deities/athena/info/Unit.tsx';
import formatText from '@deities/athena/lib/formatText.tsx';
import {
  isDynamicPlayerID,
  PlayerID,
  resolveDynamicPlayerID,
} from '@deities/athena/map/Player.tsx';
import MapData from '@deities/athena/MapData.tsx';
import parseInteger from '@deities/hephaestus/parseInteger.tsx';
import { formatInputNames } from '@deities/ui/controls/formatInputNames.tsx';
import { getGamepadType } from '@deities/ui/controls/setupGamePad.tsx';
import { fbt, list } from 'fbtee';
import getTranslatedFactionName from '../../lib/getTranslatedFactionName.tsx';
import getUserDisplayName from '../../lib/getUserDisplayName.tsx';
import { PlayerDetails } from '../../Types.tsx';

export default function formatCharacterText(
  text: string,
  unit: UnitInfo,
  name: 'name' | 'characterName',
  map: MapData,
  player: PlayerID,
  playerDetails: PlayerDetails,
) {
  return formatInputNames(
    formatText(text, unit, name, [
      ['user', getUserDisplayName(playerDetails, player)],
      [
        'opponents',
        String(
          list(
            [...playerDetails]
              .filter(
                ([playerID]) =>
                  map.active.includes(playerID) &&
                  map.isOpponent(playerID, player),
              )
              .map(([playerID]) => getUserDisplayName(playerDetails, playerID)),
          ),
        ) ||
          fbt(
            'Players',
            'If there are no human opponents, this falls back to replace {users} with "Players" in a character message.',
          ),
      ],
    ]).replaceAll(/{faction(?:\.(\w+))?}/g, (_, id: string) => {
      const dynamicPlayerID = id
        ? isDynamicPlayerID(id)
          ? id
          : (parseInteger(id) as PlayerID | null)
        : null;
      const playerID =
        dynamicPlayerID && resolveDynamicPlayerID(map, dynamicPlayerID, player);
      return (
        getTranslatedFactionName(
          playerDetails,
          playerID != null ? playerID : player,
        ) || ''
      );
    }),
    getGamepadType() || 'keyboard',
  ).trim();
}
