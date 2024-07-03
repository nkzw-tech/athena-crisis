import MapData from '@deities/athena/MapData.tsx';
import { Criteria } from '@deities/athena/Objectives.tsx';
import isPresent from '@deities/hephaestus/isPresent.tsx';
import applyActionResponse from '../actions/applyActionResponse.tsx';
import {
  GameEndActionResponse,
  OptionalObjectiveActionResponse,
} from '../Objective.tsx';
import { GameState, MutableGameState } from '../Types.tsx';
import getMatchingTeam from './getMatchingTeam.tsx';

export function processRewards(
  map: MapData,
  actionResponse: GameEndActionResponse | OptionalObjectiveActionResponse,
): [GameState, MapData] {
  const gameState: MutableGameState = [];
  const team = getMatchingTeam(map, actionResponse);
  if (team) {
    const rewards = new Set(
      [
        actionResponse.objective?.reward,
        actionResponse.type === 'GameEnd'
          ? map.config.objectives.find(
              (objective) => objective.type === Criteria.Default,
            )?.reward
          : null,
      ].filter(isPresent),
    );

    if (rewards.size) {
      for (const reward of rewards) {
        for (const [, player] of team.players) {
          if (reward.type !== 'Skill' || !player.skills.has(reward.skill)) {
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
