import Player, { PlayerID } from '../map/Player.tsx';
import MapData from '../MapData.tsx';

export default function hasHQ(map: MapData, player: PlayerID | Player) {
  for (const building of map.buildings.values()) {
    if (building.info.isHQ() && map.matchesPlayer(building, player)) {
      return true;
    }
  }

  return false;
}
