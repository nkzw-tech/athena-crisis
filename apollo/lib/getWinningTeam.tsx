import { PlayerID } from '@deities/athena/map/Player.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { GameEndActionResponse } from '../GameOver.tsx';

export default function getWinningTeam(
  map: MapData,
  actionResponse: GameEndActionResponse,
): 'draw' | PlayerID {
  const isDraw = !actionResponse.toPlayer;
  return isDraw
    ? 'draw'
    : map.getTeam(map.getPlayer(actionResponse.toPlayer)).id;
}
