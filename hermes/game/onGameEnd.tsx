import applyActionResponse from '@deities/apollo/actions/applyActionResponse.tsx';
import { applyEffects, Effects } from '@deities/apollo/Effects.tsx';
import { GameState, MutableGameState } from '@deities/apollo/Types.tsx';
import { PlayerID } from '@deities/athena/map/Player.tsx';
import Vision from '@deities/athena/Vision.tsx';

export default function onGameEnd(
  gameState: GameState,
  effects: Effects,
  viewerId: PlayerID,
): GameState {
  const [lastAction, activeMap] = gameState.at(-1) || [];
  if (activeMap && lastAction?.type === 'GameEnd') {
    // Set the current player to the `viewerId` which is used to evaluate conditions.
    const map = activeMap.copy({
      currentPlayer: viewerId,
    });
    const { condition } = lastAction;
    const secretCondition = condition?.hidden ? condition : null;

    const secretState = secretCondition
      ? [
          [
            { condition: secretCondition, type: 'SecretDiscovered' },
            activeMap,
          ] as const,
        ]
      : null;

    const effectGameState =
      applyEffects(map, map, effects, lastAction) ||
      applyEffects(map, map, effects, {
        ...lastAction,
        condition: undefined,
        conditionId: undefined,
      });

    const lastMap = effectGameState?.at(-1)?.[1];
    if (lastMap) {
      const adjustedGameState = [
        [{ type: 'SetViewer' }, lastMap] as const,
        ...(secretState || []),
        ...effectGameState.map(
          ([actionResponse, map]) => [actionResponse, map] as const,
        ),
      ];
      const newGameState: MutableGameState = [];
      const subsetGameState = gameState.slice(0, -1);
      let hasInserted = false;
      if (subsetGameState.length) {
        for (let i = 0; i < subsetGameState.length; i++) {
          const next = subsetGameState[i + 1];
          if (!hasInserted && (!next || next[0].type === 'ReceiveReward')) {
            if (!next) {
              newGameState.push(subsetGameState[i]);
            }

            hasInserted = true;
            newGameState.push(...adjustedGameState);

            if (!next) {
              continue;
            }
          }
          newGameState.push(subsetGameState[i]);
        }
      } else {
        newGameState.push(...adjustedGameState);
      }

      return [
        ...newGameState,
        [
          lastAction,
          applyActionResponse(
            lastMap,
            new Vision(lastMap.currentPlayer),
            lastAction,
          ),
        ],
      ];
    }

    return secretState
      ? [...gameState.slice(0, -1), ...secretState, gameState.at(-1)!]
      : gameState;
  }

  return gameState;
}
