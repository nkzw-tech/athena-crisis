import MapData from '@deities/athena/MapData.tsx';
import { WinCriteria } from '@deities/athena/WinConditions.tsx';
import isPresent from '@deities/hephaestus/isPresent.tsx';
import applyActionResponse from '../actions/applyActionResponse.tsx';
import {
  GameEndActionResponse,
  OptionalWinActionResponse,
} from '../GameOver.tsx';
import { GameState, MutableGameState } from '../Types.tsx';
import getWinningTeam from './getWinningTeam.tsx';

export function processRewards(
  map: MapData,
  actionResponse: GameEndActionResponse | OptionalWinActionResponse,
): [GameState, MapData] {
  const gameState: MutableGameState = [];
  const winningTeam = getWinningTeam(map, actionResponse);
  if (winningTeam !== 'draw') {
    const rewards = new Set(
      [
        'condition' in actionResponse ? actionResponse.condition?.reward : null,
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
