import {
  AttackBuildingAction,
  AttackUnitAction,
  CaptureAction,
  EndTurnAction,
} from '@deities/apollo/action-mutators/ActionMutators.tsx';
import { House, HQ } from '@deities/athena/info/Building.tsx';
import {
  APU,
  Bomber,
  Helicopter,
  Infantry,
  Pioneer,
  SmallTank,
  Zombie,
} from '@deities/athena/info/Unit.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import { HumanPlayer } from '@deities/athena/map/Player.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { Criteria } from '@deities/athena/Objectives.tsx';
import ImmutableMap from '@nkzw/immutable-map';
import { expect, test } from 'vitest';
import executeGameActions from '../executeGameActions.tsx';
import { printGameState } from '../printGameState.tsx';
import { captureGameState, captureOne } from '../screenshot.tsx';
import snapshotEncodedActionResponse from '../snapshotEncodedActionResponse.tsx';

const map = withModifiers(
  MapData.createMap({
    map: [
      1, 1, 1, 3, 2, 1, 1, 1, 3, 1, 1, 2, 3, 1, 3, 1, 1, 1, 1, 1, 1, 2, 3, 1, 1,
    ],
    size: { height: 5, width: 5 },
    teams: [
      {
        id: 1,
        name: '',
        players: [{ funds: 500, id: 1, userId: '1' }],
      },
      {
        id: 2,
        name: '',
        players: [{ funds: 500, id: 2, userId: '4' }],
      },
    ],
  }),
);
const player1 = HumanPlayer.from(map.getPlayer(1), '1');
const player2 = HumanPlayer.from(map.getPlayer(2), '4');

test('game over conditions with HQ', async () => {
  const initialMap = map.copy({
    buildings: map.buildings
      .set(vec(1, 1), HQ.create(player1))
      .set(vec(5, 5), HQ.create(player2)),
    units: map.units
      .set(vec(2, 2), Helicopter.create(player1).setFuel(1))
      .set(vec(4, 4), Helicopter.create(player2).setFuel(1))
      .set(vec(5, 5), Pioneer.create(player2).setFuel(0)),
  });

  const [gameState, gameActionResponse] = executeGameActions(initialMap, [
    EndTurnAction(),
    EndTurnAction(),
  ]);

  const actionResponses = gameActionResponse[1];
  expect(actionResponses![0][0]).toMatchInlineSnapshot(`
    [
      11,
      500,
      1,
      500,
      2,
      1,
    ]
  `);

  expect(snapshotEncodedActionResponse(gameActionResponse))
    .toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      EndTurn { current: { funds: 500, player: 2 }, next: { funds: 500, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }
      BeginTurnGameOver
      GameEnd { objective: null, objectiveId: null, toPlayer: 2 }"
    `);

  const initialState = await captureOne(initialMap, player1.userId);
  printGameState('Base State', initialState);
  expect(initialState).toMatchImageSnapshot();

  (await captureGameState(gameState, player1.userId)).forEach(
    ([actionResponse, , screenshot]) => {
      printGameState(actionResponse, screenshot);
      expect(screenshot).toMatchImageSnapshot();
    },
  );
});

test('game over conditions without HQ', async () => {
  const initialMap = map.copy({
    units: map.units
      .set(vec(2, 2), Helicopter.create(player1).setFuel(1))
      .set(vec(4, 4), Helicopter.create(player2).setFuel(1))
      .set(vec(5, 5), Pioneer.create(player2).setFuel(0)),
  });

  const [gameState, gameActionResponse] = executeGameActions(initialMap, [
    EndTurnAction(),
    EndTurnAction(),
  ]);

  const actionResponses = gameActionResponse[1];
  expect(actionResponses![0][0]).toMatchInlineSnapshot(`
    [
      11,
      500,
      1,
      500,
      2,
      1,
    ]
  `);

  expect(snapshotEncodedActionResponse(gameActionResponse))
    .toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      EndTurn { current: { funds: 500, player: 2 }, next: { funds: 500, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }
      BeginTurnGameOver
      GameEnd { objective: null, objectiveId: null, toPlayer: 2 }"
    `);

  const initialState = await captureOne(initialMap, player1.userId);
  printGameState('Base State', initialState);
  expect(initialState).toMatchImageSnapshot();

  (await captureGameState([gameState.at(-1)!], player1.userId)).forEach(
    ([actionResponse, , screenshot]) => {
      printGameState(actionResponse, screenshot);
      expect(screenshot).toMatchImageSnapshot();
    },
  );
});

