import type { ActionResponse, DropUnitActionResponse } from '@deities/apollo/ActionResponse.tsx';
import { Plain, RailTrack } from '@deities/athena/info/Tile.tsx';
import { Pioneer } from '@deities/athena/info/Unit.tsx';
import { InstantAnimationConfig } from '@deities/athena/map/Configuration.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import ImmutableMap from '@nkzw/immutable-map';
import { setupLocaleContext } from 'fbtee';
import { beforeAll, describe, expect, test, vi } from 'vitest';
import { setBaseClass } from '../../behavior/Behavior.tsx';
import createTracksAction from '../../behavior/createTracks/createTracksAction.tsx';
import dropUnitAction from '../../behavior/drop/dropUnitAction.tsx';
import NullBehavior from '../../behavior/NullBehavior.tsx';
import unfoldAction from '../../behavior/unfold/unfoldAction.tsx';
import type { Actions, State, StateLike } from '../../Types.tsx';

vi.hoisted(() =>
  Object.defineProperty(globalThis, 'Image', {
    configurable: true,
    value: class Image {},
  }),
);
vi.mock('@deities/ui/AudioPlayer.tsx', () => ({ default: {} }));
vi.mock('@deities/art/Sprites.tsx', () => ({ hasSpriteURL: () => false }));
vi.mock('../../MapAnimations.tsx', () => ({}));

const position = vec(1, 1);
const target = vec(2, 2);
let processActionResponses: typeof import('../processActionResponse.tsx').default;

setupLocaleContext({
  availableLanguages: new Map(),
  clientLocales: [],
  loadLocale: () => Promise.resolve({}),
  translations: {},
});

beforeAll(async () => {
  setBaseClass(NullBehavior);
  ({ default: processActionResponses } = await import('../processActionResponse.tsx'));
});

const createMap = (withPioneer = false) =>
  MapData.createMap({
    active: [1, 2],
    currentPlayer: 1,
    map: Array(4).fill(Plain.id),
    modifiers: Array(4).fill(0),
    size: { height: 2, width: 2 },
    teams: [
      { id: 1, name: 'One', players: [{ funds: 100, id: 1, userId: 'User-1' }] },
      { id: 2, name: 'Two', players: [{ funds: 100, id: 2, userId: 'User-2' }] },
    ],
    units: withPioneer ? [[position.x, position.y, Pioneer.create(1).toJSON()]] : [],
  });

const applyStateLike = (state: State, stateLike: StateLike | null): State =>
  stateLike ? ({ ...state, ...stateLike } as State) : state;

const createTestGame = (map = createMap()) => {
  let state = {
    animationConfig: InstantAnimationConfig,
    animations: ImmutableMap(),
    currentViewer: 1,
    map,
    playerDetails: new Map(),
    replayState: {
      isLive: false,
      isPaused: false,
      isReplaying: false,
      isWaiting: false,
      pauseStart: null,
    },
    skipActions: false,
    vision: map.createVisionObject(1),
  } as unknown as State;
  let rejectFullStateUpdate = false;
  const update = vi.fn<Actions['update']>(async (stateLike) => {
    if (rejectFullStateUpdate && stateLike === state) {
      throw new Error('Update failed.');
    }
    const nextStateLike = typeof stateLike === 'function' ? stateLike(state) : stateLike;
    state = applyStateLike(state, nextStateLike);
    return state;
  });
  const actions = {
    processGameActionResponse: vi.fn(async () => state),
    requestFrame: (callback: Parameters<Actions['requestFrame']>[0]) => callback(0),
    scheduleTimer: (callback: Parameters<Actions['scheduleTimer']>[0]) => {
      callback();
      return Promise.resolve(1);
    },
    scrollIntoView: vi.fn(async () => {}),
    throwError: vi.fn(),
    update,
  } as unknown as Actions;

  return {
    actions,
    getState: () => state,
    rejectFullStateUpdates: () => {
      rejectFullStateUpdate = true;
    },
    update,
  };
};

const process = (state: State, actions: Actions, actionResponse: ActionResponse) =>
  processActionResponses(
    state,
    actions,
    [{ actionResponse }],
    {
      human: InstantAnimationConfig,
      regular: InstantAnimationConfig,
    },
    () => false,
    undefined,
  );

