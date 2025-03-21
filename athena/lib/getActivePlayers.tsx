import sortBy from '@nkzw/core/sortBy.js';
import { PlayerID, PlayerIDs } from '../map/Player.tsx';
import MapData from '../MapData.tsx';
import reorderActive from './reorderActive.tsx';

export default function getActivePlayers(
  map: MapData,
  initialActive?: ReadonlyArray<PlayerID>,
): PlayerIDs {
  const active = new Set<PlayerID>(initialActive);

  for (const [, building] of map.buildings) {
    if (building.canBuildUnits(map.getPlayer(building.player))) {
      active.add(building.player);
    }
  }

  for (const [, unit] of map.units) {
    active.add(unit.player);
  }

  return reorderActive(
    sortBy(
      [...active].filter((id) => id > 0),
      (id) => id,
    ),
    map.active[0],
  );
}
