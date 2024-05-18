import { formatActionResponses } from '@deities/apollo/FormatActions.tsx';
import type { GameState } from '@deities/apollo/Types.tsx';

export default function snapshotGameState(gameState: GameState | null) {
  return formatActionResponses(
    (gameState || []).map(([actionResponse]) => actionResponse),
    { colors: false },
  ).join('\n');
}
