import {
  AttackUnitAction,
  EndTurnAction,
  MoveAction,
} from '@deities/apollo/action-mutators/ActionMutators.tsx';
import { Airbase, Shelter } from '@deities/athena/info/Building.tsx';
import {
  Helicopter,
  Jetpack,
  Pioneer,
  SmallTank,
} from '@deities/athena/info/Unit.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import { HumanPlayer } from '@deities/athena/map/Player.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { expect, test } from 'vitest';
import executeGameActions from '../executeGameActions.tsx';
import { printGameState } from '../printGameState.tsx';
import { captureGameState, captureOne } from '../screenshot.tsx';
import snapshotEncodedActionResponse from '../snapshotEncodedActionResponse.tsx';

const initialMap = withModifiers(
  MapData.createMap({
    buildings: [
      [1, 1, { h: 100, i: 1, p: 1 }],
      [5, 5, { h: 100, i: 1, p: 2 }],
    ],
    config: {
      fog: true,
    },
    map: [
      1, 1, 1, 3, 2, 1, 1, 1, 3, 1, 1, 2, 3, 1, 3, 1, 1, 1, 1, 1, 1, 2, 3, 1, 1,
    ],
    modifiers: [
      0, 0, 0, 56, 0, 0, 0, 0, 55, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0,
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
        players: [{ funds: 500, id: 2, userId: '2' }],
      },
    ],
    units: [
      [
        2,
        3,
        {
          a: [
            [1, 0],
            [2, 0],
          ],
          g: 0,
          h: 100,
          i: 10,
          p: 2,
        },
      ],
      [1, 4, { g: 40, h: 100, i: 1, p: 1 }],
      [5, 1, { g: 60, h: 100, i: 6, p: 2 }],
      [4, 2, { g: 40, h: 100, i: 1, p: 1 }],
      [2, 4, { g: 60, h: 100, i: 6, p: 2 }],
      [
        5,
        2,
        {
          a: [
            [1, 0],
            [2, 0],
          ],
          g: 0,
          h: 100,
          i: 10,
          p: 2,
        },
      ],
      [
        3,
        4,
        {
          a: [
            [1, 0],
            [2, 0],
          ],
          g: 0,
          h: 100,
          i: 10,
          p: 2,
        },
      ],
      [
        2,
        5,
        {
          a: [
            [1, 0],
            [2, 0],
          ],
          g: 0,
          h: 100,
          i: 10,
          p: 2,
        },
      ],
    ],
  }),
);
const player1 = HumanPlayer.from(initialMap.getPlayer(1), '1');

