import {
  AttackBuildingAction,
  AttackUnitAction,
  CaptureAction,
  CreateBuildingAction,
  DropUnitAction,
  EndTurnAction,
  MoveAction,
  RescueAction,
} from '@deities/apollo/action-mutators/ActionMutators.tsx';
import { CrashedAirplane, House } from '@deities/athena/info/Building.tsx';
import { ConstructionSite } from '@deities/athena/info/Tile.tsx';
import {
  Bomber,
  Flamethrower,
  HeavyTank,
  Helicopter,
  Infantry,
  Jeep,
  Pioneer,
  SmallTank,
  Zombie,
} from '@deities/athena/info/Unit.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import { Bot, HumanPlayer } from '@deities/athena/map/Player.tsx';
import Team from '@deities/athena/map/Team.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData, { SizeVector } from '@deities/athena/MapData.tsx';
import {
  validateWinConditions,
  WinCriteria,
} from '@deities/athena/WinConditions.tsx';
import ImmutableMap from '@nkzw/immutable-map';
import { expect, test } from 'vitest';
import executeGameActions from '../executeGameActions.tsx';
import snapshotEncodedActionResponse from '../snapshotEncodedActionResponse.tsx';

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
    ],
  }),
);
const player1 = HumanPlayer.from(map.getPlayer(1), '1');
const player2 = HumanPlayer.from(map.getPlayer(2), '4');

test('default win criteria', async () => {
  const from = vec(1, 1);
  const to = vec(1, 2);
  const initialMap = map.copy({
    units: map.units
      .set(from, Helicopter.create(player1))
      .set(to, Helicopter.create(player2).setHealth(1)),
  });

  const [, gameActionResponse] = executeGameActions(initialMap, [
    AttackUnitAction(from, to),
  ]);

  expect(
    snapshotEncodedActionResponse(gameActionResponse),
  ).toMatchInlineSnapshot(
    `
    "AttackUnit (1,1 → 1,2) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 7 ] ] }, unitB: null, chargeA: 0, chargeB: 3 }
    AttackUnitGameOver { fromPlayer: 2, toPlayer: 1 }
    GameEnd { condition: null, conditionId: null, toPlayer: 1 }"
  `,
  );
});

test('capture amount win criteria', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v3 = vec(1, 3);
  const v4 = vec(2, 1);
  const v5 = vec(2, 2);
  const v6 = vec(2, 3);
  const initialMap = map.copy({
    buildings: map.buildings
      .set(v1, House.create(player1))
      .set(v2, House.create(player2))
      .set(v3, House.create(player2))
      .set(v4, House.create(player2))
      .set(v5, House.create(player2))
      .set(v6, House.create(player2)),
    units: map.units
      .set(v1, Pioneer.create(player2).capture())
      .set(v2, Pioneer.create(player1).capture())
      .set(v3, Pioneer.create(player1).capture())
      .set(v4, Pioneer.create(player1).capture())
      .set(v5, Pioneer.create(player1).capture()),
  });

  const [, gameActionResponseA] = executeGameActions(initialMap, [
    CaptureAction(v2),
    CaptureAction(v3),
    CaptureAction(v4),
    CaptureAction(v5),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
    "Capture (1,2) { building: House { id: 2, health: 100, player: 1 }, player: 2 }
    Capture (1,3) { building: House { id: 2, health: 100, player: 1 }, player: 2 }
    Capture (2,1) { building: House { id: 2, health: 100, player: 1 }, player: 2 }
    Capture (2,2) { building: House { id: 2, health: 100, player: 1 }, player: 2 }"
  `);

  const mapWithConditions = initialMap.copy({
    config: initialMap.config.copy({
      winConditions: [
        {
          amount: 4,
          hidden: false,
          type: WinCriteria.CaptureAmount,
        },
      ],
    }),
  });

  expect(validateWinConditions(initialMap)).toBe(true);
  expect(validateWinConditions(mapWithConditions)).toBe(true);

  const [, gameActionResponseB] = executeGameActions(mapWithConditions, [
    CaptureAction(v2),
    CaptureAction(v3),
    CaptureAction(v4),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseB))
    .toMatchInlineSnapshot(`
      "Capture (1,2) { building: House { id: 2, health: 100, player: 1 }, player: 2 }
      Capture (1,3) { building: House { id: 2, health: 100, player: 1 }, player: 2 }
      Capture (2,1) { building: House { id: 2, health: 100, player: 1 }, player: 2 }
      GameEnd { condition: { amount: 4, hidden: false, players: [], reward: null, type: 2 }, conditionId: 0, toPlayer: 1 }"
    `);

  // Conditions can be asymmetrical.
  const mapWithAsymmetricConditions = initialMap.copy({
    config: initialMap.config.copy({
      winConditions: [
        {
          amount: 1,
          hidden: false,
          players: [2],
          type: WinCriteria.CaptureAmount,
        },
      ],
    }),
  });
  const [, gameActionResponseC] = executeGameActions(
    mapWithAsymmetricConditions,
    [
      CaptureAction(v2),
      CaptureAction(v3),
      CaptureAction(v4),
      EndTurnAction(),
      CaptureAction(v1),
    ],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseC))
    .toMatchInlineSnapshot(`
      "Capture (1,2) { building: House { id: 2, health: 100, player: 1 }, player: 2 }
      Capture (1,3) { building: House { id: 2, health: 100, player: 1 }, player: 2 }
      Capture (2,1) { building: House { id: 2, health: 100, player: 1 }, player: 2 }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 700, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      Capture (1,1) { building: House { id: 2, health: 100, player: 2 }, player: 1 }
      GameEnd { condition: { amount: 1, hidden: false, players: [ 2 ], reward: null, type: 2 }, conditionId: 0, toPlayer: 2 }"
    `);
});

test('capture amount win criteria also works when creating buildings', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(2, 2);
  const v3 = vec(3, 1);
  const initialMap = map.copy({
    buildings: map.buildings
      .set(v1, House.create(player2))
      .set(v2, House.create(player2)),
    config: map.config.copy({
      winConditions: [
        {
          amount: 3,
          hidden: false,
          type: WinCriteria.CaptureAmount,
        },
      ],
    }),
    map: [1, 1, ConstructionSite.id, 1, 1, 1, 1, 1, 1],
    units: map.units
      .set(v1, Pioneer.create(player1).capture())
      .set(v2, Pioneer.create(player1).capture())
      .set(v3, Pioneer.create(player1)),
  });

  expect(validateWinConditions(initialMap)).toBe(true);

  const [, gameActionResponseA] = executeGameActions(initialMap, [
    CaptureAction(v1),
    CaptureAction(v2),
    CreateBuildingAction(v3, House.id),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "Capture (1,1) { building: House { id: 2, health: 100, player: 1 }, player: 2 }
      Capture (2,2) { building: House { id: 2, health: 100, player: 1 }, player: 2 }
      CreateBuilding (3,1) { building: House { id: 2, health: 100, player: 1, completed: true } }
      GameEnd { condition: { amount: 3, hidden: false, players: [], reward: null, type: 2 }, conditionId: 0, toPlayer: 1 }"
    `);
});

