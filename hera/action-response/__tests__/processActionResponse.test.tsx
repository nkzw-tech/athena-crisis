import type {
  ActionResponse,
  DropUnitActionResponse,
  HealActionResponse,
  MoveActionResponse,
  SabotageActionResponse,
} from '@deities/apollo/ActionResponse.tsx';
import applyActionResponse from '@deities/apollo/actions/applyActionResponse.tsx';
import type { GameActionResponse } from '@deities/apollo/Types.tsx';
import { Skill } from '@deities/athena/info/Skill.tsx';
import { Plain, RailTrack } from '@deities/athena/info/Tile.tsx';
import { Artillery, Infantry, Jeep, Pioneer } from '@deities/athena/info/Unit.tsx';
import { InstantAnimationConfig } from '@deities/athena/map/Configuration.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import ImmutableMap from '@nkzw/immutable-map';
import { setupLocaleContext } from 'fbtee';
import { beforeAll, describe, expect, test, vi } from 'vitest';
import { setBaseClass } from '../../behavior/Behavior.tsx';
import buySkillAction from '../../behavior/buySkill/buySkillAction.tsx';
import clientBuySkillAction from '../../behavior/buySkill/clientBuySkillAction.tsx';
import completeUnitAction from '../../behavior/completeUnit/completeUnitAction.tsx';
import createTracksAction from '../../behavior/createTracks/createTracksAction.tsx';
import dropUnitAction, { clientDropUnitAction } from '../../behavior/drop/dropUnitAction.tsx';
import { clientHealAction } from '../../behavior/heal/healAction.tsx';
import clientMoveAction from '../../behavior/move/clientMoveAction.tsx';
import moveAction from '../../behavior/move/moveAction.tsx';
import { clientSabotageAction } from '../../behavior/sabotage/sabotageAction.tsx';
import supplyAction from '../../behavior/supply/supplyAction.tsx';
import loadUnitAction from '../../behavior/transport/loadUnitAction.tsx';
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

class BaseBehavior {
  public readonly type = 'base' as const;
}

setupLocaleContext({
  availableLanguages: new Map(),
  clientLocales: [],
  loadLocale: () => Promise.resolve({}),
  translations: {},
});

beforeAll(async () => {
  setBaseClass(BaseBehavior);
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
    units: withPioneer ? [[position.x, position.y, Pioneer.create(1).withName(-1).toJSON()]] : [],
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
    requestFrame: (callback: Parameters<Actions['requestFrame']>[0]) =>
      queueMicrotask(() => callback(0)),
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

const completeAnimation = async (testGame: ReturnType<typeof createTestGame>) => {
  const [animationPosition, animation] = testGame.getState().animations.entries().next().value!;
  const stateWithoutAnimation = {
    ...testGame.getState(),
    animations: testGame.getState().animations.delete(animationPosition),
  };
  await testGame.update(animation.onComplete?.(stateWithoutAnimation) || null);
};

const createRemoteAction = <T extends ActionResponse>(
  actionResponse: T,
  others?: GameActionResponse['others'],
) => {
  let resolve!: () => void;
  const remoteAction = new Promise<GameActionResponse>((resolvePromise) => {
    resolve = () => resolvePromise({ others, self: { actionResponse } });
  });
  return [remoteAction, resolve] as const;
};

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
      Promise.resolve({ self: { actionResponse: { from: target, type } } }),
      applyActionResponse(testGame.getState().map, testGame.getState().vision, {
        from: target,
        type,
      }),
      { from: target, type },
      target,
      foldType,
      testGame.getState(),
    );

    expect(testGame.getState().behavior?.type).toBe('base');
    await vi.waitFor(() =>
      expect(testGame.actions.processGameActionResponse).toHaveBeenCalledOnce(),
    );
  },
);