test('supply works correctly for units when a turn ends in fog', async () => {
  const [[[endTurnActionResponse], ...gameState], gameActionResponse] =
    executeGameActions(initialMap, [
      EndTurnAction(),
      MoveAction(vec(2, 5), vec(1, 5)),
      AttackUnitAction(vec(1, 5), vec(1, 4)),
      MoveAction(vec(2, 3), vec(1, 3)),
      AttackUnitAction(vec(1, 3), vec(1, 4)),
      MoveAction(vec(3, 4), vec(4, 3)),
      AttackUnitAction(vec(4, 3), vec(4, 2)),
      AttackUnitAction(vec(5, 2), vec(4, 2)),
    ]);

  expect(endTurnActionResponse.type).toBe('EndTurn');

  expect(snapshotEncodedActionResponse(gameActionResponse))
    .toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: [5,2], miss: false }
      HiddenMove { path: [2,5 → 1,5], completed: false, fuel: 49, unit: Humvee { id: 10, health: 100, player: 2, fuel: 50, ammo: [ [ 1, 7 ], [ 2, 5 ] ] } }
      AttackUnit (1,5 → 1,4) { hasCounterAttack: false, playerA: 2, playerB: 1, unitA: DryUnit { health: 100, ammo: [ [ 1, 6 ], [ 2, 5 ] ] }, unitB: DryUnit { health: 19 }, chargeA: 26, chargeB: 81 }
      HiddenMove { path: [2,3 → 1,3], completed: false, fuel: 49, unit: Humvee { id: 10, health: 100, player: 2, fuel: 50, ammo: [ [ 1, 7 ], [ 2, 5 ] ] } }
      AttackUnit (1,3 → 1,4) { hasCounterAttack: false, playerA: 2, playerB: 1, unitA: DryUnit { health: 100, ammo: [ [ 1, 6 ], [ 2, 5 ] ] }, unitB: null, chargeA: 32, chargeB: 100 }
      Move (3,4 → 4,3) { fuel: 48, completed: false, path: [4,4 → 4,3] }
      AttackUnit (4,3 → 4,2) { hasCounterAttack: false, playerA: 2, playerB: 1, unitA: DryUnit { health: 100, ammo: [ [ 1, 6 ], [ 2, 5 ] ] }, unitB: DryUnit { health: 19 }, chargeA: 58, chargeB: 181 }
      AttackUnit (5,2 → 4,2) { hasCounterAttack: false, playerA: 2, playerB: 1, unitA: DryUnit { health: 100, ammo: [ [ 1, 6 ], [ 2, 5 ] ] }, unitB: null, chargeA: 64, chargeB: 200 }
      AttackUnitGameOver { fromPlayer: 1, toPlayer: 2 }
      GameEnd { objective: null, objectiveId: null, toPlayer: 2 }"
    `);

  const initialState = await captureOne(initialMap, player1.userId);
  printGameState('Base State', initialState);
  expect(initialState).toMatchImageSnapshot();

  // Ignore the final state.
  (await captureGameState(gameState.slice(0, -1), player1.userId)).forEach(
    ([actionResponse, , screenshot]) => {
      printGameState(actionResponse, screenshot);
      expect(screenshot).toMatchImageSnapshot();
    },
  );
});

test('heal works correctly for units when placed on a campsite', async () => {
  const vecA = vec(1, 1);
  const vecB = vec(1, 2);
  const vecC = vec(1, 3);
  const vecD = vec(1, 5);
  const vecE = vec(2, 1);
  const map = initialMap.copy({
    buildings: initialMap.buildings
      .set(vecA, Shelter.create(2))
      .set(vecB, Shelter.create(2))
      .set(vecC, Shelter.create(1))
      .set(vecD, Airbase.create(2))
      .set(vecE, Airbase.create(2)),
    units: initialMap.units
      .set(vecA, Pioneer.create(2).setHealth(1))
      .set(vecB, SmallTank.create(2).setHealth(1))
      .set(vecC, Jetpack.create(2).setHealth(1))
      .set(vecD, Helicopter.create(2).setFuel(1).setHealth(1))
      .set(vecE, Helicopter.create(2).setFuel(1)),
  });
  const [gameState, gameActionResponse] = executeGameActions(map, [
    EndTurnAction(),
  ]);

  expect(
    snapshotEncodedActionResponse(gameActionResponse),
  ).toMatchInlineSnapshot(
    `"EndTurn { current: { funds: 500, player: 1 }, next: { funds: 600, player: 2 }, round: 1, rotatePlayers: false, supply: [5,2], miss: false }"`,
  );

  const lastMap = gameState.at(-1)![1];
  expect(lastMap.units.get(vecA)!.health).toBeGreaterThan(
    map.units.get(vecA)!.health,
  );
  expect(lastMap.units.get(vecB)!.health).toBe(map.units.get(vecB)!.health);
  expect(lastMap.units.get(vecC)!.health).toBe(map.units.get(vecC)!.health);
  expect(lastMap.units.get(vecD)!.health).toBeGreaterThan(
    map.units.get(vecD)!.health,
  );
  expect(lastMap.units.get(vecD)!.fuel).toBeGreaterThan(
    map.units.get(vecD)!.fuel,
  );
  expect(lastMap.units.get(vecE)!.fuel).toBeGreaterThan(
    map.units.get(vecE)!.fuel,
  );
});