test('capture label win criteria', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v3 = vec(1, 3);
  const v4 = vec(2, 1);
  const v5 = vec(2, 2);
  const v6 = vec(2, 3);
  const initialMap = map.copy({
    buildings: map.buildings
      .set(v1, House.create(player1))
      .set(v2, House.create(player2))
      .set(v3, House.create(player2, { label: 4 }))
      .set(v4, House.create(player2, { label: 3 }))
      .set(v5, House.create(player2, { label: 4 }))
      .set(v6, House.create(player2)),
    config: map.config.copy({
      winConditions: [
        {
          hidden: false,
          label: new Set([4, 3]),
          type: WinCriteria.CaptureLabel,
        },
      ],
    }),
    units: map.units
      .set(v1, Pioneer.create(player2).capture())
      .set(v2, Pioneer.create(player1).capture())
      .set(v3, Pioneer.create(player1).capture())
      .set(v4, Pioneer.create(player1).capture())
      .set(v5, Pioneer.create(player1).capture()),
  });

  expect(validateWinConditions(initialMap)).toBe(true);

  const [, gameActionResponseA] = executeGameActions(initialMap, [
    CaptureAction(v2),
    CaptureAction(v3),
    CaptureAction(v4),
    CaptureAction(v5),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "Capture (1,2) { building: House { id: 2, health: 100, player: 1 }, player: 2 }
      Capture (1,3) { building: House { id: 2, health: 100, player: 1, label: 4 }, player: 2 }
      Capture (2,1) { building: House { id: 2, health: 100, player: 1, label: 3 }, player: 2 }
      Capture (2,2) { building: House { id: 2, health: 100, player: 1, label: 4 }, player: 2 }
      GameEnd { condition: { hidden: false, label: [ 4, 3 ], players: [], reward: null, type: 1 }, conditionId: 0, toPlayer: 1 }"
    `);
});

test('capture label win criteria fails because building is destroyed', async () => {
  const v1 = vec(1, 3);
  const v2 = vec(2, 3);
  const initialMap = map.copy({
    buildings: map.buildings.set(
      v1,
      House.create(0, { label: 1 }).setHealth(1),
    ),
    config: map.config.copy({
      winConditions: [
        {
          hidden: false,
          label: new Set([1]),
          players: [1],
          type: WinCriteria.CaptureLabel,
        },
      ],
    }),
    units: map.units.set(v2, HeavyTank.create(player1)),
  });

  expect(validateWinConditions(initialMap)).toBe(true);

  const [, gameActionResponseA] = executeGameActions(initialMap, [
    AttackBuildingAction(v2, v1),
  ]);

  expect(
    snapshotEncodedActionResponse(gameActionResponseA),
  ).toMatchInlineSnapshot(
    `
    "AttackBuilding (2,3 → 1,3) { hasCounterAttack: false, playerA: 1, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 9 ] ] }, unitC: null, chargeA: null, chargeB: null, chargeC: null }
    GameEnd { condition: { hidden: false, label: [ 1 ], players: [ 1 ], reward: null, type: 1 }, conditionId: 0, toPlayer: 2 }"
  `,
  );

  const [, gameActionResponseB] = executeGameActions(
    initialMap.copy({ units: map.units.set(v2, HeavyTank.create(player2)) }),
    [EndTurnAction(), AttackBuildingAction(v2, v1)],
  );

  expect(
    snapshotEncodedActionResponse(gameActionResponseB),
  ).toMatchInlineSnapshot(
    `
    "EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
    AttackBuilding (2,3 → 1,3) { hasCounterAttack: false, playerA: 2, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 9 ] ] }, unitC: null, chargeA: null, chargeB: null, chargeC: null }
    GameEnd { condition: { hidden: false, label: [ 1 ], players: [ 1 ], reward: null, type: 1 }, conditionId: 0, toPlayer: 2 }"
  `,
  );
});

test('capture label win criteria (fail with missing label)', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const initialMap = map.copy({
    buildings: map.buildings
      .set(v1, House.create(player2))
      .set(v2, House.create(player2)),
    config: map.config.copy({
      winConditions: [
        {
          hidden: false,
          label: new Set([4, 3]),
          type: WinCriteria.CaptureLabel,
        },
      ],
    }),
    units: map.units
      .set(v1, Pioneer.create(player1).capture())
      .set(v2, Pioneer.create(player1).capture()),
  });

  expect(validateWinConditions(initialMap)).toBe(true);

  const [, gameActionResponseA] = executeGameActions(initialMap, [
    CaptureAction(v1),
    CaptureAction(v2),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "Capture (1,1) { building: House { id: 2, health: 100, player: 1 }, player: 2 }
      Capture (1,2) { building: House { id: 2, health: 100, player: 1 }, player: 2 }"
    `);
});

