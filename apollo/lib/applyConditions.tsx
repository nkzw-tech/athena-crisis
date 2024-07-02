import { PlayerID } from '@deities/athena/map/Player.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { ActionResponse } from '../ActionResponse.tsx';
import { applyEffects, Effects } from '../Effects.tsx';
import { applyObjectives } from '../Objective.tsx';
import { GameState, GameStateWithEffects } from '../Types.tsx';

const getLosingPlayer = (gameState: GameState): PlayerID | null => {
  for (const [actionResponse, map] of gameState) {
    switch (actionResponse.type) {
      case 'AttackUnitGameOver':
      case 'CaptureGameOver':
        return actionResponse.fromPlayer;
      case 'BeginTurnGameOver':
        return map.currentPlayer;
    }
  }
  return null;
};

export default function applyConditions(
  previousMap: MapData,
  activeMap: MapData,
  effects: Effects,
  lastActionResponse: ActionResponse,
): [GameState, Effects] {
  let gameState: GameStateWithEffects = [];
  const queue: Array<
    [
      previousMap: MapData,
      activeMap: MapData,
      lastActionResponse: ActionResponse,
      addToGameState: boolean,
    ]
  > = [[previousMap, activeMap, lastActionResponse, false]];

  while (queue.length) {
    const [previousMap, activeMap, lastActionResponse, _addToGameState] =
      queue.shift()!;
    const currentEffects = gameState.at(-1)?.[2] || effects;
    let addToGameState = _addToGameState;

    // `GameEnd` effects are player-specific and handled in `onGameEnd`.
    let effectGameState =
      lastActionResponse.type === 'GameEnd'
        ? null
        : applyEffects(
            previousMap,
            activeMap,
            currentEffects,
            lastActionResponse,
          );

    // If a `Spawn` effect was issued in response to a player that just lost, revert the player gameover event.
    const lostPlayer = getLosingPlayer([[lastActionResponse, activeMap]]);
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
        lastActionResponse,
      );
    }

    if (addToGameState) {
      gameState = [
        ...gameState,
        [lastActionResponse, activeMap, currentEffects],
      ];
    }

    const objectiveState = applyObjectives(
      previousMap,
      activeMap,
      lastActionResponse,
    );

    if (objectiveState?.length) {
      let currentMap = activeMap;
      for (const [actionResponse, currentActiveMap] of objectiveState) {
        queue.push([currentMap, currentActiveMap, actionResponse, true]);
        currentMap = currentActiveMap;
      }
      continue;
    }

    if (effectGameState?.length) {
      gameState = [...gameState, ...effectGameState];
    }
  }

  const lastEntry = gameState?.at(-1);
  return lastEntry
    ? [
        gameState.map(
          ([actionResponse, map]) => [actionResponse, map] as const,
        ),
        lastEntry[2],
      ]
    : [[], effects];
}
