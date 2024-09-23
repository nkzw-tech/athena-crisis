import sortBy from '@deities/hephaestus/sortBy.tsx';
import { PlayerID, PlayerIDs } from '../map/Player.tsx';
import MapData from '../MapData.tsx';

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

  return sortBy(
    [...active].filter((id) => id > 0),
    (id) => id,
  );
}