test('destroy amount win criteria', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v3 = vec(1, 3);
  const initialMap = map.copy({
    buildings: map.buildings
      .set(v1, House.create(player1).setHealth(1))
      .set(v2, House.create(player2).setHealth(1))
      .set(v3, House.create(player2).setHealth(1)),
    units: map.units
      .set(v1.right(), Bomber.create(player2).capture())
      .set(v2.right(), Bomber.create(player1).capture())
      .set(v3.right(), Bomber.create(player1).capture()),
  });

  const [, gameActionResponseA] = executeGameActions(initialMap, [
    AttackBuildingAction(v2.right(), v2),
    AttackBuildingAction(v3.right(), v3),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "AttackBuilding (2,2 → 1,2) { hasCounterAttack: false, playerA: 1, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, unitC: null, chargeA: null, chargeB: 1366, chargeC: null }
      AttackBuilding (2,3 → 1,3) { hasCounterAttack: false, playerA: 1, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, unitC: null, chargeA: null, chargeB: 2732, chargeC: null }"
    `);

  const mapWithConditions = initialMap.copy({
    config: initialMap.config.copy({
      winConditions: [
        {
          amount: 2,
          hidden: false,
          type: WinCriteria.DestroyAmount,
        },
      ],
    }),
  });

  expect(validateWinConditions(initialMap)).toBe(true);
  expect(validateWinConditions(mapWithConditions)).toBe(true);

  const [, gameActionResponseB] = executeGameActions(mapWithConditions, [
    AttackBuildingAction(v2.right(), v2),
    AttackBuildingAction(v3.right(), v3),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseB))
    .toMatchInlineSnapshot(`
      "AttackBuilding (2,2 → 1,2) { hasCounterAttack: false, playerA: 1, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, unitC: null, chargeA: null, chargeB: 1366, chargeC: null }
      AttackBuilding (2,3 → 1,3) { hasCounterAttack: false, playerA: 1, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, unitC: null, chargeA: null, chargeB: 2732, chargeC: null }
      GameEnd { condition: { amount: 2, hidden: false, players: [], reward: null, type: 12 }, conditionId: 0, toPlayer: 1 }"
    `);

  // Conditions can be asymmetrical.
  const mapWithAsymmetricConditions = initialMap.copy({
    config: initialMap.config.copy({
      winConditions: [
        {
          amount: 1,
          hidden: false,
          players: [2],
          type: WinCriteria.DestroyAmount,
        },
      ],
    }),
  });
  const [, gameActionResponseC] = executeGameActions(
    mapWithAsymmetricConditions,
    [
      AttackBuildingAction(v2.right(), v2),
      AttackBuildingAction(v3.right(), v3),
      EndTurnAction(),
      AttackBuildingAction(v1.right(), v1),
    ],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseC))
    .toMatchInlineSnapshot(`
      "AttackBuilding (2,2 → 1,2) { hasCounterAttack: false, playerA: 1, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, unitC: null, chargeA: null, chargeB: 1366, chargeC: null }
      AttackBuilding (2,3 → 1,3) { hasCounterAttack: false, playerA: 1, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, unitC: null, chargeA: null, chargeB: 2732, chargeC: null }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      AttackBuilding (2,1 → 1,1) { hasCounterAttack: false, playerA: 2, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, unitC: null, chargeA: null, chargeB: 1366, chargeC: null }
      GameEnd { condition: { amount: 1, hidden: false, players: [ 2 ], reward: null, type: 12 }, conditionId: 0, toPlayer: 2 }"
    `);
});

test('destroy label win criteria', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v3 = vec(1, 3);
  const v4 = vec(3, 1);
  const v5 = vec(3, 2);
  const initialMap = map.copy({
    buildings: map.buildings
      .set(v1, House.create(player2).setHealth(1))
      .set(v2, House.create(player2, { label: 4 }).setHealth(1))
      .set(v3, House.create(player2, { label: 3 }).setHealth(1))
      .set(v4, House.create(player2, { label: 4 }).setHealth(1))
      .set(v5, House.create(player2).setHealth(1)),
    config: map.config.copy({
      winConditions: [
        {
          hidden: false,
          label: new Set([4, 3]),
          type: WinCriteria.DestroyLabel,
        },
      ],
    }),
    map: Array(4 * 3).fill(1),
    size: new SizeVector(4, 3),
    units: map.units
      .set(v1.right(), Bomber.create(player1))
      .set(v2.right(), Bomber.create(player1))
      .set(v3.right(), Bomber.create(player1))
      .set(v4.right(), Bomber.create(player1))
      .set(v5, Pioneer.create(player2)),
  });

  expect(validateWinConditions(initialMap)).toBe(true);

  const [, gameActionResponseA] = executeGameActions(initialMap, [
    AttackBuildingAction(v1.right(), v1),
    AttackBuildingAction(v2.right(), v2),
    AttackBuildingAction(v3.right(), v3),
    AttackBuildingAction(v4.right(), v4),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "AttackBuilding (2,1 → 1,1) { hasCounterAttack: false, playerA: 1, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, unitC: null, chargeA: null, chargeB: 1366, chargeC: null }
      AttackBuilding (2,2 → 1,2) { hasCounterAttack: false, playerA: 1, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, unitC: null, chargeA: null, chargeB: 2732, chargeC: null }
      AttackBuilding (2,3 → 1,3) { hasCounterAttack: false, playerA: 1, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, unitC: null, chargeA: null, chargeB: 4098, chargeC: null }
      AttackBuilding (4,1 → 3,1) { hasCounterAttack: false, playerA: 1, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, unitC: null, chargeA: null, chargeB: 5464, chargeC: null }
      GameEnd { condition: { hidden: false, label: [ 4, 3 ], players: [], reward: null, type: 11 }, conditionId: 0, toPlayer: 1 }"
    `);
});

test('destroy label does not fire without label', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v3 = vec(3, 2);
  const initialMap = map.copy({
    buildings: map.buildings
      .set(v1, House.create(player2).setHealth(1))
      .set(v2, House.create(player2).setHealth(1))
      .set(v3, House.create(player2).setHealth(1)),
    config: map.config.copy({
      winConditions: [
        {
          hidden: false,
          label: new Set([4, 3]),
          type: WinCriteria.DestroyLabel,
        },
      ],
    }),
    map: Array(4 * 3).fill(1),
    size: new SizeVector(4, 3),
    units: map.units
      .set(v1.right(), Bomber.create(player1))
      .set(v2.right(), Bomber.create(player1))
      .set(v3, Pioneer.create(player2)),
  });

  expect(validateWinConditions(initialMap)).toBe(true);

  const [, gameActionResponseA] = executeGameActions(initialMap, [
    AttackBuildingAction(v1.right(), v1),
    AttackBuildingAction(v2.right(), v2),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "AttackBuilding (2,1 → 1,1) { hasCounterAttack: false, playerA: 1, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, unitC: null, chargeA: null, chargeB: 1366, chargeC: null }
      AttackBuilding (2,2 → 1,2) { hasCounterAttack: false, playerA: 1, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, unitC: null, chargeA: null, chargeB: 2732, chargeC: null }"
    `);
});

test('destroy label win criteria (neutral structure)', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v3 = vec(1, 3);
  const initialMap = map.copy({
    buildings: map.buildings
      .set(v1, CrashedAirplane.create(0, { label: 3 }).setHealth(1))
      .set(v2, House.create(player2).setHealth(1)),
    config: map.config.copy({
      winConditions: [
        {
          hidden: false,
          label: new Set([3]),
          type: WinCriteria.DestroyLabel,
        },
      ],
    }),
    units: map.units
      .set(v1.right(), Bomber.create(player1))
      .set(v2.right(), Bomber.create(player1))
      .set(v3, Pioneer.create(player2)),
  });

  const [, gameActionResponseA] = executeGameActions(initialMap, [
    AttackBuildingAction(v2.right(), v2),
    AttackBuildingAction(v1.right(), v1),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "AttackBuilding (2,2 → 1,2) { hasCounterAttack: false, playerA: 1, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, unitC: null, chargeA: null, chargeB: 1366, chargeC: null }
      AttackBuilding (2,1 → 1,1) { hasCounterAttack: false, playerA: 1, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, unitC: null, chargeA: null, chargeB: null, chargeC: null }
      GameEnd { condition: { hidden: false, label: [ 3 ], players: [], reward: null, type: 11 }, conditionId: 0, toPlayer: 1 }"
    `);
});