test('CompleteUnit restores behavior before processing the remote response', async () => {
  const testGame = createTestGame(createMap(true));
  const actionResponse = { from: position, type: 'CompleteUnit' } as const;
  const newMap = applyActionResponse(
    testGame.getState().map,
    testGame.getState().vision,
    actionResponse,
  );
  let resolveRemoteAction!: (response: { self: { actionResponse: typeof actionResponse } }) => void;
  const remoteAction = new Promise<{ self: { actionResponse: typeof actionResponse } }>(
    (resolve) => {
      resolveRemoteAction = resolve;
    },
  );
  const actions = {
    ...testGame.actions,
    action: vi.fn(() => [remoteAction, newMap, actionResponse]),
  } as unknown as Actions;
  await expect(completeUnitAction(actions, testGame.getState(), position)).resolves.toEqual(
    expect.objectContaining({ map: newMap }),
  );
  expect(testGame.getState().behavior?.type).toBe('base');
  expect(actions.processGameActionResponse).not.toHaveBeenCalled();

  resolveRemoteAction({ self: { actionResponse } });
  await vi.waitFor(() => expect(actions.processGameActionResponse).toHaveBeenCalledOnce());
});

test('CompleteUnit reports a rejected remote response after restoring behavior', async () => {
  const testGame = createTestGame(createMap(true));
  const actionResponse = { from: position, type: 'CompleteUnit' } as const;
  const newMap = applyActionResponse(
    testGame.getState().map,
    testGame.getState().vision,
    actionResponse,
  );
  let rejectRemoteAction!: (error: Error) => void;
  const remoteAction = new Promise<never>((_, reject) => {
    rejectRemoteAction = reject;
  });
  const actions = {
    ...testGame.actions,
    action: vi.fn(() => [remoteAction, newMap, actionResponse]),
  } as unknown as Actions;
  const error = new Error('Remote action failed.');

  await completeUnitAction(actions, testGame.getState(), position);
  expect(testGame.getState().behavior?.type).toBe('base');

  rejectRemoteAction(error);
  await vi.waitFor(() => expect(actions.throwError).toHaveBeenCalledWith(error));
  expect(actions.throwError).toHaveBeenCalledOnce();
});

test('a completed Move restores behavior before processing its remote response', async () => {
  const moveTarget = vec(1, 2);
  const map = createMap(true);
  const testGame = createTestGame(map);
  const actionResponse: MoveActionResponse = {
    completed: true,
    from: position,
    fuel: map.units.get(position)!.fuel - 1,
    path: [moveTarget],
    to: moveTarget,
    type: 'Move',
  };
  const newMap = applyActionResponse(map, testGame.getState().vision, actionResponse);
  const [remoteAction, resolveRemoteAction] = createRemoteAction(actionResponse, [
    { actionResponse: { player: 1, time: 30, type: 'SetPlayerTime' } },
  ]);
  const onComplete = vi.fn();
  const actions = {
    ...testGame.actions,
    action: vi.fn(() => [remoteAction, newMap, actionResponse]),
  } as unknown as Actions;

  await testGame.update(
    moveAction(
      actions,
      position,
      moveTarget,
      new Map(),
      testGame.getState(),
      onComplete,
      [moveTarget],
      position,
      undefined,
      true,
    ),
  );

  expect(testGame.getState().behavior?.type).toBe('null');
  await completeAnimation(testGame);
  expect(testGame.getState().behavior?.type).toBe('base');
  expect(testGame.getState().map).toBe(newMap);
  expect(onComplete).not.toHaveBeenCalled();
  expect(actions.processGameActionResponse).not.toHaveBeenCalled();

  resolveRemoteAction();
  await vi.waitFor(() => expect(actions.processGameActionResponse).toHaveBeenCalledOnce());
});

