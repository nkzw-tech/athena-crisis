import MapData from '@deities/athena/MapData.tsx';
import { ActionResponse } from '../ActionResponse.tsx';
import applyActionResponse from '../actions/applyActionResponse.tsx';
import { applyEffects, Effects } from '../Effects.tsx';
import { applyObjectives } from '../Objective.tsx';
import { GameState, GameStateWithEffects } from '../Types.tsx';
import getLosingPlayer from './getLosingPlayer.tsx';

export default function applyConditions(
  currentMap: MapData,
  effects: Effects,
  lastActionResponse: ActionResponse,
): [GameState, Effects] {
  let gameState: GameStateWithEffects = [];
  const queue: Array<
    readonly [lastActionResponse: ActionResponse, addToGameState: boolean]
  > = [[lastActionResponse, false]];

  while (queue.length) {
    const previousMap = currentMap;
    const [actionResponse, _addToGameState] = queue.shift()!;
    const currentEffects = gameState.at(-1)?.[2] || effects;
    const activeMap = applyActionResponse(
      previousMap,
      previousMap.createVisionObject(previousMap.currentPlayer),
      actionResponse,
    );
    currentMap = activeMap;

    let addToGameState = _addToGameState;
    // `GameEnd` effects are player-specific and handled in `onGameEnd`.
    let effectGameState =
      actionResponse.type === 'GameEnd'
        ? null
        : applyEffects(previousMap, activeMap, currentEffects, actionResponse);

    // If a `Spawn` effect was issued in response to a player that just lost, revert the player gameover event.
    const lostPlayer = getLosingPlayer(activeMap, actionResponse);
    if (
      lostPlayer &&
      effectGameState?.length &&
      effectGameState.some(
        ([actionResponse]) =>
          actionResponse.type === 'Spawn' &&
          actionResponse.units.some((unit) =>
            previousMap.matchesPlayer(unit, lostPlayer),
          ),
      )
    ) {
      queue.length = 0;
      addToGameState = false;

      // Reapply the same effects on a previous version of the game state in which the player has lost but
      // lose criteria (ie. building ownership) has not been updated yet.
      effectGameState = applyEffects(
        previousMap,
        previousMap,
        currentEffects,
        actionResponse,
      );
    }

    if (addToGameState) {
      gameState = [...gameState, [actionResponse, activeMap, currentEffects]];
    }

    const objectiveState = applyObjectives(
      previousMap,
      activeMap,
      actionResponse,
    );

    if (objectiveState?.length) {
      queue.push(
        ...objectiveState.map(
          ([actionResponse]) => [actionResponse, true] as const,
        ),
      );
      continue;
    }

    if (effectGameState?.length) {
      gameState = [...gameState, ...effectGameState];
      currentMap = effectGameState.at(-1)![1];
    }
  }

  const lastEntry = gameState?.at(-1);
  return lastEntry
    ? [
        gameState.map(([actionResponse, map]) => [actionResponse, map]),
        lastEntry[2],
      ]
    : [[], effects];
}
