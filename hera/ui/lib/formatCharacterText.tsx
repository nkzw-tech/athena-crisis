import type { UnitInfo } from '@deities/athena/info/Unit.tsx';
import formatText from '@deities/athena/lib/formatText.tsx';
import type { PlayerID } from '@deities/athena/map/Player.tsx';
import {
  isDynamicPlayerID,
  resolveDynamicPlayerID,
} from '@deities/athena/map/Player.tsx';
import type MapData from '@deities/athena/MapData.tsx';
import parseInteger from '@deities/hephaestus/parseInteger.tsx';
import getTranslatedFactionName from '../../lib/getTranslatedFactionName.tsx';
import type { FactionNames } from '../../Types.tsx';

export default function formatCharacterText(
  text: string,
  unit: UnitInfo,
  name: 'name' | 'characterName',
  map: MapData,
  userDisplayName: string,
  player: PlayerID,
  factionNames: FactionNames,
) {
  return formatText(text, unit, name, [['user', userDisplayName]])
    .replaceAll(/{faction(?:\.(\w+))?}/g, (_, id: string) => {
      const dynamicPlayerID = id
        ? isDynamicPlayerID(id)
          ? id
          : (parseInteger(id) as PlayerID | null)
        : null;
      const playerID =
        dynamicPlayerID && resolveDynamicPlayerID(map, dynamicPlayerID, player);
      return (
        getTranslatedFactionName(
          factionNames,
          playerID != null ? playerID : player,
        ) || ''
      );
    })
    .trim();
}