test('an ordinary Move keeps behavior locked until its remote continuation is processed', async () => {
  const moveTarget = vec(1, 2);
  const map = createMap(true);
  const testGame = createTestGame(map);
  const actionResponse: MoveActionResponse = {
    from: position,
    fuel: map.units.get(position)!.fuel - 1,
    path: [moveTarget],
    to: moveTarget,
    type: 'Move',
  };
  const newMap = applyActionResponse(map, testGame.getState().vision, actionResponse);
  const [remoteAction, resolveRemoteAction] = createRemoteAction(actionResponse);
  const onComplete = vi.fn(() => null);

  await testGame.update(
    clientMoveAction(
      testGame.actions,
      remoteAction,
      newMap,
      position,
      moveTarget,
      actionResponse.path,
      new Map(),
      testGame.getState(),
      onComplete,
    ),
  );

  await completeAnimation(testGame);
  expect(testGame.getState().behavior?.type).toBe('null');
  expect(onComplete).not.toHaveBeenCalled();
  expect(testGame.actions.processGameActionResponse).not.toHaveBeenCalled();

  resolveRemoteAction();
  await vi.waitFor(() => {
    expect(testGame.actions.processGameActionResponse).toHaveBeenCalledOnce();
    expect(onComplete).toHaveBeenCalledOnce();
  });
});

test('Unfold does not process its remote response before the animation completes', async () => {
  const map = createMap().copy({
    units: ImmutableMap([[position, Artillery.create(1)]]),
  });
  const testGame = createTestGame(map);
  const actionResponse = { from: position, type: 'Unfold' } as const;
  const newMap = applyActionResponse(map, testGame.getState().vision, actionResponse);
  const [remoteAction, resolveRemoteAction] = createRemoteAction(actionResponse);
  let settled = false;
  const promise = unfoldAction(
    testGame.actions,
    remoteAction,
    newMap,
    actionResponse,
    position,
    'unfold',
    testGame.getState(),
  ).then((state) => {
    settled = true;
    return state;
  });

  await vi.waitFor(() => expect(testGame.getState().animations.has(position)).toBe(true));
  expect(settled).toBe(false);
  expect(testGame.actions.processGameActionResponse).not.toHaveBeenCalled();

  await completeAnimation(testGame);
  await expect(promise).resolves.toEqual(expect.objectContaining({ map: newMap }));
  expect(testGame.getState().behavior?.type).toBe('base');
  expect(testGame.actions.processGameActionResponse).not.toHaveBeenCalled();

  resolveRemoteAction();
  await vi.waitFor(() => expect(testGame.actions.processGameActionResponse).toHaveBeenCalledOnce());
});

test.each([
  ['Heal', clientHealAction],
  ['Sabotage', clientSabotageAction],
] as const)(
  '%s waits for its animation before processing the remote response',
  async (type, fn) => {
    const map = createMap().copy({
      units: ImmutableMap([
        [position, Pioneer.create(1)],
        [target, Pioneer.create(1)],
      ]),
    });
    const testGame = createTestGame(map);
    const actionResponse = { from: position, to: target, type };
    const newMap = applyActionResponse(map, testGame.getState().vision, actionResponse);
    const [remoteAction, resolveRemoteAction] = createRemoteAction(
      actionResponse as HealActionResponse | SabotageActionResponse,
    );

    await testGame.update(
      type === 'Heal'
        ? fn(
            testGame.actions,
            remoteAction,
            newMap,
            actionResponse as HealActionResponse,
            testGame.getState(),
          )
        : fn(
            testGame.actions,
            remoteAction,
            newMap,
            actionResponse as SabotageActionResponse,
            testGame.getState(),
          ),
    );

    expect(testGame.actions.processGameActionResponse).not.toHaveBeenCalled();
    expect(testGame.getState().behavior?.type).toBe('null');

    await completeAnimation(testGame);
    expect(testGame.getState().behavior?.type).toBe('base');
    expect(testGame.actions.processGameActionResponse).not.toHaveBeenCalled();

    resolveRemoteAction();
    await vi.waitFor(() => {
      expect(testGame.actions.processGameActionResponse).toHaveBeenCalledOnce();
    });
  },
);

