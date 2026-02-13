import { MovementTypes } from '../info/MovementType.tsx';
import { Skill } from '../info/Skill.tsx';
import Building from '../map/Building.tsx';
import Vector from '../map/Vector.tsx';
import MapData from '../MapData.tsx';
import getDeployableVectors from './getDeployableVectors.tsx';

export default function getBuildableUnits(map: MapData, building: Building, vector: Vector) {
  const player = map.getPlayer(building.player);
  return [...building.getBuildableUnits(player)].filter(
    (unit) =>
      (player.skills.has(Skill.NoUnitRestrictions) || !map.config.blocklistedUnits.has(unit.id)) &&
      (unit.movementType !== MovementTypes.Rail ||
        getDeployableVectors(map, unit, vector, player.id).length),
  );
}
