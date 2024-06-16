import { PlayerID, PlayerIDs } from '../map/Player.tsx';
import MapData from '../MapData.tsx';

export default function getActivePlayers(map: MapData): PlayerIDs {
  const active = new Set<PlayerID>();

  for (const [, building] of map.buildings) {
    if (building.canBuildUnits(map.getPlayer(building.player))) {
      active.add(building.player);
    }
  }

  for (const [, unit] of map.units) {
    active.add(unit.player);
  }

  return [...active].filter((id) => id > 0).sort((a, b) => a - b);
}