test.each([
  ['Heal', clientHealAction],
  ['Sabotage', clientSabotageAction],
] as const)('%s reconciles when its animation target is missing', async (type, fn) => {
  const testGame = createTestGame();
  const actionResponse = { from: position, to: target, type };

  await testGame.update(
    type === 'Heal'
      ? fn(
          testGame.actions,
          Promise.resolve({ self: { actionResponse } }),
          testGame.getState().map,
          actionResponse as HealActionResponse,
          testGame.getState(),
        )
      : fn(
          testGame.actions,
          Promise.resolve({ self: { actionResponse } }),
          testGame.getState().map,
          actionResponse as SabotageActionResponse,
          testGame.getState(),
        ),
  );

  await vi.waitFor(() => expect(testGame.actions.processGameActionResponse).toHaveBeenCalledOnce());
  expect(testGame.getState().behavior?.type).toBe('base');
});

test('Supply waits for all unit animations before processing the remote response', async () => {
  const unitToRefill = Pioneer.create(1).modifyHealth(-10);
  const map = createMap().copy({
    units: ImmutableMap([
      [position, Pioneer.create(1)],
      [target, unitToRefill],
    ]),
  });
  const testGame = createTestGame(map);
  const state = {
    ...testGame.getState(),
    selectedPosition: position,
    selectedUnit: map.units.get(position),
  } as State;
  const actionResponse = { from: position, player: 1, type: 'Supply' } as const;
  const newMap = applyActionResponse(map, state.vision, actionResponse);
  const [remoteAction, resolveRemoteAction] = createRemoteAction(actionResponse);
  const actions = {
    ...testGame.actions,
    action: vi.fn(() => [remoteAction, newMap, actionResponse]),
  } as unknown as Actions;

  await testGame.update(supplyAction(actions, state, new Map([[target, unitToRefill]])));
  expect(actions.processGameActionResponse).not.toHaveBeenCalled();
  expect(testGame.getState().behavior?.type).toBe('null');

  await completeAnimation(testGame);
  expect(actions.processGameActionResponse).not.toHaveBeenCalled();

  await completeAnimation(testGame);
  expect(testGame.getState().behavior?.type).toBe('base');
  expect(actions.processGameActionResponse).not.toHaveBeenCalled();

  resolveRemoteAction();
  await vi.waitFor(() => expect(actions.processGameActionResponse).toHaveBeenCalledOnce());
});

test('DropUnit waits for its movement animation before processing the remote response', async () => {
  const transportedUnit = Infantry.create(1).transport();
  const map = createMap().copy({
    units: ImmutableMap([[position, Jeep.create(1).load(transportedUnit)]]),
  });
  const testGame = createTestGame(map);
  const actionResponse: DropUnitActionResponse = {
    from: position,
    index: 0,
    to: target,
    type: 'DropUnit',
  };
  const newMap = applyActionResponse(map, testGame.getState().vision, actionResponse);
  const [remoteAction, resolveRemoteAction] = createRemoteAction(actionResponse);

  await testGame.update(
    clientDropUnitAction(
      testGame.actions,
      remoteAction,
      newMap,
      actionResponse,
      testGame.getState(),
    ),
  );

  expect(testGame.actions.processGameActionResponse).not.toHaveBeenCalled();
  expect(testGame.getState().behavior?.type).toBe('null');

  await completeAnimation(testGame);
  expect(testGame.getState().behavior?.type).toBe('base');
  expect(testGame.actions.processGameActionResponse).not.toHaveBeenCalled();

  resolveRemoteAction();
  await vi.waitFor(() => expect(testGame.actions.processGameActionResponse).toHaveBeenCalledOnce());
});

