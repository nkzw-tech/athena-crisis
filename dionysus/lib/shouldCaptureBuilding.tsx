import Building from '@deities/athena/map/Building.tsx';
import { PlayerID } from '@deities/athena/map/Player.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';

export default function shouldCaptureBuilding(
  map: MapData,
  player: PlayerID,
  building: Building | undefined,
  vector: Vector,
): building is Building {
  if (
    building &&
    !building.info.isStructure() &&
    map.isOpponent(player, building)
  ) {
    const maybeUnit = map.units.get(vector);
    return (
      !maybeUnit ||
      (!map.matchesPlayer(maybeUnit, building) &&
        !maybeUnit.canCapture(map.getPlayer(maybeUnit)))
    );
  }

  return false;
}
