import { GameActionResponse } from '@deities/apollo/Types.tsx';
import vec from '@deities/athena/map/vec.tsx';
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
    self: {
      actionResponse: {
        from: vec(1, 1),
        fuel: 10,
        path: [vec(1, 2)],
        to: vec(1, 2),
        type: 'Move',
      },
    },
  };
  const update = vi.fn(async () => state);
  const actions = {
    processGameActionResponse: vi.fn(async () => state),
    update,
  } as unknown as Actions;

  await expect(
    handleRemoteAction(actions, Promise.resolve(gameActionResponse), 'Move'),
  ).resolves.toBe(state);
  expect(update).toHaveBeenCalledTimes(1);
});

test('reports a protocol error without processing an unexpected self response', async () => {
  const state = {} as State;
  const processGameActionResponse = vi.fn(async () => state);
  const throwError = vi.fn();
  const update = vi.fn(async () => state);
  const actions = {
    processGameActionResponse,
    throwError,
    update,
  } as unknown as Actions;

  await expect(
    handleRemoteAction(
      actions,
      Promise.resolve({
        others: [
          {
            actionResponse: {
              from: vec(1, 1),
              fuel: 10,
              path: [vec(1, 2)],
              to: vec(1, 2),
              type: 'Move',
            },
          },
        ],
        self: null,
      }),
      'Move',
    ),
  ).resolves.toBe(state);

  expect(processGameActionResponse).not.toHaveBeenCalled();
  expect(throwError).toHaveBeenCalledOnce();
  expect(throwError.mock.calls[0]?.[0]).toHaveProperty(
    'message',
    expect.stringContaining("Expected self action response 'Move', received 'none'"),
  );
  expect(update).toHaveBeenCalledOnce();
});

test('reports a rejected remote action once', async () => {
  const state = {} as State;
  const error = new Error('Remote action failed.');
  const processGameActionResponse = vi.fn(async () => state);
  const throwError = vi.fn();
  const update = vi.fn(async () => state);
  const actions = {
    processGameActionResponse,
    throwError,
    update,
  } as unknown as Actions;

  await expect(handleRemoteAction(actions, Promise.reject(error), 'Move')).resolves.toBe(state);

  expect(processGameActionResponse).not.toHaveBeenCalled();
  expect(throwError).toHaveBeenCalledOnce();
  expect(throwError).toHaveBeenCalledWith(error);
  expect(update).toHaveBeenCalledOnce();
});