test('DropUnit reconciles when its animation prerequisites are missing', async () => {
  const testGame = createTestGame();
  const actionResponse: DropUnitActionResponse = {
    from: position,
    index: 0,
    to: target,
    type: 'DropUnit',
  };

  await testGame.update(
    clientDropUnitAction(
      testGame.actions,
      Promise.resolve({ self: { actionResponse } }),
      testGame.getState().map,
      actionResponse,
      testGame.getState(),
    ),
  );

  await vi.waitFor(() => expect(testGame.actions.processGameActionResponse).toHaveBeenCalledOnce());
  expect(testGame.getState().behavior?.type).toBe('base');
});

test('transport loading waits for movement before processing the remote response', async () => {
  const sourceUnit = Infantry.create(1);
  const transport = Jeep.create(1);
  const map = createMap().copy({
    units: ImmutableMap([
      [position, sourceUnit],
      [target, transport],
    ]),
  });
  const testGame = createTestGame(map);
  const state = {
    ...testGame.getState(),
    selectedPosition: position,
    selectedUnit: sourceUnit,
  } as State;
  const actionResponse = {
    from: position,
    fuel: sourceUnit.fuel - 1,
    path: [target],
    to: target,
    type: 'Move',
  } as const;
  const newMap = applyActionResponse(map, state.vision, actionResponse);
  const [remoteAction, resolveRemoteAction] = createRemoteAction(actionResponse);
  const actions = {
    ...testGame.actions,
    action: vi.fn(() => [remoteAction, newMap, actionResponse]),
  } as unknown as Actions;
  let settled = false;

  const promise = loadUnitAction(
    {
      moveable: new Map(),
      path: [target],
      position: target,
      unit: transport,
    },
    actions,
    state,
  ).then((state) => {
    settled = true;
    return state;
  });

  await vi.waitFor(() => expect(testGame.getState().animations.has(position)).toBe(true));
  expect(settled).toBe(false);
  expect(actions.processGameActionResponse).not.toHaveBeenCalled();
  expect(testGame.getState().behavior?.type).toBe('null');

  await completeAnimation(testGame);
  await expect(promise).resolves.toEqual(expect.objectContaining({ map: expect.any(MapData) }));
  expect(testGame.getState().behavior?.type).toBe('base');
  expect(actions.processGameActionResponse).not.toHaveBeenCalled();

  resolveRemoteAction();
  await vi.waitFor(() => expect(actions.processGameActionResponse).toHaveBeenCalledOnce());
});

test('BuySkill waits for its banner before processing the remote response', async () => {
  const testGame = createTestGame();
  const actionResponse = {
    from: position,
    player: 1,
    skill: Skill.AttackIncreaseMinor,
    type: 'BuySkill',
  } as const;
  const newMap = applyActionResponse(
    testGame.getState().map,
    testGame.getState().vision,
    actionResponse,
  );
  const [remoteAction, resolveRemoteAction] = createRemoteAction(actionResponse);
  const actions = {
    ...testGame.actions,
    action: vi.fn(() => [remoteAction, newMap, actionResponse]),
  } as unknown as Actions;
  let settled = false;

  const promise = clientBuySkillAction(
    actions,
    testGame.getState(),
    position,
    Skill.AttackIncreaseMinor,
  ).then((state) => {
    settled = true;
    return state;
  });

  await vi.waitFor(() => expect(testGame.getState().animations.size).toBe(1));
  expect(testGame.getState().map.getPlayer(1).skills.has(Skill.AttackIncreaseMinor)).toBe(true);
  expect(testGame.getState().behavior?.type).toBe('null');
  expect(actions.processGameActionResponse).not.toHaveBeenCalled();
  expect(settled).toBe(false);

  await completeAnimation(testGame);
  await expect(promise).resolves.toEqual(expect.objectContaining({ map: expect.any(MapData) }));
  expect(testGame.getState().behavior?.type).toBe('base');
  expect(actions.processGameActionResponse).not.toHaveBeenCalled();

  resolveRemoteAction();
  await vi.waitFor(() => expect(actions.processGameActionResponse).toHaveBeenCalledOnce());
});

