import {
  AttackUnitAction,
  CreateUnitAction,
  EndTurnAction,
  MoveAction,
} from '@deities/apollo/action-mutators/ActionMutators.tsx';
import { SpawnPlatform } from '@deities/athena/info/Building.tsx';
import {
  Space,
  Teleporter1,
  Teleporter2,
  Teleporter3,
} from '@deities/athena/info/Tile.tsx';
import {
  Flamethrower,
  Infantry,
  Jeep,
  Medic,
  Pioneer,
  RocketLauncher,
  Saboteur,
  Sniper,
} from '@deities/athena/info/Unit.tsx';
import updatePlayer from '@deities/athena/lib/updatePlayer.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import { Biome } from '@deities/athena/map/Biome.tsx';
import { Bot } from '@deities/athena/map/Player.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { expect, test } from 'vitest';
import executeGameActions from '../executeGameActions.tsx';
import { printGameState } from '../printGameState.tsx';
import { captureOne } from '../screenshot.tsx';
import snapshotEncodedActionResponse from '../snapshotEncodedActionResponse.tsx';

const initialMap = withModifiers(
  MapData.createMap({
    config: { biome: Biome.Spaceship },
    map: [
      Teleporter1.id,
      1,
      Teleporter2.id,
      1,
      Teleporter1.id,
      1,
      1,
      1,
      1,
      1,
      Teleporter3.id,
      1,
      1,
      1,
      Teleporter3.id,
      1,
      1,
      1,
      1,
      1,
      Teleporter1.id,
      1,
      Teleporter2.id,
      1,
      Teleporter1.id,
    ],
    size: { height: 5, width: 5 },
    teams: [
      { id: 1, name: '', players: [{ funds: 500, id: 1, userId: '1' }] },
      { id: 2, name: '', players: [{ funds: 500, id: 2, userId: '4' }] },
    ],
  }),
);

