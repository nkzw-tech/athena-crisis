import Team from '@deities/athena/map/Team.tsx';
import MapData from '@deities/athena/MapData.tsx';
import {
  GameEndActionResponse,
  OptionalObjectiveActionResponse,
} from '../Objective.tsx';

export default function getMatchingTeam(
  map: MapData,
  actionResponse: GameEndActionResponse | OptionalObjectiveActionResponse,
): Team | null {
  return actionResponse.toPlayer ? map.getTeam(actionResponse.toPlayer) : null;
}
