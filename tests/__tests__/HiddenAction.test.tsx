import {
  AttackBuildingAction,
  CompleteUnitAction,
  CreateBuildingAction,
  CreateUnitAction,
  EndTurnAction,
} from '@deities/apollo/action-mutators/ActionMutators.tsx';
import executeGameAction from '@deities/apollo/actions/executeGameAction.tsx';
import { House, VerticalBarrier } from '@deities/athena/info/Building.tsx';
import {
  HeavyArtillery,
  Pioneer,
  SmallTank,
} from '@deities/athena/info/Unit.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import { Biome } from '@deities/athena/map/Biome.tsx';
import { HumanPlayer } from '@deities/athena/map/Player.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import DionysusAlpha from '@deities/dionysus/DionysusAlpha.tsx';
import { expect, test } from 'vitest';
import executeGameActions from '../executeGameActions.tsx';
import { printGameState } from '../printGameState.tsx';
import { captureGameState, captureOne } from '../screenshot.tsx';
import snapshotEncodedActionResponse from '../snapshotEncodedActionResponse.tsx';
import snapshotGameState from '../snapshotGameState.tsx';

const map = withModifiers(
  MapData.createMap({
    buildings: [
      [
        1,
        1,
        {
          h: 100,
          i: 1,
          p: 1,
        },
      ],
      [
        5,
        5,
        {
          h: 100,
          i: 1,
          p: 2,
        },
      ],
    ],
    config: {
      fog: true,
    },
    map: [
      1, 8, 4, 8, 2, 8, 4, 4, 4, 8, 4, 4, 3, 4, 4, 8, 4, 4, 4, 8, 2, 8, 4, 8, 1,
    ],
    size: {
      height: 5,
      width: 5,
    },
    teams: [
      {
        id: 1,
        name: '',
        players: [
          {
            funds: 500,
            id: 1,
            userId: 'User-1',
          },
        ],
      },
      {
        id: 2,
        name: '',
        players: [
          {
            funds: 500,
            id: 2,
            userId: 'User-4',
          },
        ],
      },
    ],
    units: [
      [
        1,
        1,
        {
          g: 40,
          h: 100,
          i: 1,
          p: 2,
        },
      ],
      [
        2,
        1,
        {
          g: 40,
          h: 100,
          i: 1,
          p: 1,
        },
      ],
      [
        1,
        2,
        {
          g: 40,
          h: 100,
          i: 1,
          p: 1,
        },
      ],
      [
        5,
        4,
        {
          g: 40,
          h: 100,
          i: 1,
          p: 2,
        },
      ],
      [
        4,
        5,
        {
          g: 40,
          h: 100,
          i: 1,
          p: 2,
        },
      ],
    ],
  }),
);
const player1 = HumanPlayer.from(map.getPlayer(1), 'User-1');

test('create building and create unit actions', async () => {
  const [gameState, gameActionResponse] = executeGameActions(map, [
    EndTurnAction(),
    CreateBuildingAction(vec(5, 4), 2),
    CompleteUnitAction(vec(1, 1)),
    CreateBuildingAction(vec(4, 5), 2),
    CreateUnitAction(vec(5, 5), 1, vec(5, 5)),
    EndTurnAction(),
  ]);

  expect(snapshotGameState(gameState)).toMatchInlineSnapshot(`
    "EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: null, supply: null, miss: null }
    CreateBuilding (5,4) { building: House { id: 2, health: 100, player: 2, completed: true } }
    CompleteUnit (1,1)
    CreateBuilding (4,5) { building: House { id: 2, health: 100, player: 2, completed: true } }
    CreateUnit (5,5 → 5,5) { unit: Pioneer { id: 1, health: 100, player: 2, fuel: 40, moved: true, name: 'Sam', completed: true }, free: false, skipBehaviorRotation: false }
    EndTurn { current: { funds: 200, player: 2 }, next: { funds: 500, player: 1 }, round: 2, rotatePlayers: null, supply: null, miss: null }"
  `);
  expect(snapshotEncodedActionResponse(gameActionResponse))
    .toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      CreateBuilding (5,4) { building: House { id: 2, health: 100, player: 0 } }
      CompleteUnit (1,1)
      CreateBuilding (4,5) { building: House { id: 2, health: 100, player: 0 } }
      EndTurn { current: { funds: 200, player: 2 }, next: { funds: 500, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }"
    `);

  const initialState = await captureOne(
    map.copy({ config: map.config.copy({ fog: false }) }),
    player1.userId,
  );
  printGameState('Base State', initialState);
  expect(initialState).toMatchImageSnapshot();

  // Skip the first and last `EndTurnAction`s.
  (await captureGameState(gameState.slice(1, -1), player1.userId)).forEach(
    ([actionResponse, , screenshot]) => {
      printGameState(actionResponse, screenshot);
      expect(screenshot).toMatchImageSnapshot();
    },
  );
});

test('destroy hidden building', async () => {
  const from = vec(4, 4);
  const to = vec(4, 5);
  const newMap = map.copy({
    buildings: map.buildings.set(to, House.create(0).setHealth(1)),
    units: map.units.set(from, SmallTank.create(map.getPlayer(2))).delete(to),
  });

  const [gameState, gameActionResponse] = executeGameActions(newMap, [
    EndTurnAction(),
    AttackBuildingAction(from, to),
    EndTurnAction(),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponse))
    .toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      HiddenDestroyedBuilding (→ 4,5)
      EndTurn { current: { funds: 500, player: 2 }, next: { funds: 500, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }"
    `);

  const initialState = await captureOne(newMap, player1.userId);
  printGameState('Base State', initialState);
  expect(initialState).toMatchImageSnapshot();

  // Only capture the second state change as the end state will look the same in
  (await captureGameState([gameState[2]], player1.userId)).forEach(
    ([actionResponse, , screenshot]) => {
      printGameState(actionResponse, screenshot);
      expect(screenshot).toMatchImageSnapshot();
    },
  );
});

test('do not attempt attacking a building via long-range', async () => {
  const from = vec(4, 4);
  const to = vec(2, 3);
  const map = MapData.createMap({
    config: {
      biome: Biome.Swamp,
      fog: true,
    },
    map: [
      4, 4, 4, 4, 4, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 2, 1, 2, 1, 2, 1, 1, 2, 1, 1,
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
        players: [{ funds: 0, id: 2, name: 'Bot' }],
      },
    ],
  });

  const newMap = withModifiers(
    map.copy({
      buildings: map.buildings.set(to, VerticalBarrier.create(0).setHealth(1)),
      units: map.units
        .set(from, HeavyArtillery.create(2))
        .set(vec(1, 1), Pioneer.create(1)),
    }),
  );

  expect(() => {
    executeGameAction(
      newMap,
      newMap.createVisionObject(player1),
      new Map(),
      EndTurnAction(),
      DionysusAlpha,
    );
  }).not.toThrow();
});
