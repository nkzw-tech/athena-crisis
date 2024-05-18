import { Skill } from '../info/Skill.tsx';
import type { UnitInfo } from '../info/Unit.tsx';
import type { PlayerID } from '../map/Player.tsx';
import type Vector from '../map/Vector.tsx';
import type MapData from '../MapData.tsx';
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
