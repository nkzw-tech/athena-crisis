import {
  CreateBuildingAction,
  EndTurnAction,
} from '@deities/apollo/action-mutators/ActionMutators.tsx';
import { type GameActionResponse } from '@deities/apollo/Types.tsx';
import { Factory, House } from '@deities/athena/info/Building.tsx';
import { StormCloud } from '@deities/athena/info/Tile.tsx';
import { Infantry, Pioneer } from '@deities/athena/info/Unit.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import { Fog } from '@deities/athena/map/PlainMap.tsx';
import { HumanPlayer } from '@deities/athena/map/Player.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { Visibility, type VisionT } from '@deities/athena/Vision.tsx';
import ImmutableMap from '@nkzw/immutable-map';
import { expect, test } from 'vitest';
import { setBaseClass } from '../../hera/behavior/Behavior.tsx';
import { addCreateBuildingAnimation } from '../../hera/behavior/createBuilding/createBuildingAction.tsx';
import NullBehavior from '../../hera/behavior/NullBehavior.tsx';
import { type Actions, type State, type StateLike } from '../../hera/Types.tsx';
import executeGameActions from '../executeGameActions.tsx';
import { printGameState } from '../printGameState.tsx';
import { captureGameActionResponse } from '../screenshot.tsx';

const map = withModifiers(
  MapData.createMap({
    config: {
      fog: true,
    },
    map: [
      8,
      1,
      3,
      [1, StormCloud.id],
      1,
      1,
      1,
      1,
      3,
      [1, StormCloud.id],
      1,
      3,
      1,
      1,
      1,
      3,
      1,
      3,
      1,
      1,
      2,
      2,
      2,
      8,
      8,
    ],
    size: { height: 5, width: 5 },
    teams: [
      { id: 1, name: '', players: [{ funds: 500, id: 1, userId: '1' }] },
      { id: 2, name: '', players: [{ funds: 500, id: 2, userId: '2' }] },
    ],
    units: [
      [1, 1, Pioneer.create(1).toJSON()],
      [5, 1, Infantry.create(1).toJSON()],
      [5, 5, Pioneer.create(2).toJSON()],
      [4, 5, Pioneer.create(2).toJSON()],
    ],
  }),
);
const player1 = HumanPlayer.from(map.getPlayer(1), '1');

test('buildings appear properly when they are created in fog', async () => {
  const [, gameActionResponse] = await executeGameActions(map, [
    CreateBuildingAction(vec(1, 1), House.id),
    EndTurnAction(),
    CreateBuildingAction(vec(5, 5), Factory.id),
    CreateBuildingAction(vec(4, 5), House.id),
    EndTurnAction(),
  ]);
  const screenshot = await captureGameActionResponse(map, gameActionResponse, player1.userId);
  printGameState('Last State', screenshot);
  expect(screenshot).toMatchImageSnapshot();
});

test('skips create building animations for veiled fields', async () => {
  setBaseClass(NullBehavior);

  const position = vec(1, 1);
  const building = House.create(0);
  const map = MapData.createMap({
    config: {
      fog: Fog.Exploration,
    },
    map: [1],
    size: { height: 1, width: 1 },
    teams: [{ id: 1, name: '', players: [{ funds: 0, id: 1, userId: '1' }] }],
  });
  const newMap = map.copy({
    buildings: map.buildings.set(position, building),
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
  const frames: Array<() => Promise<void> | void> = [];
  let onCompleteCalled = false;
  const actions = {
    processGameActionResponse: async (gameActionResponse: GameActionResponse) => {
      state = {
        ...state,
        lastActionResponse: gameActionResponse.self?.actionResponse || null,
      };
      return state;
    },
    requestFrame: (fn: () => void) => {
      frames.push(fn);
    },
    update: async (newState: StateLike | null | ((state: State) => StateLike | null)) => {
      const update = typeof newState === 'function' ? newState(state) : newState;
      state = { ...state, ...update };
      return state;
    },
  } as unknown as Actions;

  const stateUpdate = addCreateBuildingAnimation(
    actions,
    state,
    Promise.resolve({
      self: {
        actionResponse: {
          building,
          free: false,
          from: position,
          type: 'CreateBuilding',
        },
      },
    }),
    newMap,
    {
      building,
      free: false,
      from: position,
      type: 'CreateBuilding',
    },
    (state) => {
      onCompleteCalled = true;
      return state;
    },
  );

  expect(stateUpdate?.animations).toBeUndefined();
  expect(stateUpdate?.map).toBe(newMap);

  state = { ...state, ...stateUpdate };
  const frame = frames.at(0);
  expect(frame).not.toBeNull();
  if (!frame) {
    throw new Error('Expected a frame callback.');
  }
  await frame();

  expect(onCompleteCalled).toBe(true);
  expect(state.lastActionResponse?.type).toBe('CreateBuilding');
});
