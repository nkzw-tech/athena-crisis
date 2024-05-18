import type MapData from '@deities/athena/MapData.tsx';
import { WinCriteria } from '@deities/athena/WinConditions.tsx';
import isPresent from '@deities/hephaestus/isPresent.tsx';
import applyActionResponse from '../actions/applyActionResponse.tsx';
import type { GameEndActionResponse } from '../GameOver.tsx';
import type { GameState, MutableGameState } from '../Types.tsx';
import getWinningTeam from './getWinningTeam.tsx';

export function processRewards(
  map: MapData,
  gameEndResponse: GameEndActionResponse,
): [GameState, MapData] {
  const gameState: MutableGameState = [];
  const winningTeam = getWinningTeam(map, gameEndResponse);
  if (winningTeam !== 'draw') {
    const rewards = new Set(
      [
        'condition' in gameEndResponse
          ? gameEndResponse.condition?.reward
          : null,
        map.config.winConditions.find(
          (condition) => condition.type === WinCriteria.Default,
        )?.reward,
      ].filter(isPresent),
    );

    if (rewards.size) {
      for (const reward of rewards) {
        for (const [, player] of map.getTeam(winningTeam).players) {
          if (!player.skills.has(reward.skill)) {
            const rewardActionResponse = {
              player: player.id,
              reward,
              type: 'ReceiveReward',
            } as const;
            map = applyActionResponse(
              map,
              map.createVisionObject(player),
              rewardActionResponse,
            );
            gameState.push([rewardActionResponse, map]);
          }
        }
      }
    }
  }
  return [gameState, map];
}
