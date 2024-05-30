import { PlayerID } from '@deities/athena/map/Player.tsx';
import MapData from '@deities/athena/MapData.tsx';
import {
  GameEndActionResponse,
  OptionalConditionActionResponse,
} from '../GameOver.tsx';

export default function getMatchingTeam(
  map: MapData,
  actionResponse: GameEndActionResponse | OptionalConditionActionResponse,
): 'draw' | PlayerID {
  const isDraw = !actionResponse.toPlayer;
  return isDraw
    ? 'draw'
    : map.getTeam(map.getPlayer(actionResponse.toPlayer)).id;
}