describe.each([
  ['Rescue', { player: 1, to: target, type: 'Rescue' }],
  ['Heal with a source', { from: position, to: target, type: 'Heal' }],
  ['Heal without a source', { to: target, type: 'Heal' }],
  ['Sabotage with a source', { from: position, to: target, type: 'Sabotage' }],
  ['Sabotage without a source', { to: target, type: 'Sabotage' }],
  ['HiddenMove', { path: [], type: 'HiddenMove' }],
  ['Message', { message: 'Unused legacy message', type: 'Message' }],
] as const)('%s without animation prerequisites', (_, actionResponse) => {
  test('applies the response and settles', async () => {
    const testGame = createTestGame();

    await expect(process(testGame.getState(), testGame.actions, actionResponse)).resolves.toEqual(
      expect.objectContaining({ map: expect.any(MapData) }),
    );
    expect(testGame.getState().animations.size).toBe(0);
  });
});

test('DropUnit invokes its completion callback when animation prerequisites are missing', () => {
  const testGame = createTestGame();
  const actionResponse: DropUnitActionResponse = {
    from: position,
    index: 0,
    to: target,
    type: 'DropUnit',
  };
  const onComplete = vi.fn((state: State) => state);

  const result = dropUnitAction(
    testGame.getState().map,
    actionResponse,
    testGame.getState(),
    onComplete,
  );

  expect(onComplete).toHaveBeenCalledOnce();
  expect(result).toBe(onComplete.mock.calls[0]?.[0]);
});

test.each([
  ['Fold', 'fold'],
  ['Unfold', 'unfold'],
] as const)(
  '%s applies the response when the animation unit is missing',
  async (type, foldType) => {
    const testGame = createTestGame();

    await unfoldAction(
      testGame.actions,
      { from: target, type },
      target,
      foldType,
      testGame.getState(),
    );

    expect(testGame.update).toHaveBeenCalledOnce();
  },
);

test('CreateTracks settles only after its animation completes', async () => {
  const testGame = createTestGame(createMap(true));
  const actionResponse = { from: position, type: 'CreateTracks' } as const;
  let settled = false;
  const promise = createTracksAction(testGame.actions, actionResponse).then((state) => {
    settled = true;
    return state;
  });
  await vi.waitFor(() => expect(testGame.getState().animations.has(position)).toBe(true));
  expect(settled).toBe(false);

  const animation = testGame.getState().animations.get(position)!;
  expect(animation.type).toBe('createBuilding');
  if (animation.type !== 'createBuilding') {
    throw new Error('Expected a createBuilding animation.');
  }
  await testGame.update(animation.onCreate?.(testGame.getState()) || null);
  expect(testGame.getState().map.getTileInfo(position)).toBe(RailTrack);
  expect(settled).toBe(false);

  const stateWithoutAnimation = {
    ...testGame.getState(),
    animations: testGame.getState().animations.delete(position),
  };
  await testGame.update(animation.onComplete?.(stateWithoutAnimation) || null);

  await expect(promise).resolves.toEqual(expect.objectContaining({ map: testGame.getState().map }));
  expect(settled).toBe(true);
});

test('a draw settles when its banner completes', async () => {
  const testGame = createTestGame();
  let settled = false;
  const promise = process(testGame.getState(), testGame.actions, { type: 'GameEnd' }).then(
    (state) => {
      settled = true;
      return state;
    },
  );
  await vi.waitFor(() => expect(testGame.getState().animations.size).toBe(1));
  expect(settled).toBe(false);

  const [animationPosition, animation] = testGame.getState().animations.entries().next().value!;
  expect(animation.type).toBe('banner');
  if (animation.type !== 'banner') {
    throw new Error('Expected a banner animation.');
  }
  const stateWithoutAnimation = {
    ...testGame.getState(),
    animations: testGame.getState().animations.delete(animationPosition),
  };
  await testGame.update(animation.onComplete?.(stateWithoutAnimation) || null);

  await expect(promise).resolves.toEqual(expect.objectContaining({ map: testGame.getState().map }));
  expect(settled).toBe(true);
});

test('asynchronous response work rejects instead of remaining pending', async () => {
  const testGame = createTestGame();
  testGame.rejectFullStateUpdates();

  await expect(
    process(testGame.getState(), testGame.actions, {
      type: 'Spawn',
      units: ImmutableMap(),
    }),
  ).rejects.toThrow('Update failed.');
});
