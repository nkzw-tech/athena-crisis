import { PlayerID } from '@deities/athena/map/Player.tsx';
import MapData from '@deities/athena/MapData.tsx';
import {
  GameEndActionResponse,
  OptionalObjectiveActionResponse,
} from '../Objective.tsx';

export default function getMatchingTeam(
  map: MapData,
  actionResponse: GameEndActionResponse | OptionalObjectiveActionResponse,
): null | PlayerID {
  return actionResponse.toPlayer
    ? map.getTeam(actionResponse.toPlayer).id
    : null;
}
