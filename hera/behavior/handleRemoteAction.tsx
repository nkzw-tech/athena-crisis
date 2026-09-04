import { ActionResponse } from '@deities/apollo/ActionResponse.tsx';
import expectSelfActionResponse from '@deities/apollo/lib/expectSelfActionResponse.tsx';
import gameHasEnded from '@deities/apollo/lib/gameHasEnded.tsx';
import { GameActionResponse } from '@deities/apollo/Types.tsx';
import { Actions, State } from '../Types.tsx';
import { resetBehavior } from './Behavior.tsx';

export default async function handleRemoteAction<ExpectedType extends ActionResponse['type']>(
  { processGameActionResponse, throwError, update }: Actions,
  remoteAction: Promise<GameActionResponse>,
  expectedType: ExpectedType,
  { restoreBehavior = true }: { restoreBehavior?: boolean } = {},
): Promise<State> {
  let gameActionResponse: GameActionResponse;
  try {
    gameActionResponse = await remoteAction;
    expectSelfActionResponse(gameActionResponse, expectedType);
  } catch (error) {
    throwError(error as Error);
    return update(null);
  }

  const hasEnded = gameHasEnded(gameActionResponse.others);
  const state = await update(await processGameActionResponse(gameActionResponse));
  return restoreBehavior && !hasEnded ? await update(resetBehavior()) : state;
}
