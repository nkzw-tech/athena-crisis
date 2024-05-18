import type { PlayerIDSet } from '@deities/athena/map/Player.tsx';
import type { GameState } from '../Types.tsx';
import dropLabelsFromActionResponse from './dropLabelsFromActionResponse.tsx';

export default function dropLabelsFromGameState(
  gameState: GameState,
  labels: PlayerIDSet | null,
): GameState;
export default function dropLabelsFromGameState(
  gameState: GameState | null,
  labels: PlayerIDSet | null,
): GameState | null;

export default function dropLabelsFromGameState(
  gameState: GameState | null,
  labels: PlayerIDSet | null,
): GameState | null {
  return (
    (labels?.size &&
      gameState?.map(
        ([actionResponse, map]) =>
          [dropLabelsFromActionResponse(actionResponse, labels), map] as const,
      )) ||
    gameState
  );
}
