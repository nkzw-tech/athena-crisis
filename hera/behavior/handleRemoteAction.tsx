import { GameActionResponse } from '@deities/apollo/Types.tsx';
import { Actions, State } from '../Types.tsx';
import { resetBehavior } from './Behavior.tsx';

export default async function handleRemoteAction(
  { processGameActionResponse, update }: Actions,
  remoteAction: Promise<GameActionResponse>,
): Promise<State> {
  const state = await update(
    await processGameActionResponse(await remoteAction),
  );
  return state.lastActionResponse?.type !== 'GameEnd'
    ? await update(resetBehavior())
    : state;
}
