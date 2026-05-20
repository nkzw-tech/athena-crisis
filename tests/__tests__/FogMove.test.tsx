import { EndTurnAction } from '@deities/apollo/action-mutators/ActionMutators.tsx';
import { execute, type Action } from '@deities/apollo/Action.tsx';
import executeGameAction from '@deities/apollo/actions/executeGameAction.tsx';
import { type GameActionResponse } from '@deities/apollo/Types.tsx';
import { House } from '@deities/athena/info/Building.tsx';
import { Forest, Plain, Sea } from '@deities/athena/info/Tile.tsx';
import { AntiAir, APU, Artillery, Infantry } from '@deities/athena/info/Unit.tsx';
import { Fog } from '@deities/athena/map/PlainMap.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { Visibility, type VisionT } from '@deities/athena/Vision.tsx';
import AIRegistry from '@deities/dionysus/AIRegistry.tsx';
import ImmutableMap from '@nkzw/immutable-map';
import { expect, test } from 'vitest';
import syncMoveAction from '../../hera/behavior/move/syncMoveAction.tsx';
import { type Actions, type State, type StateLike } from '../../hera/Types.tsx';
import snapshotGameState from '../snapshotGameState.tsx';

const rawMap = MapData.createMap({
  config: {
    fog: true,
  },
  map: [
    1,
    Forest.id,
    1,
    Forest.id,
    1,
    Forest.id,
    1,
    Forest.id,
    1,
    1,
    Forest.id,
    Forest.id,
    1,
    1,
    1,
    Forest.id,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
  ],
  size: {
    height: 5,
    width: 5,
  },
  teams: [
    {
      id: 1,
      name: '',
      players: [{ funds: 0, id: 1, userId: 'User-1' }],
    },
    {
      id: 2,
      name: '',
      players: [{ funds: 1000, id: 2, name: 'Bot' }],
    },
  ],
});

const vecA = vec(1, 1);
const vecB = vec(4, 5);
const vecC = vec(5, 5);

const initialMap = rawMap.copy({
  buildings: rawMap.buildings.set(vecC, House.create(1)),
  units: rawMap.units
    .set(vecA, AntiAir.create(2))
    .set(
      vecB,
      APU.create(2)
        .setFuel(0)
        .setAmmo(new Map([...(APU.getAmmunitionSupply() || [])].map(([id]) => [id, 0]))),
    )
    .set(vecC, Infantry.create(1)),
});

const player1 = initialMap.getPlayer(1);

test('units will hide in hidden fields in fog', async () => {
  const map = initialMap;
  const [, , gameState] = await executeGameAction(
    map,
    map.createVisionObject(player1),
    new Map(),
    EndTurnAction(),
    AIRegistry,
  );

  expect(snapshotGameState(gameState)).toMatchInlineSnapshot(`
    "Move (1,1 → 4,1) { fuel: 25, completed: null, path: [2,1 → 3,1 → 4,1] }
    EndTurn { current: { funds: 1000, player: 2 }, next: { funds: 100, player: 1 }, round: 2, rotatePlayers: null, supply: null, miss: null }"
  `);

  // Without fog the unit will move further.
  const [, , secondGameState] = await executeGameAction(
    map.copy({ config: map.config.copy({ fog: Fog.None }) }),
    map.createVisionObject(player1),
    new Map(),
    EndTurnAction(),
    AIRegistry,
  );

  expect(snapshotGameState(secondGameState)).toMatchInlineSnapshot(`
    "Move (1,1 → 5,1) { fuel: 24, completed: null, path: [2,1 → 3,1 → 4,1 → 5,1] }
    EndTurn { current: { funds: 1000, player: 2 }, next: { funds: 100, player: 1 }, round: 2, rotatePlayers: null, supply: null, miss: null }"
  `);
});