test('defeat with label', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v3 = vec(1, 3);
  const v4 = vec(2, 1);
  const v5 = vec(2, 2);
  const v6 = vec(2, 3);
  const v7 = vec(3, 1);
  const initialMap = map.copy({
    buildings: map.buildings.set(v1, House.create(player2, { label: 2 })),
    config: map.config.copy({
      winConditions: [
        {
          hidden: false,
          label: new Set([4, 2]),
          type: WinCriteria.DefeatLabel,
        },
      ],
    }),
    units: map.units
      .set(v1, Flamethrower.create(player1))
      .set(v2, Pioneer.create(player2, { label: 2 }))
      .set(v3, Flamethrower.create(player1))
      .set(v4, Pioneer.create(player2, { label: 4 }))
      .set(v5, Flamethrower.create(player1))
      .set(v6, Pioneer.create(player2, { label: 1 }))
      .set(v7, Pioneer.create(player2)),
  });

  expect(validateWinConditions(initialMap)).toBe(true);

  const [, gameActionResponseA] = executeGameActions(initialMap, [
    AttackUnitAction(v1, v2),
    AttackUnitAction(v3, v6),
    AttackUnitAction(v5, v4),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "AttackUnit (1,1 → 1,2) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 33, chargeB: 100 }
      AttackUnit (1,3 → 2,3) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 66, chargeB: 200 }
      AttackUnit (2,2 → 2,1) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 99, chargeB: 300 }
      GameEnd { condition: { hidden: false, label: [ 4, 2 ], players: [], reward: null, type: 3 }, conditionId: 0, toPlayer: 1 }"
    `);
});

test('defeat one with label', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v3 = vec(2, 2);
  const v4 = vec(2, 1);
  const initialMap = map.copy({
    config: map.config.copy({
      winConditions: [
        {
          hidden: false,
          label: new Set([4, 2]),
          type: WinCriteria.DefeatOneLabel,
        },
      ],
    }),
    units: map.units
      .set(v1, Flamethrower.create(player1))
      .set(v2, Pioneer.create(player2))
      .set(v3, Flamethrower.create(player1))
      .set(v4, Pioneer.create(player2, { label: 4 })),
  });

  expect(validateWinConditions(initialMap)).toBe(true);

  const [, gameActionResponseA] = executeGameActions(initialMap, [
    AttackUnitAction(v1, v2),
    AttackUnitAction(v3, v4),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "AttackUnit (1,1 → 1,2) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 33, chargeB: 100 }
      AttackUnit (2,2 → 2,1) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 66, chargeB: 200 }
      GameEnd { condition: { hidden: false, label: [ 4, 2 ], players: [], reward: null, type: 10 }, conditionId: 0, toPlayer: 1 }"
    `);
});

test('defeat by amount', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v3 = vec(1, 3);
  const v4 = vec(2, 1);
  const v5 = vec(2, 2);
  const v6 = vec(2, 3);
  const v7 = vec(3, 1);
  const initialMap = map.copy({
    config: map.config.copy({
      winConditions: [
        {
          amount: 3,
          hidden: false,
          type: WinCriteria.DefeatAmount,
        },
      ],
    }),
    units: map.units
      .set(v1, Flamethrower.create(player1))
      .set(v2, Pioneer.create(player2))
      .set(v3, Flamethrower.create(player1))
      .set(v4, Pioneer.create(player2))
      .set(v5, Flamethrower.create(player1))
      .set(v6, Pioneer.create(player2))
      .set(v7, Pioneer.create(player2)),
  });

  expect(validateWinConditions(initialMap)).toBe(true);

  const [, gameActionResponseA] = executeGameActions(initialMap, [
    AttackUnitAction(v1, v2),
    AttackUnitAction(v3, v6),
    AttackUnitAction(v5, v4),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "AttackUnit (1,1 → 1,2) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 33, chargeB: 100 }
      AttackUnit (1,3 → 2,3) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 66, chargeB: 200 }
      AttackUnit (2,2 → 2,1) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 99, chargeB: 300 }
      GameEnd { condition: { amount: 3, hidden: false, players: [], reward: null, type: 9 }, conditionId: 0, toPlayer: 1 }"
    `);
});

test('defeat by amount through counter attack', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v3 = vec(1, 3);
  const initialMap = map.copy({
    config: map.config.copy({
      winConditions: [
        {
          amount: 1,
          hidden: false,
          type: WinCriteria.DefeatAmount,
        },
      ],
    }),
    units: map.units
      .set(v1, Flamethrower.create(player1).setHealth(1))
      .set(v2, Flamethrower.create(player2))
      .set(v3, Flamethrower.create(player1)),
  });

  expect(validateWinConditions(initialMap)).toBe(true);

  const [, gameActionResponseA] = executeGameActions(initialMap, [
    AttackUnitAction(v1, v2),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "AttackUnit (1,1 → 1,2) { hasCounterAttack: true, playerA: 1, playerB: 2, unitA: null, unitB: DryUnit { health: 56, ammo: [ [ 1, 3 ] ] }, chargeA: 62, chargeB: 176 }
      GameEnd { condition: { amount: 1, hidden: false, players: [], reward: null, type: 9 }, conditionId: 0, toPlayer: 2 }"
    `);
});

test('defeat with label and Zombie', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v3 = vec(1, 3);
  const initialMap = map.copy({
    config: map.config.copy({
      winConditions: [
        {
          hidden: false,
          label: new Set([2]),
          type: WinCriteria.DefeatLabel,
        },
      ],
    }),
    units: map.units
      .set(v1, Zombie.create(player1))
      .set(v2, Flamethrower.create(player2, { label: 2 }))
      .set(v3, Flamethrower.create(player2)),
  });

  expect(validateWinConditions(initialMap)).toBe(true);

  const [, gameActionResponseA] = executeGameActions(initialMap, [
    AttackUnitAction(v1, v2),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "AttackUnit (1,1 → 1,2) { hasCounterAttack: true, playerA: 1, playerB: 2, unitA: DryUnit { health: 48, ammo: [ [ 1, 4 ] ] }, unitB: DryUnit { health: 30, ammo: [ [ 1, 3 ] ] }, chargeA: 300, chargeB: 280 }
      GameEnd { condition: { hidden: false, label: [ 2 ], players: [], reward: null, type: 3 }, conditionId: 0, toPlayer: 1 }"
    `);
});

test('defeat by amount and Zombie', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v3 = vec(2, 2);
  const initialMap = map.copy({
    config: map.config.copy({
      winConditions: [
        {
          amount: 1,
          hidden: false,
          type: WinCriteria.DefeatAmount,
        },
      ],
    }),
    units: map.units
      .set(v1, Zombie.create(player1))
      .set(v2, Infantry.create(player2))
      .set(v3, Infantry.create(player2)),
  });

  expect(validateWinConditions(initialMap)).toBe(true);

  const [, gameActionResponseA] = executeGameActions(initialMap, [
    AttackUnitAction(v1, v2),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "AttackUnit (1,1 → 1,2) { hasCounterAttack: true, playerA: 1, playerB: 2, unitA: DryUnit { health: 75, ammo: [ [ 1, 4 ] ] }, unitB: DryUnit { health: 35 }, chargeA: 142, chargeB: 130 }
      GameEnd { condition: { amount: 1, hidden: false, players: [], reward: null, type: 9 }, conditionId: 0, toPlayer: 1 }"
    `);
});

