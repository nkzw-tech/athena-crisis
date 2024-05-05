import { Skill } from '../info/Skill.tsx';
import { UnitInfo } from '../info/Unit.tsx';
import { PlayerID } from '../map/Player.tsx';
import Vector from '../map/Vector.tsx';
import MapData from '../MapData.tsx';
import canDeploy from './canDeploy.tsx';

export default function getDeployableVectors(
  map: MapData,
  unit: UnitInfo,
  vector: Vector,
  player: PlayerID,
) {
  return vector
    .expand()
    .filter((vector) =>
      canDeploy(
        map,
        unit,
        vector,
        map.getPlayer(player).skills.has(Skill.NoUnitRestrictions),
      ),
    );
}