test('game over conditions without HQ', async () => {
  const fromA = vec(4, 5);
  const fromB = vec(5, 4);
  const toA = vec(5, 5);
  const toB = vec(5, 3);
  const capturePosition = vec(2, 2);
  const initialMap = map.copy({
    buildings: map.buildings.set(capturePosition, House.create(player2)),
    units: map.units
      .set(capturePosition, Pioneer.create(player1).capture())
      .set(fromA, Helicopter.create(player1).setFuel(100))
      .set(fromB, Helicopter.create(player1).setFuel(100))
      .set(toA, Pioneer.create(player2).setHealth(1))
      .set(toB, Pioneer.create(player2).setHealth(1)),
  });

  const [gameState, gameActionResponse] = executeGameActions(initialMap, [
    CaptureAction(capturePosition),
    AttackUnitAction(fromA, toA),
    AttackUnitAction(fromB, toB),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponse))
    .toMatchInlineSnapshot(`
      "Capture (2,2) { building: House { id: 2, health: 100, player: 1 }, player: 2 }
      AttackUnit (4,5 → 5,5) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 7 ] ] }, unitB: null, chargeA: 0, chargeB: 1 }
      AttackUnit (5,4 → 5,3) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 7 ] ] }, unitB: null, chargeA: 0, chargeB: 2 }
      AttackUnitGameOver { fromPlayer: 2, toPlayer: 1 }
      GameEnd { objective: null, objectiveId: null, toPlayer: 1 }"
    `);

  const initialState = await captureOne(initialMap, player1.userId);
  printGameState('Base State', initialState);
  expect(initialState).toMatchImageSnapshot();

  (await captureGameState([gameState.at(-1)!], player1.userId)).forEach(
    ([actionResponse, , screenshot]) => {
      printGameState(actionResponse, screenshot);
      expect(screenshot).toMatchImageSnapshot();
    },
  );
});

test('game over conditions with only one HQ', async () => {
  const capturePosition = vec(2, 2);
  const initialMap = map.copy({
    buildings: map.buildings.set(capturePosition, HQ.create(player2)),
    units: map.units.set(capturePosition, Pioneer.create(player1).capture()),
  });

  const [, gameActionResponse] = executeGameActions(initialMap, [
    CaptureAction(capturePosition),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponse))
    .toMatchInlineSnapshot(`
      "Capture (2,2) { building: Barracks { id: 12, health: 100, player: 1 }, player: 2 }
      CaptureGameOver { fromPlayer: 2, toPlayer: 1 }
      GameEnd { objective: null, objectiveId: null, toPlayer: 1 }"
    `);
});

test('if the player self-destructs, an end-turn action is issued', async () => {
  const map = withModifiers(
    MapData.createMap({
      map: [1, 1, 1, 1, 1, 1, 1, 1, 1],
      size: { height: 3, width: 3 },
      teams: [
        {
          id: 1,
          name: '',
          players: [{ funds: 500, id: 1, userId: '1' }],
        },
        {
          id: 2,
          name: '',
          players: [{ funds: 500, id: 2, userId: '4' }],
        },
        {
          id: 3,
          name: '',
          players: [{ funds: 500, id: 3, userId: '5' }],
        },
      ],
    }),
  );
  const vecA = vec(1, 1);
  const vecB = vec(2, 1);
  const vecC = vec(3, 3);
  const initialMap = map.copy({
    units: map.units
      .set(vecA, SmallTank.create(player1).setHealth(1))
      .set(vecB, SmallTank.create(player2))
      .set(vecC, SmallTank.create(3)),
  });

  const [, gameActionResponse] = executeGameActions(initialMap, [
    AttackUnitAction(vecA, vecB),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponse))
    .toMatchInlineSnapshot(`
      "AttackUnit (1,1 → 2,1) { hasCounterAttack: true, playerA: 1, playerB: 2, unitA: null, unitB: DryUnit { health: 95, ammo: [ [ 1, 6 ] ] }, chargeA: 9, chargeB: 18 }
      AttackUnitGameOver { fromPlayer: 1, toPlayer: 2 }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }"
    `);
});

test('destroying a neutral unit does not end or crash the game', async () => {
  const map = withModifiers(
    MapData.createMap({
      map: [1, 1, 1, 1, 1, 1, 1, 1, 1],
      size: { height: 3, width: 3 },
    }),
  );
  const vecA = vec(1, 1);
  const vecB = vec(2, 1);
  const initialMap = map.copy({
    units: map.units
      .set(vecA, SmallTank.create(player1))
      .set(vecB, Pioneer.create(0).setHealth(1)),
  });

  const [, gameActionResponse] = executeGameActions(initialMap, [
    AttackUnitAction(vecA, vecB),
  ]);

  expect(
    snapshotEncodedActionResponse(gameActionResponse),
  ).toMatchInlineSnapshot(
    `"AttackUnit (1,1 → 2,1) { hasCounterAttack: false, playerA: 1, playerB: 0, unitA: DryUnit { health: 100, ammo: [ [ 1, 6 ] ] }, unitB: null, chargeA: 0, chargeB: null }"`,
  );
});