test('defeat with label (fail because label did not previously exist)', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v3 = vec(1, 3);
  const v4 = vec(2, 3);
  const v5 = vec(3, 3);
  const initialMap = map.copy({
    config: map.config.copy({
      winConditions: [
        {
          hidden: false,
          label: new Set([4]),
          type: WinCriteria.DefeatLabel,
        },
      ],
    }),
    units: map.units
      .set(v1, Flamethrower.create(player1))
      .set(v2, Pioneer.create(player2))
      .set(v3, Flamethrower.create(player1))
      .set(v4, Pioneer.create(player2))
      .set(v5, Pioneer.create(player2)),
  });

  expect(validateWinConditions(initialMap)).toBe(true);

  const [, gameActionResponseA] = executeGameActions(initialMap, [
    AttackUnitAction(v1, v2),
    AttackUnitAction(v3, v4),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "AttackUnit (1,1 → 1,2) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 33, chargeB: 100 }
      AttackUnit (1,3 → 2,3) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 66, chargeB: 200 }"
    `);
});

test('defeat with label and a unit hiding inside of another', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v3 = vec(1, 3);
  const v4 = vec(2, 1);
  const v5 = vec(2, 2);
  const v6 = vec(2, 3);
  const v7 = vec(3, 1);
  const v9 = vec(3, 3);
  const initialMap = map.copy({
    config: map.config.copy({
      winConditions: [
        {
          hidden: false,
          label: new Set([4, 2]),
          players: [1],
          type: WinCriteria.DefeatLabel,
        },
      ],
    }),
    units: map.units
      .set(v1, SmallTank.create(player1))
      .set(v2, Jeep.create(player2))
      .set(v3, Pioneer.create(player2, { label: 2 }))
      .set(v4, SmallTank.create(player1))
      .set(v5, SmallTank.create(player1))
      .set(v6, Pioneer.create(player2, { label: 4 }))
      .set(v7, Pioneer.create(player2))
      .set(v9, Flamethrower.create(player1)),
  });

  expect(validateWinConditions(initialMap)).toBe(true);

  const [, gameActionResponseA] = executeGameActions(initialMap, [
    EndTurnAction(),
    MoveAction(v3, v2),
    EndTurnAction(),
    AttackUnitAction(v9, v6),
    AttackUnitAction(v1, v2),
    AttackUnitAction(v5, v2),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      Move (1,3 → 1,2) { fuel: 39, completed: false, path: [1,2] }
      EndTurn { current: { funds: 500, player: 2 }, next: { funds: 500, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }
      AttackUnit (3,3 → 2,3) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 33, chargeB: 100 }
      AttackUnit (1,1 → 1,2) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 6 ] ] }, unitB: DryUnit { health: 20 }, chargeA: 72, chargeB: 220 }
      AttackUnit (2,2 → 1,2) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 6 ] ] }, unitB: null, chargeA: 81, chargeB: 250 }
      GameEnd { condition: { hidden: false, label: [ 4, 2 ], players: [ 1 ], reward: null, type: 3 }, conditionId: 0, toPlayer: 1 }"
    `);
});

