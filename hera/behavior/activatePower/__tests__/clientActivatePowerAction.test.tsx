import type { CharacterMessageActionResponse } from '@deities/apollo/ActionResponse.tsx';
import { Skill } from '@deities/athena/info/Skill.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { beforeEach, expect, test, vi } from 'vitest';
import type { Actions, State } from '../../../Types.tsx';

const mocks = vi.hoisted(() => ({
  activatePowerAction: vi.fn(),
  characterMessageAction: vi.fn(),
  getActivatePowerMessage: vi.fn(),
}));

vi.mock('@deities/hermes/messages/getActivatePowerMessage.tsx', () => ({
  default: mocks.getActivatePowerMessage,
}));
vi.mock('../activatePowerAction.tsx', () => ({ default: mocks.activatePowerAction }));
vi.mock('../../characterMessage/characterMessageAction.tsx', () => ({
  default: mocks.characterMessageAction,
}));

const { default: clientActivatePowerAction } = await import('../clientActivatePowerAction.tsx');

const map = MapData.createMap({});
const actionResponse = {
  skill: Skill.SpawnUnitInfernoJetpack,
  type: 'ActivatePower',
} as const;
const messageActionResponse: CharacterMessageActionResponse = {
  message: 'Leave this world now!',
  player: 'self',
  silhouette: false,
  type: 'CharacterMessage',
  unitId: 1,
  variant: 0,
};

const createTestGame = (skipActions = false) => {
  let state = {
    map,
    skipActions,
    vision: map.createVisionObject(1),
  } as State;
  const actions = {
    processGameActionResponse: vi.fn(),
    update: vi.fn<Actions['update']>(async (stateLike) => {
      const nextState = typeof stateLike === 'function' ? stateLike(state) : stateLike;
      if (nextState) {
        state = { ...state, ...nextState };
      }
      return state;
    }),
  } as unknown as Actions;

  return { actions, getState: () => state };
};

beforeEach(() => {
  vi.resetAllMocks();
});

test('shows the generated message directly before activating the power', async () => {
  const testGame = createTestGame();
  const stateAfterMessage = { ...testGame.getState(), highlightedPositions: null };
  const stateAfterPower = { ...stateAfterMessage, radius: null };
  const messageResult = Promise.withResolvers<State>();
  mocks.getActivatePowerMessage.mockReturnValue([messageActionResponse, map]);
  mocks.characterMessageAction.mockReturnValue(messageResult.promise);
  mocks.activatePowerAction.mockResolvedValue(stateAfterPower);

  const result = clientActivatePowerAction(testGame.actions, testGame.getState(), actionResponse);

  await vi.waitFor(() => expect(mocks.characterMessageAction).toHaveBeenCalledOnce());
  expect(mocks.activatePowerAction).not.toHaveBeenCalled();
  messageResult.resolve(stateAfterMessage);

  await expect(result).resolves.toBe(stateAfterPower);

  expect(mocks.characterMessageAction).toHaveBeenCalledWith(
    testGame.actions,
    expect.objectContaining({ map }),
    messageActionResponse,
    'top',
  );
  expect(mocks.activatePowerAction).toHaveBeenCalledWith(
    testGame.actions,
    stateAfterMessage,
    actionResponse,
  );
  expect(mocks.characterMessageAction.mock.invocationCallOrder[0]).toBeLessThan(
    mocks.activatePowerAction.mock.invocationCallOrder[0]!,
  );
  expect(testGame.actions.processGameActionResponse).not.toHaveBeenCalled();
});

test('does not show a generated message while skipping actions', async () => {
  const testGame = createTestGame(true);
  mocks.getActivatePowerMessage.mockReturnValue([messageActionResponse, map]);
  mocks.activatePowerAction.mockResolvedValue(testGame.getState());

  await clientActivatePowerAction(testGame.actions, testGame.getState(), actionResponse);

  expect(mocks.characterMessageAction).not.toHaveBeenCalled();
  expect(mocks.activatePowerAction).toHaveBeenCalledWith(
    testGame.actions,
    testGame.getState(),
    actionResponse,
  );
  expect(testGame.actions.processGameActionResponse).not.toHaveBeenCalled();
});

test('activates immediately when no message was generated', async () => {
  const testGame = createTestGame();
  mocks.getActivatePowerMessage.mockReturnValue(null);
  mocks.activatePowerAction.mockResolvedValue(testGame.getState());

  await clientActivatePowerAction(testGame.actions, testGame.getState(), actionResponse);

  expect(mocks.characterMessageAction).not.toHaveBeenCalled();
  expect(mocks.activatePowerAction).toHaveBeenCalledWith(
    testGame.actions,
    testGame.getState(),
    actionResponse,
  );
  expect(testGame.actions.processGameActionResponse).not.toHaveBeenCalled();
});