test('swaps units in a clockwise rotation when entering a teleporter', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(3, 1);
  const v3 = vec(5, 1);
  const v4 = vec(1, 3);
  const v5 = vec(5, 3);
  const v6 = vec(1, 5);
  const v7 = vec(3, 5);
  const v8 = vec(5, 5);
  const v9 = vec(3, 3);

  const mapA = initialMap.copy({
    units: initialMap.units.set(v9, Flamethrower.create(1)),
  });

  const [, gameActionResponseA] = await executeGameActions(mapA, [
    MoveAction(v9, v1),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
    "Move (3,3 → 1,1) { fuel: 26, completed: false, path: [3,2 → 2,2 → 2,1 → 1,1] }
    Swap { source: 1,1, sourceUnit: Flamethrower { id: 15, health: 100, player: 1, fuel: 26, ammo: [ [ 1, 4 ] ], moved: true }, target: 5,1, targetUnit: null }"
  `);

  const [, gameActionResponseB] = await executeGameActions(mapA, [
    MoveAction(v9, v3),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseB))
    .toMatchInlineSnapshot(`
    "Move (3,3 → 5,1) { fuel: 26, completed: false, path: [3,2 → 4,2 → 5,2 → 5,1] }
    Swap { source: 5,1, sourceUnit: Flamethrower { id: 15, health: 100, player: 1, fuel: 26, ammo: [ [ 1, 4 ] ], moved: true }, target: 5,5, targetUnit: null }"
  `);

  const [, gameActionResponseC] = await executeGameActions(mapA, [
    MoveAction(v9, v8),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseC))
    .toMatchInlineSnapshot(`
    "Move (3,3 → 5,5) { fuel: 26, completed: false, path: [4,3 → 4,4 → 5,4 → 5,5] }
    Swap { source: 5,5, sourceUnit: Flamethrower { id: 15, health: 100, player: 1, fuel: 26, ammo: [ [ 1, 4 ] ], moved: true }, target: 1,5, targetUnit: null }"
  `);

  const [, gameActionResponseD] = await executeGameActions(mapA, [
    MoveAction(v9, v6),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseD))
    .toMatchInlineSnapshot(`
    "Move (3,3 → 1,5) { fuel: 26, completed: false, path: [3,4 → 3,5 → 2,5 → 1,5] }
    Swap { source: 1,5, sourceUnit: Flamethrower { id: 15, health: 100, player: 1, fuel: 26, ammo: [ [ 1, 4 ] ], moved: true }, target: 1,1, targetUnit: null }"
  `);

  const [, gameActionResponseF] = await executeGameActions(mapA, [
    MoveAction(v9, v2),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseF))
    .toMatchInlineSnapshot(`
    "Move (3,3 → 3,1) { fuel: 28, completed: false, path: [3,2 → 3,1] }
    Swap { source: 3,1, sourceUnit: Flamethrower { id: 15, health: 100, player: 1, fuel: 28, ammo: [ [ 1, 4 ] ], moved: true }, target: 3,5, targetUnit: null }"
  `);

  const [, gameActionResponseG] = await executeGameActions(mapA, [
    MoveAction(v9, v7),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseG))
    .toMatchInlineSnapshot(`
    "Move (3,3 → 3,5) { fuel: 28, completed: false, path: [3,4 → 3,5] }
    Swap { source: 3,5, sourceUnit: Flamethrower { id: 15, health: 100, player: 1, fuel: 28, ammo: [ [ 1, 4 ] ], moved: true }, target: 3,1, targetUnit: null }"
  `);

  const [gameState, gameActionResponseH] = await executeGameActions(
    mapA.copy({
      buildings: mapA.buildings.set(v7.left(), SpawnPlatform.create(1)),
      units: mapA.units
        .set(v3, Flamethrower.create(2))
        .set(v3.left(), Pioneer.create(2))
        .set(v5, Jeep.create(1))
        .set(v4.down(), Sniper.create(1))
        .set(v4.up(), Medic.create(1))
        .set(v4.right(), RocketLauncher.create(1)),
    }),
    [
      MoveAction(v9, v1),
      AttackUnitAction(v3, v3.left()),
      MoveAction(v4.down(), v4),
      MoveAction(v4.up(), v4),
      MoveAction(v4.right(), v4),
      CreateUnitAction(v7.left(), Saboteur.id, v7),
    ],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseH))
    .toMatchInlineSnapshot(`
    "Move (3,3 → 1,1) { fuel: 26, completed: false, path: [3,2 → 2,2 → 2,1 → 1,1] }
    Swap { source: 1,1, sourceUnit: Flamethrower { id: 15, health: 100, player: 1, fuel: 26, ammo: [ [ 1, 4 ] ], moved: true }, target: 5,1, targetUnit: Flamethrower { id: 15, health: 100, player: 2, fuel: 30, ammo: [ [ 1, 4 ] ] } }
    AttackUnit (5,1 → 4,1) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 33, chargeB: 100 }
    Move (1,4 → 1,3) { fuel: 39, completed: false, path: [1,3] }
    Swap { source: 1,3, sourceUnit: Sniper { id: 14, health: 100, player: 1, fuel: 39, ammo: [ [ 1, 7 ] ], moved: true }, target: 5,3, targetUnit: Jeep { id: 6, health: 100, player: 1, fuel: 60 } }
    Move (1,2 → 1,3) { fuel: 79, completed: false, path: [1,3] }
    Swap { source: 1,3, sourceUnit: Medic { id: 26, health: 100, player: 1, fuel: 79, moved: true }, target: 5,3, targetUnit: Jeep { id: 6, health: 100, player: 1, fuel: 60, transports: [ { ammo: [ [ 1, 7 ] ], fuel: 39, health: 100, id: 14, moved: true, player: 1 } ] } }
    Move (2,3 → 1,3) { fuel: 39, completed: false, path: [1,3] }
    Swap { source: 1,3, sourceUnit: Rocket Launcher { id: 3, health: 100, player: 1, fuel: 39, ammo: [ [ 1, 4 ] ], moved: true }, target: 5,3, targetUnit: Jeep { id: 6, health: 100, player: 1, fuel: 60, transports: [ { ammo: [ [ 1, 7 ] ], fuel: 39, health: 100, id: 14, moved: true, player: 1 }, { fuel: 79, health: 100, id: 26, moved: true, player: 1 } ] } }
    CreateUnit (2,5 → 3,5) { unit: Saboteur { id: 16, health: 100, player: 1, fuel: 40, moved: true, name: 'Arvid', completed: true }, free: false, skipBehaviorRotation: false }
    Swap { source: 3,5, sourceUnit: Saboteur { id: 16, health: 100, player: 1, fuel: 40, moved: true, name: 'Arvid', completed: true }, target: 3,1, targetUnit: null }"
  `);

  const screenshot = await captureOne(gameState.at(-1)![1], '1');
  printGameState('Swap', screenshot);
  expect(screenshot).toMatchImageSnapshot();
});

test('does not crash the AI when accidentally teleporting away', async () => {
  const v1 = vec(1, 2);
  const v2 = vec(3, 2);
  const v3 = vec(3, 4);
  const v4 = vec(5, 3);

  const mapA = initialMap.copy({
    map: [
      Space.id,
      Space.id,
      Space.id,
      Space.id,
      Space.id,
      1,
      Space.id,
      1,
      Space.id,
      Space.id,
      Teleporter1.id,
      Space.id,
      Teleporter1.id,
      1,
      1,
      Space.id,
      Space.id,
      1,
      Space.id,
      Space.id,
      Space.id,
      Space.id,
      Space.id,
      Space.id,
      Space.id,
    ],
    teams: updatePlayer(
      initialMap.teams,
      Bot.from(initialMap.getPlayer(2), 'AI'),
    ),
    units: initialMap.units
      .set(v1, Infantry.create(1))
      .set(v2, Infantry.create(1))
      .set(v3, Infantry.create(1))
      .set(v4, Infantry.create(2)),
  });

  const [, gameActionResponseA] = await executeGameActions(mapA, [
    EndTurnAction(),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      Move (5,3 → 3,3) { fuel: 48, completed: false, path: [4,3 → 3,3] }
      Swap { source: 3,3, sourceUnit: Infantry { id: 2, health: 100, player: 2, fuel: 48, moved: true }, target: 1,3, targetUnit: null }
      AttackUnit (1,3 → 1,2) { hasCounterAttack: true, playerA: 2, playerB: 1, unitA: DryUnit { health: 76 }, unitB: DryUnit { health: 42 }, chargeA: 86, chargeB: 115 }
      EndTurn { current: { funds: 500, player: 2 }, next: { funds: 500, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }"
    `);
});