test('destroying a building with a neutral unit does not end or crash the game', async () => {
  const map = withModifiers(
    MapData.createMap({
      map: [1, 1, 1, 1, 1, 1, 1, 1, 1],
      size: { height: 3, width: 3 },
    }),
  );
  const vecA = vec(1, 1);
  const vecB = vec(2, 1);
  const initialMap = map.copy({
    buildings: map.buildings.set(vecB, House.create(2).setHealth(1)),
    units: map.units
      .set(vecA, SmallTank.create(player1))
      .set(vecB, Pioneer.create(0)),
  });

  const [, gameActionResponse] = executeGameActions(initialMap, [
    AttackBuildingAction(vecA, vecB),
  ]);

  expect(
    snapshotEncodedActionResponse(gameActionResponse),
  ).toMatchInlineSnapshot(
    `"AttackBuilding (1,1 → 2,1) { hasCounterAttack: false, playerA: 1, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 6 ] ] }, unitC: null, chargeA: null, chargeB: 1200, chargeC: 100 }"`,
  );
});

test('win the game when converting a unit as a Zombie', async () => {
  const map = withModifiers(
    MapData.createMap({
      map: [1, 1, 1, 1, 1, 1, 1, 1, 1],
      size: { height: 3, width: 3 },
    }),
  );
  const vecA = vec(1, 1);
  const vecB = vec(2, 1);
  const initialMap = map.copy({
    units: map.units
      .set(vecA, Zombie.create(player1))
      .set(vecB, Infantry.create(2)),
  });

  const [, gameActionResponse] = executeGameActions(initialMap, [
    AttackUnitAction(vecA, vecB),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponse))
    .toMatchInlineSnapshot(`
      "AttackUnit (1,1 → 2,1) { hasCounterAttack: true, playerA: 1, playerB: 2, unitA: DryUnit { health: 75, ammo: [ [ 1, 4 ] ] }, unitB: DryUnit { health: 35 }, chargeA: 142, chargeB: 130 }
      AttackUnitGameOver { fromPlayer: 2, toPlayer: 1 }
      GameEnd { objective: null, objectiveId: null, toPlayer: 1 }"
    `);
});

test('lose the game when the only unit attacks a building with a Zombie on it', async () => {
  const map = withModifiers(
    MapData.createMap({
      map: [1, 1, 1, 1, 1, 1, 1, 1, 1],
      size: { height: 3, width: 3 },
    }),
  );
  const vecA = vec(1, 1);
  const vecB = vec(2, 1);
  const initialMap = map.copy({
    buildings: map.buildings.set(vecB, House.create(2)),
    units: map.units
      .set(vecA, SmallTank.create(player1))
      .set(vecB, Zombie.create(2)),
  });

  const [, gameActionResponse] = executeGameActions(initialMap, [
    AttackBuildingAction(vecA, vecB),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponse))
    .toMatchInlineSnapshot(`
      "AttackBuilding (1,1 → 2,1) { hasCounterAttack: true, playerA: 1, building: House { id: 2, health: 40, player: 2 }, playerC: 2, unitA: DryUnit { health: 93, ammo: [ [ 1, 6 ] ] }, unitC: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, chargeA: 13, chargeB: 0, chargeC: 0 }
      AttackUnitGameOver { fromPlayer: 1, toPlayer: 2 }
      GameEnd { objective: null, objectiveId: null, toPlayer: 2 }"
    `);
});

test('lose game if you destroy the last unit of the opponent but miss your own win condition', () => {
  const initialMap = withModifiers(
    MapData.createMap({
      map: [1, 8, 1, 1, 1, 1, 1, 1, 1],
      size: {
        height: 3,
        width: 3,
      },
      teams: [
        { id: 1, name: '', players: [{ funds: 0, id: 1, userId: '1' }] },
        { id: 2, name: '', players: [{ funds: 0, id: 2, name: 'Bot' }] },
      ],
    }),
  );

  const from = vec(1, 1);
  const to = vec(2, 1);
  const map = initialMap.copy({
    buildings: initialMap.buildings.set(
      to,
      House.create(2, { label: 1 }).setHealth(1),
    ),
    config: initialMap.config.copy({
      objectives: ImmutableMap([
        [0, { hidden: false, type: Criteria.Default }],
        [
          1,
          {
            hidden: false,
            label: new Set([1]),
            optional: false,
            players: [1],
            type: Criteria.CaptureLabel,
          },
        ],
      ]),
    }),
    units: initialMap.units.set(from, APU.create(1)).set(to, Bomber.create(2)),
  });

  const [, gameActionResponse] = executeGameActions(map, [
    AttackBuildingAction(from, to),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponse))
    .toMatchInlineSnapshot(`
      "AttackBuilding (1,1 → 2,1) { hasCounterAttack: false, playerA: 1, building: null, playerC: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 5 ] ] }, unitC: null, chargeA: null, chargeB: 1200, chargeC: 2000 }
      GameEnd { objective: { completed: Set(0) {}, hidden: false, label: [ 1 ], optional: false, players: [ 1 ], reward: null, type: 1 }, objectiveId: 1, toPlayer: 2 }"
    `);
});