test('does not hide in hidden fields too far from the target', async () => {
  const map = initialMap.copy({
    map: [1, Forest.id, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  });

  const [, , gameState] = await executeGameAction(
    map,
    map.createVisionObject(player1),
    new Map(),
    EndTurnAction(),
    AIRegistry,
  );

  expect(snapshotGameState(gameState)).toMatchInlineSnapshot(`
    "Move (1,1 → 4,4) { fuel: 24, completed: null, path: [1,2 → 1,3 → 1,4 → 2,4 → 3,4 → 4,4] }
    EndTurn { current: { funds: 1000, player: 2 }, next: { funds: 100, player: 1 }, round: 2, rotatePlayers: null, supply: null, miss: null }"
  `);
});

test('sync exploration moves with no visible prefix apply the optimistic map', async () => {
  const from = vec(1, 1);
  const to = vec(2, 1);
  const map = MapData.createMap({
    config: {
      fog: Fog.Exploration,
    },
    map: [Plain.id, Plain.id],
    size: { height: 1, width: 2 },
    teams: [
      {
        id: 1,
        name: '',
        players: [{ funds: 0, id: 1, userId: 'User-1' }],
      },
    ],
    units: [[1, 1, Artillery.create(1).toJSON()]],
  });
  const vision: VisionT = {
    apply: (map) => map,
    currentViewer: 1,
    getVisibility: () => Visibility.Unexplored,
    isExplored: () => false,
    isVisible: () => false,
  };
  let state = {
    animations: ImmutableMap(),
    lastActionResponse: null,
    map,
    vision,
  } as State;
  let onCompleteCalled = false;
  const actions = {
    action: (state: State, action: Action) => {
      const result = execute(state.map, state.vision, action)!;
      return [Promise.resolve({ self: { actionResponse: result[0] } }), result[1], result[0]];
    },
    processGameActionResponse: async (gameActionResponse: GameActionResponse) => {
      state = {
        ...state,
        lastActionResponse: gameActionResponse.self?.actionResponse || null,
      };
      return state;
    },
    throwError: (error: Error) => {
      throw error;
    },
    update: async (newState: StateLike | null | ((state: State) => StateLike | null)) => {
      const update = typeof newState === 'function' ? newState(state) : newState;
      state = { ...state, ...update };
      return state;
    },
  } as unknown as Actions;

  const stateUpdate = syncMoveAction(
    actions,
    from,
    to,
    new Map(),
    state,
    (state) => {
      onCompleteCalled = true;
      return state;
    },
    [to],
  );

  expect(stateUpdate.map?.units.has(from)).toBe(false);
  expect(stateUpdate.map?.units.get(to)?.hasMoved()).toBe(true);

  state = { ...state, ...stateUpdate };
  await Promise.resolve();
  await Promise.resolve();

  expect(onCompleteCalled).toBe(true);
});

test('sync exploration moves show a generic blocked animation for veiled terrain blockers', async () => {
  const from = vec(1, 1);
  const partial = vec(2, 1);
  const blockedBy = vec(3, 1);
  const to = vec(4, 1);
  const map = MapData.createMap({
    config: {
      fog: Fog.Exploration,
    },
    map: [Plain.id, Plain.id, Sea.id, Plain.id],
    size: { height: 1, width: 4 },
    teams: [
      {
        id: 1,
        name: '',
        players: [{ funds: 0, id: 1, userId: 'User-1' }],
      },
    ],
    units: [[1, 1, Artillery.create(1).toJSON()]],
  });
  const vision: VisionT = {
    apply: (map) => map,
    currentViewer: 1,
    getVisibility: (map, vector) =>
      vector.equals(blockedBy) ? Visibility.Unexplored : Visibility.Visible,
    isExplored: (map, vector) => !vector.equals(blockedBy),
    isVisible: (map, vector) => vector.equals(partial) || vector.equals(from),
  };
  let state = {
    animations: ImmutableMap(),
    lastActionResponse: null,
    map,
    vision,
  } as State;
  let frame: (() => void) | null = null;
  const updateResolvers: Array<() => void> = [];
  const waitForUpdate = () =>
    new Promise<void>((resolve) => {
      updateResolvers.push(resolve);
    });
  const actions = {
    action: (state: State, action: Action) => {
      const result = execute(state.map, state.vision, action)!;
      return [Promise.resolve({ self: { actionResponse: result[0] } }), result[1], result[0]];
    },
    processGameActionResponse: async (gameActionResponse: GameActionResponse) => {
      state = {
        ...state,
        lastActionResponse: gameActionResponse.self?.actionResponse || null,
      };
      return state;
    },
    requestFrame: (fn: () => void) => {
      frame = fn;
    },
    throwError: (error: Error) => {
      throw error;
    },
    update: async (newState: StateLike | null | ((state: State) => StateLike | null)) => {
      const update = typeof newState === 'function' ? newState(state) : newState;
      state = { ...state, ...update };
      updateResolvers.shift()?.();
      return state;
    },
  } as unknown as Actions;

  const firstUpdate = syncMoveAction(actions, from, to, new Map(), state, (state) => state, [
    partial,
    blockedBy,
    to,
  ]);
  state = { ...state, ...firstUpdate };

  let moveAnimation = state.animations.get(from);
  expect(moveAnimation?.type).toBe('move');
  const firstRemoteUpdate = waitForUpdate();
  if (moveAnimation?.type === 'move') {
    moveAnimation.onComplete(state);
  }
  await firstRemoteUpdate;

  moveAnimation = state.animations.get(from);
  expect(moveAnimation?.type).toBe('move');
  const secondRemoteUpdate = waitForUpdate();
  if (moveAnimation?.type === 'move') {
    moveAnimation.onComplete(state);
  }
  await secondRemoteUpdate;

  expect(frame).not.toBeNull();
  const blockedUpdate = waitForUpdate();
  (frame as unknown as () => void)();
  await blockedUpdate;

  const blockedAnimation = [...state.animations.values()].find(
    (animation) => animation.type === 'flash',
  );
  expect(blockedAnimation).toMatchObject({
    children: 'Blocked!',
    position: blockedBy,
    type: 'flash',
  });
});
