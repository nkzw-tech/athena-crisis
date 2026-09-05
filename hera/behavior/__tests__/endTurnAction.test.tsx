import { execute } from '@deities/apollo/Action.tsx';
import { Plain } from '@deities/athena/info/Tile.tsx';
import { Infantry } from '@deities/athena/info/Unit.tsx';
import { InstantAnimationConfig } from '@deities/athena/map/Configuration.tsx';
import MapData from '@deities/athena/MapData.tsx';
import ImmutableMap from '@nkzw/immutable-map';
import { setupLocaleContext } from 'fbtee';
import { expect, test, vi } from 'vitest';
import type { Actions, State } from '../../Types.tsx';
import canEndTurn from '../endTurn/canEndTurn.tsx';
import endTurnAction from '../endTurn/endTurnAction.tsx';

setupLocaleContext({
  availableLanguages: new Map(),
  clientLocales: [],
  loadLocale: () => Promise.resolve({}),
  translations: {},
});

const setup = (commit: Promise<void> = Promise.resolve()) => {
  const map = MapData.createMap({
    map: Array(9).fill(Plain.id),
    size: { height: 3, width: 3 },
    teams: [
      { id: 1, name: '', players: [{ funds: 0, id: 1, userId: '1' }] },
      { id: 2, name: '', players: [{ funds: 0, id: 2, userId: '2' }] },
    ],
    units: [
      [1, 1, Infantry.create(1).toJSON()],
      [3, 3, Infantry.create(2).toJSON()],
    ],
  });
  let state = {
    animationConfig: InstantAnimationConfig,
    animations: ImmutableMap(),
    behavior: null,
    currentViewer: 1,
    map,
    playerDetails: new Map(),
    replayState: { isReplaying: false },
    vision: map.createVisionObject(1),
  } as unknown as State;
  const pan = Promise.withResolvers<void>();
  const panning = Promise.withResolvers<void>();
  let stateAtSubmission: State | undefined;
  const action = vi.fn<Actions['action']>((currentState, action) => {
    stateAtSubmission = state;
    const result = execute(currentState.map, currentState.vision, action);
    if (!result) {
      throw new Error('Expected a valid End Turn action.');
    }
    const [response, map] = result;
    return [new Promise(() => {}), map, response];
  });
  const actions = {
    action,
    scrollIntoView: vi.fn(() => {
      panning.resolve();
      return pan.promise;
    }),
    update: vi.fn<Actions['update']>(async (change) => {
      await commit;
      state = { ...state, ...(typeof change === 'function' ? change(state) : change) };
      return state;
    }),
  } satisfies Partial<Actions> as unknown as Actions;

  return {
    actions,
    getState: () => state,
    getStateAtSubmission: () => stateAtSubmission,
    pan,
    panning: panning.promise,
  };
};

test('commits the gameplay lock before submitting End Turn', async () => {
  const commit = Promise.withResolvers<void>();
  const { actions, getState, pan } = setup(commit.promise);
  const pending = endTurnAction(actions, getState());

  try {
    expect(actions.update).toHaveBeenCalled();
    expect(actions.action).not.toHaveBeenCalled();
    expect(actions.scrollIntoView).not.toHaveBeenCalled();
  } finally {
    commit.resolve();
    pan.resolve();
    await pending;
  }

  expect(actions.action).toHaveBeenCalledOnce();
});

test('keeps gameplay locked throughout the End Turn camera pan and animation', async () => {
  const { actions, getState, getStateAtSubmission, pan, panning } = setup();
  expect(canEndTurn(getState())).toBe(true);
  const pending = endTurnAction(actions, getState());
  await panning;

  try {
    expect(getStateAtSubmission()?.behavior?.type).toBe('null');
    expect(getState().behavior?.type).toBe('null');
    expect(canEndTurn(getState())).toBe(false);
    expect(getState().map.currentPlayer).toBe(1);
    expect(getState().animations.size).toBe(0);
  } finally {
    pan.resolve();
    await pending;
  }

  expect(getState().map.currentPlayer).toBe(2);
  expect(getState().animations.size).toBe(1);
  expect(getState().behavior?.type).toBe('null');
});
