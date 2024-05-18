import type { PlayerIDs } from '../map/Player.tsx';
import type MapData from '../MapData.tsx';

export default function getActivePlayers(map: MapData): PlayerIDs {
  return [
    ...new Set([
      ...map.buildings
        .filter((building) =>
          building.canBuildUnits(map.getPlayer(building.player)),
        )
        .map(({ player }) => player)
        .values(),
      ...map.units.map(({ player }) => player).values(),
    ]),
  ]
    .filter((id) => id > 0)
    .sort((a, b) => a - b);
}
