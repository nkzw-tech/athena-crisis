import { getSkillConfig, Skill } from '@deities/athena/info/Skill.tsx';
import calculateClusters from '@deities/athena/lib/calculateClusters.tsx';
import powerSpawnUnits from '@deities/athena/lib/powerSpawnUnits.tsx';
import { PlayerID } from '@deities/athena/map/Player.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import maxBy from '@deities/hephaestus/maxBy.tsx';
import { ActivatePowerActionResponse } from '../ActionResponse.tsx';

export function getActivatePowerTargetCluster(
  map: MapData,
  playerID: PlayerID,
) {
  return (
    maxBy(
      calculateClusters(map.size, [
        ...map.units
          .filter((unit) => map.isNonNeutralOpponent(playerID, unit))
          .keys(),
      ]),
      (cluster) =>
        cluster.expandStar().reduce((sum, vector) => {
          const unit = map.units.get(vector);
          return (
            sum + (unit && map.isNonNeutralOpponent(playerID, unit) ? 1 : 0)
          );
        }, 0),
    ) || null
  );
}

export default function getActivatePowerActionResponse(
  map: MapData,
  playerID: PlayerID,
  skill: Skill,
  from: Vector | null,
  free: boolean,
): ActivatePowerActionResponse {
  const { requiresTarget } = getSkillConfig(skill);
  return {
    free: free ? true : undefined,
    from:
      (requiresTarget && (!from || !map.contains(from))
        ? getActivatePowerTargetCluster(map, playerID)
        : from) || undefined,
    skill,
    type: 'ActivatePower',
    units: powerSpawnUnits(map, playerID, skill) || undefined,
  } as const;
}
