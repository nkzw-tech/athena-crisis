import { Skill } from '@deities/athena/info/Skill.tsx';
import powerSpawnUnits from '@deities/athena/lib/powerSpawnUnits.tsx';
import { PlayerID } from '@deities/athena/map/Player.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { ActivatePowerActionResponse } from '../ActionResponse.tsx';

export default function getActivatePowerActionResponse(
  map: MapData,
  playerID: PlayerID,
  skill: Skill,
  free: boolean,
): ActivatePowerActionResponse {
  return {
    free: free ? true : undefined,
    skill,
    type: 'ActivatePower',
    units: powerSpawnUnits(map, playerID, skill) || undefined,
  } as const;
}