test('win by survival', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const initialMap = map.copy({
    config: map.config.copy({
      winConditions: [
        {
          hidden: false,
          players: [1],
          rounds: 3,
          type: WinCriteria.Survival,
        },
      ],
    }),
    units: map.units
      .set(v1, Flamethrower.create(player1))
      .set(v2, Pioneer.create(player2)),
  });

  expect(validateWinConditions(initialMap)).toBe(true);

  const [, gameActionResponseA] = executeGameActions(initialMap, [
    EndTurnAction(),
    EndTurnAction(),
    EndTurnAction(),
    EndTurnAction(),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      EndTurn { current: { funds: 500, player: 2 }, next: { funds: 500, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 2, rotatePlayers: false, supply: null, miss: false }
      EndTurn { current: { funds: 500, player: 2 }, next: { funds: 500, player: 1 }, round: 3, rotatePlayers: false, supply: null, miss: false }
      GameEnd { condition: { hidden: false, players: [ 1 ], reward: null, rounds: 3, type: 5 }, conditionId: 0, toPlayer: 1 }"
    `);
});

test('win by survival in one round', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const initialMap = map.copy({
    config: map.config.copy({
      winConditions: [
        {
          hidden: false,
          players: [2],
          rounds: 1,
          type: WinCriteria.Survival,
        },
      ],
    }),
    units: map.units
      .set(v1, Flamethrower.create(player1))
      .set(v2, Pioneer.create(player2)),
  });

  expect(
    validateWinConditions(
      initialMap.copy({
        config: initialMap.config.copy({
          winConditions: [
            {
              hidden: false,
              players: [1],
              rounds: 1,
              type: WinCriteria.Survival,
            } as const,
          ],
        }),
      }),
    ),
  ).toBe(false);

  expect(validateWinConditions(initialMap)).toBe(true);

  const [, gameActionResponseA] = executeGameActions(initialMap, [
    EndTurnAction(),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      GameEnd { condition: { hidden: false, players: [ 2 ], reward: null, rounds: 1, type: 5 }, conditionId: 0, toPlayer: 2 }"
    `);
});

test('escort units', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v5 = vec(2, 2);
  const v6 = vec(2, 3);
  const v7 = vec(3, 1);
  const initialMap = map.copy({
    config: map.config.copy({
      winConditions: [
        {
          hidden: false,
          label: new Set([1]),
          players: [1],
          type: WinCriteria.EscortLabel,
          vectors: new Set([v7, v6]),
        },
      ],
    }),
    units: map.units
      .set(v1, Pioneer.create(player1, { label: 1 }))
      .set(v2, Pioneer.create(player2))
      .set(v5, Pioneer.create(player1, { label: 1 })),
  });

  expect(validateWinConditions(initialMap)).toBe(true);

  const [, gameActionResponseA] = executeGameActions(initialMap, [
    MoveAction(v1, v6),
    MoveAction(v5, v7),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "Move (1,1 → 2,3) { fuel: 37, completed: false, path: [2,1 → 2,2 → 2,3] }
      Move (2,2 → 3,1) { fuel: 38, completed: false, path: [2,1 → 3,1] }
      GameEnd { condition: { hidden: false, label: [ 1 ], players: [ 1 ], reward: null, type: 4, vectors: [ '3,1', '2,3' ] }, conditionId: 0, toPlayer: 1 }"
    `);
});

test('escort units by label without having units with that label (fails)', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v5 = vec(2, 2);
  const v6 = vec(2, 3);
  const v7 = vec(3, 1);
  const initialMap = map.copy({
    config: map.config.copy({
      winConditions: [
        {
          hidden: false,
          label: new Set([1]),
          players: [1],
          type: WinCriteria.EscortLabel,
          vectors: new Set([v7, v6]),
        },
      ],
    }),
    units: map.units
      .set(v1, Pioneer.create(player1))
      .set(v2, Pioneer.create(player2, { label: 1 }))
      .set(v5, Pioneer.create(player1)),
  });

  expect(validateWinConditions(initialMap)).toBe(true);

  const [, gameActionResponseA] = executeGameActions(initialMap, [
    MoveAction(v1, v6),
    MoveAction(v5, v7),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "Move (1,1 → 2,3) { fuel: 37, completed: false, path: [2,1 → 2,2 → 2,3] }
      Move (2,2 → 3,1) { fuel: 38, completed: false, path: [2,1 → 3,1] }"
    `);
});

test('escort units (transport)', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v4 = vec(2, 1);
  const v5 = vec(2, 2);
  const v6 = vec(2, 3);
  const v7 = vec(3, 1);
  const initialMap = map.copy({
    config: map.config.copy({
      winConditions: [
        {
          hidden: false,
          label: new Set([1]),
          players: [1],
          type: WinCriteria.EscortLabel,
          vectors: new Set([v7, v6]),
        },
      ],
    }),
    units: map.units
      .set(v1, Pioneer.create(player1, { label: 1 }))
      .set(v2, Pioneer.create(player2))
      .set(v5, Pioneer.create(player1, { label: 1 }))
      .set(v4, Jeep.create(player1)),
  });

  expect(validateWinConditions(initialMap)).toBe(true);

  const [, gameActionResponseA] = executeGameActions(initialMap, [
    MoveAction(v1, v6),
    MoveAction(v5, v4),
    MoveAction(v4, v7),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "Move (1,1 → 2,3) { fuel: 37, completed: false, path: [2,1 → 2,2 → 2,3] }
      Move (2,2 → 2,1) { fuel: 39, completed: false, path: [2,1] }
      Move (2,1 → 3,1) { fuel: 59, completed: false, path: [3,1] }
      GameEnd { condition: { hidden: false, label: [ 1 ], players: [ 1 ], reward: null, type: 4, vectors: [ '3,1', '2,3' ] }, conditionId: 0, toPlayer: 1 }"
    `);
});

test('escort units by drop (transport)', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v4 = vec(2, 1);
  const v5 = vec(2, 2);
  const v6 = vec(2, 3);
  const v7 = vec(3, 1);
  const initialMap = map.copy({
    config: map.config.copy({
      winConditions: [
        {
          hidden: false,
          label: new Set([1]),
          players: [1],
          type: WinCriteria.EscortLabel,
          vectors: new Set([v7, v6]),
        },
      ],
    }),
    units: map.units
      .set(v1, Pioneer.create(player1, { label: 1 }))
      .set(v2, Pioneer.create(player2))
      .set(v5, Pioneer.create(player1, { label: 1 }))
      .set(v4, Jeep.create(player1)),
  });

  expect(validateWinConditions(initialMap)).toBe(true);

  const [, gameActionResponseA] = executeGameActions(initialMap, [
    MoveAction(v1, v6),
    MoveAction(v5, v4),
    DropUnitAction(v4, 0, v5),
    EndTurnAction(),
    EndTurnAction(),
    MoveAction(v5, v4),
    DropUnitAction(v4, 0, v7),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "Move (1,1 → 2,3) { fuel: 37, completed: false, path: [2,1 → 2,2 → 2,3] }
      Move (2,2 → 2,1) { fuel: 39, completed: false, path: [2,1] }
      DropUnit (2,1 → 2,2) { index: 0 }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      EndTurn { current: { funds: 500, player: 2 }, next: { funds: 500, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }
      Move (2,2 → 2,1) { fuel: 39, completed: false, path: [2,1] }
      DropUnit (2,1 → 3,1) { index: 0 }
      GameEnd { condition: { hidden: false, label: [ 1 ], players: [ 1 ], reward: null, type: 4, vectors: [ '3,1', '2,3' ] }, conditionId: 0, toPlayer: 1 }"
    `);
});

test('escort units by label fails', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v3 = vec(1, 3);
  const v4 = vec(2, 1);
  const v5 = vec(2, 2);
  const v6 = vec(2, 3);
  const v7 = vec(3, 1);
  const initialMap = map.copy({
    config: map.config.copy({
      winConditions: [
        {
          hidden: false,
          label: new Set([1]),
          players: [1],
          type: WinCriteria.EscortLabel,
          vectors: new Set([v7, v6]),
        },
      ],
    }),
    units: map.units
      .set(v1, Pioneer.create(player1, { label: 1 }))
      .set(v2, Pioneer.create(player2))
      .set(v5, Pioneer.create(player1, { label: 1 }))
      .set(v3, Flamethrower.create(player2))
      .set(v7, Flamethrower.create(player2)),
  });

  expect(validateWinConditions(initialMap)).toBe(true);

  const [, gameActionResponseA] = executeGameActions(initialMap, [
    MoveAction(v1, v6),
    MoveAction(v5, v4),
    EndTurnAction(),
    AttackUnitAction(v7, v4),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "Move (1,1 → 2,3) { fuel: 37, completed: false, path: [2,1 → 2,2 → 2,3] }
      Move (2,2 → 2,1) { fuel: 39, completed: false, path: [2,1] }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      AttackUnit (3,1 → 2,1) { hasCounterAttack: false, playerA: 2, playerB: 1, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 33, chargeB: 100 }
      GameEnd { condition: { hidden: false, label: [ 1 ], players: [ 1 ], reward: null, type: 4, vectors: [ '3,1', '2,3' ] }, conditionId: 0, toPlayer: 2 }"
    `);
});

test('escort units by label fails (transport)', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v3 = vec(1, 3);
  const v4 = vec(2, 1);
  const v5 = vec(2, 2);
  const v6 = vec(2, 3);
  const v7 = vec(3, 1);
  const initialMap = map.copy({
    config: map.config.copy({
      winConditions: [
        {
          hidden: false,
          label: new Set([1]),
          players: [1],
          type: WinCriteria.EscortLabel,
          vectors: new Set([v7, v6]),
        },
      ],
    }),
    units: map.units
      .set(v1, Pioneer.create(player1, { label: 1 }))
      .set(v2, Pioneer.create(player2))
      .set(v5, Pioneer.create(player1, { label: 1 }))
      .set(v4, Jeep.create(player1))
      .set(v3, SmallTank.create(player2))
      .set(v7, SmallTank.create(player2)),
  });

  expect(validateWinConditions(initialMap)).toBe(true);

  const [, gameActionResponseA] = executeGameActions(initialMap, [
    MoveAction(v1, v6),
    MoveAction(v5, v4),
    EndTurnAction(),
    AttackUnitAction(v7, v4),
    MoveAction(v3, v5),
    AttackUnitAction(v5, v4),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "Move (1,1 → 2,3) { fuel: 37, completed: false, path: [2,1 → 2,2 → 2,3] }
      Move (2,2 → 2,1) { fuel: 39, completed: false, path: [2,1] }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      AttackUnit (3,1 → 2,1) { hasCounterAttack: false, playerA: 2, playerB: 1, unitA: DryUnit { health: 100, ammo: [ [ 1, 6 ] ] }, unitB: DryUnit { health: 20 }, chargeA: 39, chargeB: 120 }
      Move (1,3 → 2,2) { fuel: 28, completed: false, path: [1,2 → 2,2] }
      AttackUnit (2,2 → 2,1) { hasCounterAttack: false, playerA: 2, playerB: 1, unitA: DryUnit { health: 100, ammo: [ [ 1, 6 ] ] }, unitB: null, chargeA: 48, chargeB: 150 }
      GameEnd { condition: { hidden: false, label: [ 1 ], players: [ 1 ], reward: null, type: 4, vectors: [ '3,1', '2,3' ] }, conditionId: 0, toPlayer: 2 }"
    `);
});

test('escort units by amount', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v5 = vec(2, 2);
  const v6 = vec(2, 3);
  const v7 = vec(3, 1);
  const initialMap = map.copy({
    config: map.config.copy({
      winConditions: [
        {
          amount: 2,
          hidden: false,
          players: [1],
          type: WinCriteria.EscortAmount,
          vectors: new Set([v7, v6]),
        },
      ],
    }),
    units: map.units
      .set(v1, Pioneer.create(player1))
      .set(v2, Pioneer.create(player2))
      .set(v5, Pioneer.create(player1)),
  });

  expect(validateWinConditions(initialMap)).toBe(true);

  const [, gameActionResponseA] = executeGameActions(initialMap, [
    MoveAction(v1, v6),
    MoveAction(v5, v7),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "Move (1,1 → 2,3) { fuel: 37, completed: false, path: [2,1 → 2,2 → 2,3] }
      Move (2,2 → 3,1) { fuel: 38, completed: false, path: [2,1 → 3,1] }
      GameEnd { condition: { amount: 2, hidden: false, label: [], players: [ 1 ], reward: null, type: 6, vectors: [ '3,1', '2,3' ] }, conditionId: 0, toPlayer: 1 }"
    `);
});

test('escort units by amount (label)', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v3 = vec(2, 2);
  const v4 = vec(3, 1);
  const v5 = vec(2, 3);
  const v6 = vec(3, 3);
  const v7 = vec(3, 2);
  const v8 = vec(1, 3);
  const v9 = vec(2, 1);
  const initialMap = map.copy({
    buildings: map.buildings.set(v4, House.create(player1)),
    config: map.config.copy({
      winConditions: [
        {
          amount: 1,
          hidden: false,
          label: new Set([2]),
          players: [1],
          type: WinCriteria.EscortAmount,
          vectors: new Set([v4, v5]),
        },
        {
          amount: 7,
          hidden: false,
          label: new Set([1]),
          players: [2],
          type: WinCriteria.EscortAmount,
          vectors: new Set([v6, v7]),
        },
        {
          amount: 15,
          hidden: false,
          players: [1],
          type: WinCriteria.EscortAmount,
          vectors: new Set([v8, v9]),
        },
      ],
    }),
    units: map.units
      .set(v1, Pioneer.create(player1))
      .set(v2, Pioneer.create(player2))
      .set(v3, Pioneer.create(player1, { label: 2 })),
  });

  expect(validateWinConditions(initialMap)).toBe(true);

  const [, gameActionResponseA] = executeGameActions(initialMap, [
    MoveAction(v1, v5),
    MoveAction(v3, v4),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "Move (1,1 → 2,3) { fuel: 37, completed: false, path: [2,1 → 2,2 → 2,3] }
      Move (2,2 → 3,1) { fuel: 38, completed: false, path: [2,1 → 3,1] }
      GameEnd { condition: { amount: 1, hidden: false, label: [ 2 ], players: [ 1 ], reward: null, type: 6, vectors: [ '3,1', '2,3' ] }, conditionId: 0, toPlayer: 1 }"
    `);
});

test('escort units by amount with label fails', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v3 = vec(1, 3);
  const v4 = vec(2, 1);
  const v5 = vec(2, 2);
  const v6 = vec(2, 3);
  const v7 = vec(3, 1);
  const initialMap = map.copy({
    config: map.config.copy({
      winConditions: [
        {
          amount: 2,
          hidden: false,
          label: new Set([1]),
          players: [1],
          type: WinCriteria.EscortAmount,
          vectors: new Set([v7, v6]),
        },
      ],
    }),
    units: map.units
      .set(v1, Pioneer.create(player1, { label: 1 }))
      .set(v2, Pioneer.create(player2))
      .set(v5, Pioneer.create(player1, { label: 1 }))
      .set(v3, Flamethrower.create(player2))
      .set(v7, Flamethrower.create(player2)),
  });

  expect(validateWinConditions(initialMap)).toBe(true);

  const [, gameActionResponseA] = executeGameActions(initialMap, [
    MoveAction(v1, v6),
    MoveAction(v5, v4),
    EndTurnAction(),
    AttackUnitAction(v7, v4),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "Move (1,1 → 2,3) { fuel: 37, completed: false, path: [2,1 → 2,2 → 2,3] }
      Move (2,2 → 2,1) { fuel: 39, completed: false, path: [2,1] }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      AttackUnit (3,1 → 2,1) { hasCounterAttack: false, playerA: 2, playerB: 1, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 33, chargeB: 100 }
      GameEnd { condition: { amount: 2, hidden: false, label: [ 1 ], players: [ 1 ], reward: null, type: 6, vectors: [ '3,1', '2,3' ] }, conditionId: 0, toPlayer: 2 }"
    `);
});

test('escort units by amount does not fail when enough units are remaining', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v3 = vec(1, 3);
  const v4 = vec(2, 1);
  const v5 = vec(2, 2);
  const v6 = vec(2, 3);
  const v7 = vec(3, 1);
  const initialMap = map.copy({
    config: map.config.copy({
      winConditions: [
        {
          amount: 1,
          hidden: false,
          label: new Set([1]),
          players: [1],
          type: WinCriteria.EscortAmount,
          vectors: new Set([v7]),
        },
      ],
    }),
    units: map.units
      .set(v1, Pioneer.create(player1, { label: 1 }).setHealth(1))
      .set(v2, Pioneer.create(player1, { label: 1 }).setHealth(1))
      .set(v5, Pioneer.create(player1, { label: 1 }).setHealth(1))
      .set(v3, Flamethrower.create(player2))
      .set(v7, Flamethrower.create(player2)),
  });

  expect(validateWinConditions(initialMap)).toBe(true);

  const [, gameActionResponseA] = executeGameActions(initialMap, [
    MoveAction(v1, v6),
    MoveAction(v5, v4),
    EndTurnAction(),
    AttackUnitAction(v7, v4),
    AttackUnitAction(v3, v2),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "Move (1,1 → 2,3) { fuel: 37, completed: false, path: [2,1 → 2,2 → 2,3] }
      Move (2,2 → 2,1) { fuel: 39, completed: false, path: [2,1] }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      AttackUnit (3,1 → 2,1) { hasCounterAttack: false, playerA: 2, playerB: 1, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 0, chargeB: 1 }
      AttackUnit (1,3 → 1,2) { hasCounterAttack: false, playerA: 2, playerB: 1, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 0, chargeB: 2 }"
    `);
});

test('escort units by amount does not fail when the player has more units left', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v3 = vec(1, 3);
  const v4 = vec(2, 1);
  const v5 = vec(2, 2);
  const v6 = vec(2, 3);
  const v7 = vec(3, 1);
  const initialMap = map.copy({
    config: map.config.copy({
      winConditions: [
        {
          amount: 1,
          hidden: false,
          players: [1],
          type: WinCriteria.EscortAmount,
          vectors: new Set([v7]),
        },
      ],
    }),
    units: map.units
      .set(v1, Pioneer.create(player1))
      .set(v2, Pioneer.create(player2))
      .set(v5, Pioneer.create(player1))
      .set(v3, Flamethrower.create(player2))
      .set(v7, Flamethrower.create(player2)),
  });

  expect(validateWinConditions(initialMap)).toBe(true);

  const [, gameActionResponseA] = executeGameActions(initialMap, [
    MoveAction(v1, v6),
    MoveAction(v5, v4),
    EndTurnAction(),
    AttackUnitAction(v7, v4),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "Move (1,1 → 2,3) { fuel: 37, completed: false, path: [2,1 → 2,2 → 2,3] }
      Move (2,2 → 2,1) { fuel: 39, completed: false, path: [2,1] }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      AttackUnit (3,1 → 2,1) { hasCounterAttack: false, playerA: 2, playerB: 1, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 33, chargeB: 100 }"
    `);
});

test('rescue label win criteria', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v3 = vec(1, 3);
  const v4 = vec(2, 3);
  const v5 = vec(2, 2);
  const v6 = vec(2, 1);
  const v7 = vec(3, 3);
  const initialMap = map.copy({
    config: map.config.copy({
      winConditions: [
        {
          hidden: false,
          label: new Set([0, 3]),
          type: WinCriteria.RescueLabel,
        },
      ],
    }),
    units: map.units
      .set(v1, Pioneer.create(0, { label: 0 }))
      .set(v2, Pioneer.create(player1))
      .set(v3, Pioneer.create(0, { label: 3 }))
      .set(v4, Pioneer.create(player1))
      .set(v5, Pioneer.create(0, { label: 0 }))
      .set(v6, Pioneer.create(player1))
      .set(v7, Pioneer.create(0, { label: 4 })),
  });

  expect(validateWinConditions(initialMap)).toBe(true);

  const [, gameActionResponseA] = executeGameActions(initialMap, [
    RescueAction(v2, v1),
    RescueAction(v4, v3),
    RescueAction(v6, v5),
    EndTurnAction(),
    EndTurnAction(),
    RescueAction(v2, v1),
    RescueAction(v4, v3),
    RescueAction(v6, v5),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "Rescue (1,2 → 1,1) { player: 1 }
      Rescue (2,3 → 1,3) { player: 1 }
      Rescue (2,1 → 2,2) { player: 1 }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      EndTurn { current: { funds: 500, player: 2 }, next: { funds: 500, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }
      Rescue (1,2 → 1,1) { player: 1 }
      Rescue (2,3 → 1,3) { player: 1 }
      Rescue (2,1 → 2,2) { player: 1 }
      GameEnd { condition: { hidden: false, label: [ 0, 3 ], players: [], reward: null, type: 8 }, conditionId: 0, toPlayer: 1 }"
    `);
});

test('rescue label win criteria loses when destroying the rescuable unit', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v3 = vec(1, 3);
  const v4 = vec(2, 3);
  const v5 = vec(2, 2);
  const v6 = vec(2, 1);
  const v7 = vec(3, 3);
  const initialMap = map.copy({
    config: map.config.copy({
      winConditions: [
        {
          hidden: false,
          label: new Set([0, 3]),
          players: [1],
          type: WinCriteria.RescueLabel,
        },
      ],
    }),
    units: map.units
      .set(v1, Pioneer.create(0, { label: 0 }))
      .set(v2, Pioneer.create(player1))
      .set(v3, Pioneer.create(0, { label: 3 }).setHealth(1))
      .set(v4, SmallTank.create(player1))
      .set(v5, Pioneer.create(0, { label: 0 }))
      .set(v6, Pioneer.create(player1))
      .set(v7, Pioneer.create(0, { label: 4 })),
  });

  expect(validateWinConditions(initialMap)).toBe(true);

  const [, gameActionResponseA] = executeGameActions(initialMap, [
    RescueAction(v2, v1),
    AttackUnitAction(v4, v3),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "Rescue (1,2 → 1,1) { player: 1 }
      AttackUnit (2,3 → 1,3) { hasCounterAttack: false, playerA: 1, playerB: 0, unitA: DryUnit { health: 100, ammo: [ [ 1, 6 ] ] }, unitB: null, chargeA: 0, chargeB: null }
      GameEnd { condition: { hidden: false, label: [ 0, 3 ], players: [ 1 ], reward: null, type: 8 }, conditionId: 0, toPlayer: 2 }"
    `);

  const [, gameActionResponseB] = executeGameActions(
    initialMap.copy({
      units: initialMap.units.set(v4, SmallTank.create(2)),
    }),
    [RescueAction(v2, v3), EndTurnAction(), AttackUnitAction(v4, v3)],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseB))
    .toMatchInlineSnapshot(`
      "Rescue (1,2 → 1,3) { player: 1 }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      AttackUnit (2,3 → 1,3) { hasCounterAttack: false, playerA: 2, playerB: 0, unitA: DryUnit { health: 100, ammo: [ [ 1, 6 ] ] }, unitB: null, chargeA: 0, chargeB: null }
      GameEnd { condition: { hidden: false, label: [ 0, 3 ], players: [ 1 ], reward: null, type: 8 }, conditionId: 0, toPlayer: 2 }"
    `);

  const [, gameActionResponseC] = executeGameActions(
    initialMap.copy({
      teams: ImmutableMap([
        ...map.teams,
        [
          3,
          new Team(
            3,
            '',
            ImmutableMap([
              [3, new Bot(3, 'Bot', 3, 300, new Set(), new Set(), 0, null, 0)],
            ]),
          ),
        ],
      ]),
      units: initialMap.units
        .set(v4, SmallTank.create(2))
        .set(v7, Pioneer.create(3)),
    }),
    [RescueAction(v2, v3), EndTurnAction(), AttackUnitAction(v4, v3)],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseC))
    .toMatchInlineSnapshot(`
      "Rescue (1,2 → 1,3) { player: 1 }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      AttackUnit (2,3 → 1,3) { hasCounterAttack: false, playerA: 2, playerB: 0, unitA: DryUnit { health: 100, ammo: [ [ 1, 6 ] ] }, unitB: null, chargeA: 0, chargeB: null }
      GameEnd { condition: { hidden: false, label: [ 0, 3 ], players: [ 1 ], reward: null, type: 8 }, conditionId: 0, toPlayer: 2 }"
    `);

  const [, gameActionResponseD] = executeGameActions(
    initialMap.copy({
      buildings: initialMap.buildings.set(v3, House.create(1).setHealth(1)),
      units: initialMap.units.set(v4, SmallTank.create(2)),
    }),
    [RescueAction(v2, v3), EndTurnAction(), AttackBuildingAction(v4, v3)],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseD))
    .toMatchInlineSnapshot(`
      "Rescue (1,2 → 1,3) { player: 1 }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      AttackBuilding (2,3 → 1,3) { hasCounterAttack: false, playerA: 2, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 6 ] ] }, unitC: null, chargeA: null, chargeB: 1366, chargeC: 1 }
      GameEnd { condition: { hidden: false, label: [ 0, 3 ], players: [ 1 ], reward: null, type: 8 }, conditionId: 0, toPlayer: 2 }"
    `);
});