test('BuySkill rejects when its initial animation update fails', async () => {
  const error = new Error('Update failed.');
  const actionResponse = {
    from: position,
    player: 1,
    skill: Skill.AttackIncreaseMinor,
    type: 'BuySkill',
  } as const;
  const actions = {
    update: vi.fn(() => Promise.reject(error)),
  } as unknown as Actions;

  await expect(buySkillAction(actions, actionResponse)).rejects.toBe(error);
});

test('CharacterMessage responses retain their placement, highlighting, and sequencing', async () => {
  const testGame = createTestGame(createMap(true));
  const responses = ['First message', 'Second message'].map((message, index) => ({
    actionResponse: {
      message,
      player: 'self',
      type: 'CharacterMessage',
      unitId: Pioneer.id + index,
      variant: 0,
    } as const,
  }));
  const promise = processActionResponses(
    testGame.getState(),
    testGame.actions,
    responses,
    {
      human: InstantAnimationConfig,
      regular: InstantAnimationConfig,
    },
    () => false,
    undefined,
  );

  await vi.waitFor(() => expect(testGame.getState().animations.size).toBe(1));
  let animation = testGame.getState().animations.values().next().value!;
  expect(animation).toMatchObject({
    position: 'top',
    text: 'First message',
    type: 'characterMessage',
  });
  expect(testGame.getState().highlightedPositions).toEqual([position]);
  await completeAnimation(testGame);

  await vi.waitFor(() => {
    animation = testGame.getState().animations.values().next().value!;
    expect(animation).toMatchObject({
      position: 'bottom',
      text: 'Second message',
      type: 'characterMessage',
    });
  });
  await completeAnimation(testGame);

  await expect(promise).resolves.toEqual(
    expect.objectContaining({ highlightedPositions: null, radius: null }),
  );
});

test('CreateTracks settles only after its animation completes', async () => {
  const testGame = createTestGame(createMap(true));
  const actionResponse = { from: position, type: 'CreateTracks' } as const;
  let resolveRemoteAction!: (response: GameActionResponse) => void;
  const remoteAction = new Promise<GameActionResponse>((resolve) => {
    resolveRemoteAction = resolve;
  });
  let settled = false;
  const promise = createTracksAction(
    testGame.actions,
    remoteAction,
    applyActionResponse(testGame.getState().map, testGame.getState().vision, actionResponse),
    actionResponse,
  ).then((state) => {
    settled = true;
    return state;
  });
  await vi.waitFor(() => expect(testGame.getState().animations.has(position)).toBe(true));
  expect(settled).toBe(false);
  expect(testGame.actions.processGameActionResponse).not.toHaveBeenCalled();

  const animation = testGame.getState().animations.get(position)!;
  expect(animation.type).toBe('createBuilding');
  if (animation.type !== 'createBuilding') {
    throw new Error('Expected a createBuilding animation.');
  }
  await testGame.update(animation.onCreate?.(testGame.getState()) || null);
  expect(testGame.getState().map.getTileInfo(position)).toBe(RailTrack);
  expect(settled).toBe(false);

  await completeAnimation(testGame);

  await expect(promise).resolves.toEqual(expect.objectContaining({ map: testGame.getState().map }));
  expect(settled).toBe(true);
  expect(testGame.actions.processGameActionResponse).not.toHaveBeenCalled();
  expect(testGame.getState().behavior?.type).toBe('base');

  resolveRemoteAction({ self: { actionResponse } });

  await vi.waitFor(() => expect(testGame.actions.processGameActionResponse).toHaveBeenCalledOnce());
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

  const animation = testGame.getState().animations.values().next().value!;
  expect(animation.type).toBe('banner');
  if (animation.type !== 'banner') {
    throw new Error('Expected a banner animation.');
  }
  await completeAnimation(testGame);

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
