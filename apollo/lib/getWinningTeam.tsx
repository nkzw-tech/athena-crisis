import type { PlayerID } from '@deities/athena/map/Player.tsx';
import type MapData from '@deities/athena/MapData.tsx';
import type { GameEndActionResponse } from '../GameOver.tsx';

export default function getWinningTeam(
  map: MapData,
  actionResponse: GameEndActionResponse,
): 'draw' | PlayerID {
  const isDraw = !actionResponse.toPlayer;
  return isDraw
    ? 'draw'
    : map.getTeam(map.getPlayer(actionResponse.toPlayer)).id;
}
