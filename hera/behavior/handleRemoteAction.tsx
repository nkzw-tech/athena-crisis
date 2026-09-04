import gameHasEnded from '@deities/apollo/lib/gameHasEnded.tsx';
import { GameActionResponse } from '@deities/apollo/Types.tsx';
import { Actions, State } from '../Types.tsx';
import { resetBehavior } from './Behavior.tsx';

export default async function handleRemoteAction(
  { processGameActionResponse, update }: Actions,
  remoteAction: Promise<GameActionResponse>,
): Promise<State> {
  const gameActionResponse = await remoteAction;
  const hasEnded = gameHasEnded(gameActionResponse.others);
  const state = await update(await processGameActionResponse(gameActionResponse));
  return !hasEnded ? await update(resetBehavior()) : state;
}
