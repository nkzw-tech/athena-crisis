import { ActionResponse } from '../ActionResponse.tsx';

export default function gameHasEnded(
  gameState: ReadonlyArray<readonly [ActionResponse, ...Array<unknown>]> | null,
) {
  return !!(
    gameState?.length && gameState.some(([actionResponse]) => actionResponse.type === 'GameEnd')
  );
}
