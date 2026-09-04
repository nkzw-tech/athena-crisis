import { GameActionResponse } from '@deities/apollo/Types.tsx';
import { expect, test, vi } from 'vitest';
import { Actions, State } from '../../Types.tsx';
import handleRemoteAction from '../handleRemoteAction.tsx';

test('does not reset behavior when a response after GameEnd was processed last', async () => {
  const trailingResponse = { player: 1, time: 30, type: 'SetPlayerTime' } as const;
  const state = {
    lastActionResponse: trailingResponse,
  } as State;
  const gameActionResponse: GameActionResponse = {
    others: [{ actionResponse: { type: 'GameEnd' } }, { actionResponse: trailingResponse }],
    self: null,
  };
  const update = vi.fn(async () => state);
  const actions = {
    processGameActionResponse: vi.fn(async () => state),
    update,
  } as unknown as Actions;

  await expect(handleRemoteAction(actions, Promise.resolve(gameActionResponse))).resolves.toBe(
    state,
  );
  expect(update).toHaveBeenCalledTimes(1);
});
