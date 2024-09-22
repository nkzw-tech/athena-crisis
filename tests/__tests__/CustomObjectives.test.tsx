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
import { Effect } from '@deities/apollo/Effects.tsx';
import gameHasEnded from '@deities/apollo/lib/gameHasEnded.tsx';
import {
  CrashedAirplane,
  Factory,
  House,
  HQ,
} from '@deities/athena/info/Building.tsx';
import { Skill } from '@deities/athena/info/Skill.tsx';
import { ConstructionSite } from '@deities/athena/info/Tile.tsx';
import {
  Alien,
  Bomber,
  Brute,
  Flamethrower,
  HeavyTank,
  Helicopter,
  Infantry,
  Jeep,
  Pioneer,
  SmallTank,
  SuperTank,
  Zombie,
} from '@deities/athena/info/Unit.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import { Bot, HumanPlayer } from '@deities/athena/map/Player.tsx';
import Team from '@deities/athena/map/Team.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData, { SizeVector } from '@deities/athena/MapData.tsx';
import {
  Criteria,
  Objective,
  validateObjectives,
} from '@deities/athena/Objectives.tsx';
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

const defineObjectives = (objectives: ReadonlyArray<Objective>) =>
  ImmutableMap(objectives.map((objective, index) => [index, objective]));

const optional = (map: MapData) =>
  map.copy({
    config: map.config.copy({
      objectives: map.config.objectives
        .map((objective) => ({
          ...objective,
          optional: true,
        }))
        .set(map.config.objectives.size, {
          hidden: false,
          optional: false,
          type: Criteria.Default,
        }),
    }),
  });

test('default win criteria', async () => {
  const from = vec(1, 1);
  const to = vec(1, 2);
  const mapA = map.copy({
    units: map.units
      .set(from, Helicopter.create(player1))
      .set(to, Helicopter.create(player2).setHealth(1)),
  });

  const [, gameActionResponse] = await executeGameActions(mapA, [
    AttackUnitAction(from, to),
  ]);

  expect(
    snapshotEncodedActionResponse(gameActionResponse),
  ).toMatchInlineSnapshot(
    `
    "AttackUnit (1,1 → 1,2) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 7 ] ] }, unitB: null, chargeA: 0, chargeB: 3 }
    AttackUnitGameOver { fromPlayer: 2, toPlayer: 1 }
    GameEnd { objective: null, objectiveId: null, toPlayer: 1, chaosStars: null }"
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
  const mapA = map.copy({
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

  const [, gameActionResponseA] = await executeGameActions(mapA, [
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

  const mapWithConditions = mapA.copy({
    config: mapA.config.copy({
      objectives: defineObjectives([
        {
          amount: 4,
          hidden: false,
          optional: false,
          type: Criteria.CaptureAmount,
        },
      ]),
    }),
  });

  expect(validateObjectives(mapA)).toBe(true);
  expect(validateObjectives(mapWithConditions)).toBe(true);

  const [, gameActionResponseB] = await executeGameActions(mapWithConditions, [
    CaptureAction(v2),
    CaptureAction(v3),
    CaptureAction(v4),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseB))
    .toMatchInlineSnapshot(`
      "Capture (1,2) { building: House { id: 2, health: 100, player: 1 }, player: 2 }
      Capture (1,3) { building: House { id: 2, health: 100, player: 1 }, player: 2 }
      Capture (2,1) { building: House { id: 2, health: 100, player: 1 }, player: 2 }
      GameEnd { objective: { amount: 4, completed: Set(0) {}, hidden: false, optional: false, players: [], reward: null, type: 2 }, objectiveId: 0, toPlayer: 1, chaosStars: null }"
    `);

  const mapWithOptionalObjectives = optional(mapWithConditions);
  expect(validateObjectives(mapWithOptionalObjectives)).toBe(true);

  const [gameStateB_2, gameActionResponseB_2] = await executeGameActions(
    mapWithOptionalObjectives,
    [CaptureAction(v2), CaptureAction(v3), CaptureAction(v4)],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseB_2))
    .toMatchInlineSnapshot(`
      "Capture (1,2) { building: House { id: 2, health: 100, player: 1 }, player: 2 }
      Capture (1,3) { building: House { id: 2, health: 100, player: 1 }, player: 2 }
      Capture (2,1) { building: House { id: 2, health: 100, player: 1 }, player: 2 }
      OptionalObjective { objective: { amount: 4, completed: Set(1) { 1 }, hidden: false, optional: true, players: [], reward: null, type: 2 }, objectiveId: 0, toPlayer: 1 }"
    `);

  expect(gameHasEnded(gameStateB_2)).toBe(false);

  // Conditions can be asymmetrical.
  const mapWithAsymmetricConditions = mapA.copy({
    config: mapA.config.copy({
      objectives: defineObjectives([
        {
          amount: 1,
          hidden: false,
          optional: false,
          players: [2],
          type: Criteria.CaptureAmount,
        },
      ]),
    }),
  });
  const [, gameActionResponseC] = await executeGameActions(
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
      GameEnd { objective: { amount: 1, completed: Set(0) {}, hidden: false, optional: false, players: [ 2 ], reward: null, type: 2 }, objectiveId: 0, toPlayer: 2, chaosStars: null }"
    `);

  const mapWithAsymmetricalOptionalObjectives = optional(
    mapWithAsymmetricConditions,
  );

  expect(validateObjectives(mapWithAsymmetricalOptionalObjectives)).toBe(true);

  const [gameStateC_2, gameActionResponseC_2] = await executeGameActions(
    mapWithAsymmetricalOptionalObjectives,
    [
      CaptureAction(v2),
      CaptureAction(v3),
      CaptureAction(v4),
      EndTurnAction(),
      CaptureAction(v1),
    ],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseC_2))
    .toMatchInlineSnapshot(`
      "Capture (1,2) { building: House { id: 2, health: 100, player: 1 }, player: 2 }
      Capture (1,3) { building: House { id: 2, health: 100, player: 1 }, player: 2 }
      Capture (2,1) { building: House { id: 2, health: 100, player: 1 }, player: 2 }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 700, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      Capture (1,1) { building: House { id: 2, health: 100, player: 2 }, player: 1 }
      OptionalObjective { objective: { amount: 1, completed: Set(1) { 2 }, hidden: false, optional: true, players: [ 2 ], reward: null, type: 2 }, objectiveId: 0, toPlayer: 2 }"
    `);

  expect(gameHasEnded(gameStateC_2)).toBe(false);
});

test('capture amount win criteria also works when creating buildings', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(2, 2);
  const v3 = vec(3, 1);
  const mapA = map.copy({
    buildings: map.buildings
      .set(v1, House.create(player2))
      .set(v2, House.create(player2)),
    config: map.config.copy({
      objectives: defineObjectives([
        {
          amount: 3,
          hidden: false,
          optional: false,
          type: Criteria.CaptureAmount,
        },
      ]),
    }),
    map: [1, 1, ConstructionSite.id, 1, 1, 1, 1, 1, 1],
    units: map.units
      .set(v1, Pioneer.create(player1).capture())
      .set(v2, Pioneer.create(player1).capture())
      .set(v3, Pioneer.create(player1)),
  });

  expect(validateObjectives(mapA)).toBe(true);

  const [, gameActionResponseA] = await executeGameActions(mapA, [
    CaptureAction(v1),
    CaptureAction(v2),
    CreateBuildingAction(v3, Factory.id),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "Capture (1,1) { building: House { id: 2, health: 100, player: 1 }, player: 2 }
      Capture (2,2) { building: House { id: 2, health: 100, player: 1 }, player: 2 }
      CreateBuilding (3,1) { building: Factory { id: 3, health: 100, player: 1, completed: true } }
      GameEnd { objective: { amount: 3, completed: Set(0) {}, hidden: false, optional: false, players: [], reward: null, type: 2 }, objectiveId: 0, toPlayer: 1, chaosStars: null }"
    `);

  const mapWithOptionalObjectives = optional(mapA);

  expect(validateObjectives(mapWithOptionalObjectives)).toBe(true);

  const [gameStateB, gameActionResponseB] = await executeGameActions(
    mapWithOptionalObjectives,
    [
      CaptureAction(v1),
      CaptureAction(v2),
      CreateBuildingAction(v3, Factory.id),
    ],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseB))
    .toMatchInlineSnapshot(`
      "Capture (1,1) { building: House { id: 2, health: 100, player: 1 }, player: 2 }
      Capture (2,2) { building: House { id: 2, health: 100, player: 1 }, player: 2 }
      CreateBuilding (3,1) { building: Factory { id: 3, health: 100, player: 1, completed: true } }
      OptionalObjective { objective: { amount: 3, completed: Set(1) { 1 }, hidden: false, optional: true, players: [], reward: null, type: 2 }, objectiveId: 0, toPlayer: 1 }"
    `);

  expect(gameHasEnded(gameStateB)).toBe(false);
});

test('capture label win criteria', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v3 = vec(1, 3);
  const v4 = vec(2, 1);
  const v5 = vec(2, 2);
  const v6 = vec(2, 3);
  const mapA = map.copy({
    buildings: map.buildings
      .set(v1, House.create(player1))
      .set(v2, House.create(player2))
      .set(v3, House.create(player2, { label: 4 }))
      .set(v4, House.create(player2, { label: 3 }))
      .set(v5, House.create(player2, { label: 4 }))
      .set(v6, House.create(player2)),
    config: map.config.copy({
      objectives: defineObjectives([
        {
          hidden: false,
          label: new Set([4, 3]),
          optional: false,
          type: Criteria.CaptureLabel,
        },
      ]),
    }),
    units: map.units
      .set(v1, Pioneer.create(player2).capture())
      .set(v2, Pioneer.create(player1).capture())
      .set(v3, Pioneer.create(player1).capture())
      .set(v4, Pioneer.create(player1).capture())
      .set(v5, Pioneer.create(player1).capture()),
  });

  expect(validateObjectives(mapA)).toBe(true);

  const [, gameActionResponseA] = await executeGameActions(mapA, [
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
      GameEnd { objective: { completed: Set(0) {}, hidden: false, label: [ 4, 3 ], optional: false, players: [], reward: null, type: 1 }, objectiveId: 0, toPlayer: 1, chaosStars: null }"
    `);

  const mapWithOptionalObjectives = mapA.copy({
    config: mapA.config.copy({
      objectives: mapA.config.objectives.map((objective) => ({
        ...objective,
        optional: true,
      })),
    }),
  });

  expect(validateObjectives(mapA)).toBe(true);

  const [gameStateB, gameActionResponseB] = await executeGameActions(
    mapWithOptionalObjectives,
    [
      CaptureAction(v2),
      CaptureAction(v3),
      CaptureAction(v4),
      CaptureAction(v5),
    ],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseB))
    .toMatchInlineSnapshot(`
      "Capture (1,2) { building: House { id: 2, health: 100, player: 1 }, player: 2 }
      Capture (1,3) { building: House { id: 2, health: 100, player: 1, label: 4 }, player: 2 }
      Capture (2,1) { building: House { id: 2, health: 100, player: 1, label: 3 }, player: 2 }
      Capture (2,2) { building: House { id: 2, health: 100, player: 1, label: 4 }, player: 2 }
      OptionalObjective { objective: { completed: Set(1) { 1 }, hidden: false, label: [ 4, 3 ], optional: true, players: [], reward: null, type: 1 }, objectiveId: 0, toPlayer: 1 }"
    `);

  expect(gameHasEnded(gameStateB)).toBe(false);
});

test('capture label win criteria fails because building is destroyed', async () => {
  const v1 = vec(1, 3);
  const v2 = vec(2, 3);
  const mapA = map.copy({
    buildings: map.buildings.set(
      v1,
      House.create(0, { label: 1 }).setHealth(1),
    ),
    config: map.config.copy({
      objectives: defineObjectives([
        {
          hidden: false,
          label: new Set([1]),
          optional: false,
          players: [1],
          type: Criteria.CaptureLabel,
        },
      ]),
    }),
    units: map.units.set(v2, HeavyTank.create(player1)),
  });

  expect(validateObjectives(mapA)).toBe(true);

  const [, gameActionResponseA] = await executeGameActions(mapA, [
    AttackBuildingAction(v2, v1),
  ]);

  expect(
    snapshotEncodedActionResponse(gameActionResponseA),
  ).toMatchInlineSnapshot(
    `
    "AttackBuilding (2,3 → 1,3) { hasCounterAttack: false, playerA: 1, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 9 ] ] }, unitC: null, chargeA: null, chargeB: null, chargeC: null }
    GameEnd { objective: { completed: Set(0) {}, hidden: false, label: [ 1 ], optional: false, players: [ 1 ], reward: null, type: 1 }, objectiveId: 0, toPlayer: 2, chaosStars: null }"
  `,
  );

  const mapWithOptionalObjectives = optional(mapA);

  expect(validateObjectives(mapWithOptionalObjectives)).toBe(true);

  const [gameStateA_2, gameActionResponseA_2] = await executeGameActions(
    mapWithOptionalObjectives,
    [AttackBuildingAction(v2, v1)],
  );

  expect(
    snapshotEncodedActionResponse(gameActionResponseA_2),
  ).toMatchInlineSnapshot(
    `"AttackBuilding (2,3 → 1,3) { hasCounterAttack: false, playerA: 1, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 9 ] ] }, unitC: null, chargeA: null, chargeB: null, chargeC: null }"`,
  );

  expect(gameHasEnded(gameStateA_2)).toBe(false);

  const [, gameActionResponseB] = await executeGameActions(
    mapA.copy({ units: map.units.set(v2, HeavyTank.create(player2)) }),
    [EndTurnAction(), AttackBuildingAction(v2, v1)],
  );

  expect(
    snapshotEncodedActionResponse(gameActionResponseB),
  ).toMatchInlineSnapshot(
    `
    "EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
    AttackBuilding (2,3 → 1,3) { hasCounterAttack: false, playerA: 2, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 9 ] ] }, unitC: null, chargeA: null, chargeB: null, chargeC: null }
    GameEnd { objective: { completed: Set(0) {}, hidden: false, label: [ 1 ], optional: false, players: [ 1 ], reward: null, type: 1 }, objectiveId: 0, toPlayer: 2, chaosStars: null }"
  `,
  );

  const [gameStateB_2, gameActionResponseB_2] = await executeGameActions(
    mapWithOptionalObjectives.copy({
      units: map.units.set(v2, HeavyTank.create(player2)),
    }),
    [EndTurnAction(), AttackBuildingAction(v2, v1)],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseB_2))
    .toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      AttackBuilding (2,3 → 1,3) { hasCounterAttack: false, playerA: 2, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 9 ] ] }, unitC: null, chargeA: null, chargeB: null, chargeC: null }"
    `);

  expect(gameHasEnded(gameStateB_2)).toBe(false);
});

test('capture label win criteria (fail with missing label)', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const mapA = map.copy({
    buildings: map.buildings
      .set(v1, House.create(player2))
      .set(v2, House.create(player2)),
    config: map.config.copy({
      objectives: defineObjectives([
        {
          hidden: false,
          label: new Set([4, 3]),
          optional: false,
          type: Criteria.CaptureLabel,
        },
      ]),
    }),
    units: map.units
      .set(v1, Pioneer.create(player1).capture())
      .set(v2, Pioneer.create(player1).capture()),
  });

  expect(validateObjectives(mapA)).toBe(true);

  const [, gameActionResponseA] = await executeGameActions(mapA, [
    CaptureAction(v1),
    CaptureAction(v2),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "Capture (1,1) { building: House { id: 2, health: 100, player: 1 }, player: 2 }
      Capture (1,2) { building: House { id: 2, health: 100, player: 1 }, player: 2 }"
    `);

  const mapWithOptionalObjectives = optional(mapA);

  expect(validateObjectives(mapWithOptionalObjectives)).toBe(true);

  const [, gameActionResponseB] = await executeGameActions(
    mapWithOptionalObjectives,
    [CaptureAction(v1), CaptureAction(v2)],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseB))
    .toMatchInlineSnapshot(`
    "Capture (1,1) { building: House { id: 2, health: 100, player: 1 }, player: 2 }
    Capture (1,2) { building: House { id: 2, health: 100, player: 1 }, player: 2 }"
  `);
});

test('destroy amount win criteria', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v3 = vec(1, 3);
  const v4 = vec(1, 4);
  const mapA = map.copy({
    buildings: map.buildings
      .set(v1, House.create(player1).setHealth(1))
      .set(v2, House.create(player2).setHealth(1))
      .set(v3, House.create(player2).setHealth(1)),
    units: map.units
      .set(v1.right(), Bomber.create(player2).capture())
      .set(v2.right(), Bomber.create(player1).capture())
      .set(v3.right(), Bomber.create(player1).capture()),
  });

  const [, gameActionResponseA] = await executeGameActions(mapA, [
    AttackBuildingAction(v2.right(), v2),
    AttackBuildingAction(v3.right(), v3),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "AttackBuilding (2,2 → 1,2) { hasCounterAttack: false, playerA: 1, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, unitC: null, chargeA: null, chargeB: 1200, chargeC: null }
      AttackBuilding (2,3 → 1,3) { hasCounterAttack: false, playerA: 1, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, unitC: null, chargeA: null, chargeB: 2400, chargeC: null }"
    `);

  const mapWithConditions = mapA.copy({
    config: mapA.config.copy({
      objectives: defineObjectives([
        {
          amount: 2,
          hidden: false,
          optional: false,
          type: Criteria.DestroyAmount,
        },
      ]),
    }),
  });

  expect(validateObjectives(mapA)).toBe(true);
  expect(validateObjectives(mapWithConditions)).toBe(true);

  const [, gameActionResponseB] = await executeGameActions(mapWithConditions, [
    AttackBuildingAction(v2.right(), v2),
    AttackBuildingAction(v3.right(), v3),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseB))
    .toMatchInlineSnapshot(`
      "AttackBuilding (2,2 → 1,2) { hasCounterAttack: false, playerA: 1, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, unitC: null, chargeA: null, chargeB: 1200, chargeC: null }
      AttackBuilding (2,3 → 1,3) { hasCounterAttack: false, playerA: 1, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, unitC: null, chargeA: null, chargeB: 2400, chargeC: null }
      GameEnd { objective: { amount: 2, completed: Set(0) {}, hidden: false, optional: false, players: [], reward: null, type: 12 }, objectiveId: 0, toPlayer: 1, chaosStars: null }"
    `);

  const mapWithOptionalObjectives = map.copy({
    buildings: map.buildings
      .set(v1, House.create(player1).setHealth(1))
      .set(v2, House.create(player1).setHealth(1))
      .set(v3, House.create(player2).setHealth(1))
      .set(v4, House.create(player2).setHealth(1)),
    config: map.config.copy({
      objectives: defineObjectives([
        {
          amount: 2,
          hidden: false,
          optional: true,
          type: Criteria.DestroyAmount,
        },
        { hidden: false, type: Criteria.Default },
      ]),
    }),
    map: Array(3 * 4).fill(1),
    size: new SizeVector(3, 4),
    units: map.units
      .set(v1.right(), Bomber.create(player2).capture())
      .set(v2.right(), Bomber.create(player2).capture())
      .set(v3.right(), Bomber.create(player1).capture())
      .set(v4.right(), Bomber.create(player1).capture()),
  });

  expect(validateObjectives(mapWithOptionalObjectives)).toBe(true);

  const [gameStateB_2, gameActionResponseB_2] = await executeGameActions(
    mapWithOptionalObjectives,
    [
      AttackBuildingAction(v3.right(), v3),
      AttackBuildingAction(v4.right(), v4),
      EndTurnAction(),
      AttackBuildingAction(v1.right(), v1),
      AttackBuildingAction(v2.right(), v2),
    ],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseB_2))
    .toMatchInlineSnapshot(`
      "AttackBuilding (2,3 → 1,3) { hasCounterAttack: false, playerA: 1, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, unitC: null, chargeA: null, chargeB: 1200, chargeC: null }
      AttackBuilding (2,4 → 1,4) { hasCounterAttack: false, playerA: 1, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, unitC: null, chargeA: null, chargeB: 2400, chargeC: null }
      OptionalObjective { objective: { amount: 2, completed: Set(1) { 1 }, hidden: false, optional: true, players: [], reward: null, type: 12 }, objectiveId: 0, toPlayer: 1 }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      AttackBuilding (2,1 → 1,1) { hasCounterAttack: false, playerA: 2, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, unitC: null, chargeA: null, chargeB: 1200, chargeC: null }
      AttackBuilding (2,2 → 1,2) { hasCounterAttack: false, playerA: 2, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, unitC: null, chargeA: null, chargeB: 2400, chargeC: null }
      OptionalObjective { objective: { amount: 2, completed: Set(2) { 1, 2 }, hidden: false, optional: true, players: [], reward: null, type: 12 }, objectiveId: 0, toPlayer: 2 }"
    `);

  expect(gameHasEnded(gameStateB_2)).toBe(false);

  // Conditions can be asymmetrical.
  const mapWithAsymmetricConditions = mapA.copy({
    config: mapA.config.copy({
      objectives: defineObjectives([
        {
          amount: 1,
          hidden: false,
          optional: false,
          players: [2],
          type: Criteria.DestroyAmount,
        },
      ]),
    }),
  });
  const [, gameActionResponseC] = await executeGameActions(
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
      "AttackBuilding (2,2 → 1,2) { hasCounterAttack: false, playerA: 1, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, unitC: null, chargeA: null, chargeB: 1200, chargeC: null }
      AttackBuilding (2,3 → 1,3) { hasCounterAttack: false, playerA: 1, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, unitC: null, chargeA: null, chargeB: 2400, chargeC: null }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      AttackBuilding (2,1 → 1,1) { hasCounterAttack: false, playerA: 2, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, unitC: null, chargeA: null, chargeB: 1200, chargeC: null }
      GameEnd { objective: { amount: 1, completed: Set(0) {}, hidden: false, optional: false, players: [ 2 ], reward: null, type: 12 }, objectiveId: 0, toPlayer: 2, chaosStars: null }"
    `);

  const mapWithAsymmetricOptionalObjectives = optional(
    mapWithAsymmetricConditions,
  );

  expect(validateObjectives(mapWithAsymmetricOptionalObjectives)).toBe(true);

  const [gameStateC_2, gameActionResponseC_2] = await executeGameActions(
    mapWithAsymmetricOptionalObjectives,
    [
      AttackBuildingAction(v2.right(), v2),
      AttackBuildingAction(v3.right(), v3),
      EndTurnAction(),
      AttackBuildingAction(v1.right(), v1),
    ],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseC_2))
    .toMatchInlineSnapshot(`
      "AttackBuilding (2,2 → 1,2) { hasCounterAttack: false, playerA: 1, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, unitC: null, chargeA: null, chargeB: 1200, chargeC: null }
      AttackBuilding (2,3 → 1,3) { hasCounterAttack: false, playerA: 1, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, unitC: null, chargeA: null, chargeB: 2400, chargeC: null }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      AttackBuilding (2,1 → 1,1) { hasCounterAttack: false, playerA: 2, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, unitC: null, chargeA: null, chargeB: 1200, chargeC: null }
      OptionalObjective { objective: { amount: 1, completed: Set(1) { 2 }, hidden: false, optional: true, players: [ 2 ], reward: null, type: 12 }, objectiveId: 0, toPlayer: 2 }"
    `);

  expect(gameHasEnded(gameStateC_2)).toBe(false);
});

test('destroy label win criteria', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v3 = vec(1, 3);
  const v4 = vec(3, 1);
  const v5 = vec(3, 2);
  const mapA = map.copy({
    buildings: map.buildings
      .set(v1, House.create(player2).setHealth(1))
      .set(v2, House.create(player2, { label: 4 }).setHealth(1))
      .set(v3, House.create(player2, { label: 3 }).setHealth(1))
      .set(v4, House.create(player2, { label: 4 }).setHealth(1))
      .set(v5, House.create(player2).setHealth(1)),
    config: map.config.copy({
      objectives: defineObjectives([
        {
          hidden: false,
          label: new Set([4, 3]),
          optional: false,
          type: Criteria.DestroyLabel,
        },
      ]),
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

  expect(validateObjectives(mapA)).toBe(true);

  const [, gameActionResponseA] = await executeGameActions(mapA, [
    AttackBuildingAction(v1.right(), v1),
    AttackBuildingAction(v2.right(), v2),
    AttackBuildingAction(v3.right(), v3),
    AttackBuildingAction(v4.right(), v4),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "AttackBuilding (2,1 → 1,1) { hasCounterAttack: false, playerA: 1, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, unitC: null, chargeA: null, chargeB: 1200, chargeC: null }
      AttackBuilding (2,2 → 1,2) { hasCounterAttack: false, playerA: 1, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, unitC: null, chargeA: null, chargeB: 2400, chargeC: null }
      AttackBuilding (2,3 → 1,3) { hasCounterAttack: false, playerA: 1, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, unitC: null, chargeA: null, chargeB: 3600, chargeC: null }
      AttackBuilding (4,1 → 3,1) { hasCounterAttack: false, playerA: 1, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, unitC: null, chargeA: null, chargeB: 4800, chargeC: null }
      GameEnd { objective: { completed: Set(0) {}, hidden: false, label: [ 4, 3 ], optional: false, players: [], reward: null, type: 11 }, objectiveId: 0, toPlayer: 1, chaosStars: null }"
    `);

  const mapWithOptionalObjectives = optional(mapA);

  expect(validateObjectives(mapWithOptionalObjectives)).toBe(true);

  const [gameStateB, gameActionResponseB] = await executeGameActions(
    mapWithOptionalObjectives,
    [
      AttackBuildingAction(v1.right(), v1),
      AttackBuildingAction(v2.right(), v2),
      AttackBuildingAction(v3.right(), v3),
      AttackBuildingAction(v4.right(), v4),
    ],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseB))
    .toMatchInlineSnapshot(`
      "AttackBuilding (2,1 → 1,1) { hasCounterAttack: false, playerA: 1, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, unitC: null, chargeA: null, chargeB: 1200, chargeC: null }
      AttackBuilding (2,2 → 1,2) { hasCounterAttack: false, playerA: 1, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, unitC: null, chargeA: null, chargeB: 2400, chargeC: null }
      AttackBuilding (2,3 → 1,3) { hasCounterAttack: false, playerA: 1, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, unitC: null, chargeA: null, chargeB: 3600, chargeC: null }
      AttackBuilding (4,1 → 3,1) { hasCounterAttack: false, playerA: 1, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, unitC: null, chargeA: null, chargeB: 4800, chargeC: null }
      OptionalObjective { objective: { completed: Set(1) { 1 }, hidden: false, label: [ 4, 3 ], optional: true, players: [], reward: null, type: 11 }, objectiveId: 0, toPlayer: 1 }"
    `);

  expect(gameHasEnded(gameStateB)).toBe(false);
});

test('destroy label does not fire without label', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v3 = vec(3, 2);
  const mapA = map.copy({
    buildings: map.buildings
      .set(v1, House.create(player2).setHealth(1))
      .set(v2, House.create(player2).setHealth(1))
      .set(v3, House.create(player2).setHealth(1)),
    config: map.config.copy({
      objectives: defineObjectives([
        {
          hidden: false,
          label: new Set([4, 3]),
          optional: false,
          type: Criteria.DestroyLabel,
        },
      ]),
    }),
    map: Array(4 * 3).fill(1),
    size: new SizeVector(4, 3),
    units: map.units
      .set(v1.right(), Bomber.create(player1))
      .set(v2.right(), Bomber.create(player1))
      .set(v3, Pioneer.create(player2)),
  });

  expect(validateObjectives(mapA)).toBe(true);

  const [, gameActionResponseA] = await executeGameActions(mapA, [
    AttackBuildingAction(v1.right(), v1),
    AttackBuildingAction(v2.right(), v2),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "AttackBuilding (2,1 → 1,1) { hasCounterAttack: false, playerA: 1, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, unitC: null, chargeA: null, chargeB: 1200, chargeC: null }
      AttackBuilding (2,2 → 1,2) { hasCounterAttack: false, playerA: 1, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, unitC: null, chargeA: null, chargeB: 2400, chargeC: null }"
    `);

  const mapWithOptionalObjectives = optional(mapA);

  expect(validateObjectives(mapWithOptionalObjectives)).toBe(true);

  const [, gameActionResponseB] = await executeGameActions(
    mapWithOptionalObjectives,
    [
      AttackBuildingAction(v1.right(), v1),
      AttackBuildingAction(v2.right(), v2),
    ],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseB))
    .toMatchInlineSnapshot(`
      "AttackBuilding (2,1 → 1,1) { hasCounterAttack: false, playerA: 1, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, unitC: null, chargeA: null, chargeB: 1200, chargeC: null }
      AttackBuilding (2,2 → 1,2) { hasCounterAttack: false, playerA: 1, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, unitC: null, chargeA: null, chargeB: 2400, chargeC: null }"
    `);
});

test('destroy label win criteria (neutral structure)', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v3 = vec(1, 3);
  const mapA = map.copy({
    buildings: map.buildings
      .set(v1, CrashedAirplane.create(0, { label: 3 }).setHealth(1))
      .set(v2, House.create(player2).setHealth(1)),
    config: map.config.copy({
      objectives: defineObjectives([
        {
          hidden: false,
          label: new Set([3]),
          optional: false,
          type: Criteria.DestroyLabel,
        },
      ]),
    }),
    units: map.units
      .set(v1.right(), Bomber.create(player1))
      .set(v2.right(), Bomber.create(player1))
      .set(v3, Pioneer.create(player2)),
  });

  const [, gameActionResponseA] = await executeGameActions(mapA, [
    AttackBuildingAction(v2.right(), v2),
    AttackBuildingAction(v1.right(), v1),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "AttackBuilding (2,2 → 1,2) { hasCounterAttack: false, playerA: 1, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, unitC: null, chargeA: null, chargeB: 1200, chargeC: null }
      AttackBuilding (2,1 → 1,1) { hasCounterAttack: false, playerA: 1, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, unitC: null, chargeA: null, chargeB: null, chargeC: null }
      GameEnd { objective: { completed: Set(0) {}, hidden: false, label: [ 3 ], optional: false, players: [], reward: null, type: 11 }, objectiveId: 0, toPlayer: 1, chaosStars: null }"
    `);

  const mapWithOptionalObjectives = optional(mapA);

  expect(validateObjectives(mapWithOptionalObjectives)).toBe(true);

  const [gameStateB, gameActionResponseB] = await executeGameActions(
    mapWithOptionalObjectives,
    [
      AttackBuildingAction(v2.right(), v2),
      AttackBuildingAction(v1.right(), v1),
    ],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseB))
    .toMatchInlineSnapshot(`
      "AttackBuilding (2,2 → 1,2) { hasCounterAttack: false, playerA: 1, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, unitC: null, chargeA: null, chargeB: 1200, chargeC: null }
      AttackBuilding (2,1 → 1,1) { hasCounterAttack: false, playerA: 1, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, unitC: null, chargeA: null, chargeB: null, chargeC: null }
      OptionalObjective { objective: { completed: Set(1) { 1 }, hidden: false, label: [ 3 ], optional: true, players: [], reward: null, type: 11 }, objectiveId: 0, toPlayer: 1 }"
    `);

  expect(gameHasEnded(gameStateB)).toBe(false);
});

test('defeat with label', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v3 = vec(1, 3);
  const v4 = vec(2, 1);
  const v5 = vec(2, 2);
  const v6 = vec(2, 3);
  const v7 = vec(3, 1);
  const mapA = map.copy({
    buildings: map.buildings.set(v1, House.create(player2, { label: 2 })),
    config: map.config.copy({
      objectives: defineObjectives([
        {
          hidden: false,
          label: new Set([4, 2]),
          optional: false,
          type: Criteria.DefeatLabel,
        },
      ]),
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

  expect(validateObjectives(mapA)).toBe(true);

  const [, gameActionResponseA] = await executeGameActions(mapA, [
    AttackUnitAction(v1, v2),
    AttackUnitAction(v3, v6),
    AttackUnitAction(v5, v4),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "AttackUnit (1,1 → 1,2) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 33, chargeB: 100 }
      AttackUnit (1,3 → 2,3) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 66, chargeB: 200 }
      AttackUnit (2,2 → 2,1) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 99, chargeB: 300 }
      GameEnd { objective: { completed: Set(0) {}, hidden: false, label: [ 4, 2 ], optional: false, players: [], reward: null, type: 3 }, objectiveId: 0, toPlayer: 1, chaosStars: null }"
    `);

  const mapWithOptionalObjectives = optional(mapA);

  expect(validateObjectives(mapWithOptionalObjectives)).toBe(true);

  const [gameStateB, gameActionResponseB] = await executeGameActions(
    mapWithOptionalObjectives,
    [
      AttackUnitAction(v1, v2),
      AttackUnitAction(v3, v6),
      AttackUnitAction(v5, v4),
    ],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseB))
    .toMatchInlineSnapshot(`
      "AttackUnit (1,1 → 1,2) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 33, chargeB: 100 }
      AttackUnit (1,3 → 2,3) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 66, chargeB: 200 }
      AttackUnit (2,2 → 2,1) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 99, chargeB: 300 }
      OptionalObjective { objective: { completed: Set(1) { 1 }, hidden: false, label: [ 4, 2 ], optional: true, players: [], reward: null, type: 3 }, objectiveId: 0, toPlayer: 1 }"
    `);

  expect(gameHasEnded(gameStateB)).toBe(false);
});

test('defeat one with label', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v3 = vec(2, 2);
  const v4 = vec(2, 1);
  const v5 = vec(3, 1);
  const mapA = map.copy({
    config: map.config.copy({
      objectives: defineObjectives([
        {
          hidden: false,
          label: new Set([4, 2]),
          optional: false,
          type: Criteria.DefeatOneLabel,
        },
      ]),
    }),
    units: map.units
      .set(v1, Flamethrower.create(player1))
      .set(v2, Pioneer.create(player2))
      .set(v3, Flamethrower.create(player1))
      .set(v4, Pioneer.create(player2, { label: 4 }))
      .set(v5, Pioneer.create(player2)),
  });

  expect(validateObjectives(mapA)).toBe(true);

  const [, gameActionResponseA] = await executeGameActions(mapA, [
    AttackUnitAction(v1, v2),
    AttackUnitAction(v3, v4),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "AttackUnit (1,1 → 1,2) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 33, chargeB: 100 }
      AttackUnit (2,2 → 2,1) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 66, chargeB: 200 }
      GameEnd { objective: { completed: Set(0) {}, hidden: false, label: [ 4, 2 ], optional: false, players: [], reward: null, type: 10 }, objectiveId: 0, toPlayer: 1, chaosStars: null }"
    `);

  const mapWithOptionalObjectives = optional(mapA);

  expect(validateObjectives(mapWithOptionalObjectives)).toBe(true);

  const [gameStateB, gameActionResponseB] = await executeGameActions(
    mapWithOptionalObjectives,
    [AttackUnitAction(v1, v2), AttackUnitAction(v3, v4)],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseB))
    .toMatchInlineSnapshot(`
      "AttackUnit (1,1 → 1,2) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 33, chargeB: 100 }
      AttackUnit (2,2 → 2,1) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 66, chargeB: 200 }
      OptionalObjective { objective: { completed: Set(1) { 1 }, hidden: false, label: [ 4, 2 ], optional: true, players: [], reward: null, type: 10 }, objectiveId: 0, toPlayer: 1 }"
    `);

  expect(gameHasEnded(gameStateB)).toBe(false);
});

test('defeat by amount', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v3 = vec(1, 3);
  const v4 = vec(2, 1);
  const v5 = vec(2, 2);
  const v6 = vec(2, 3);
  const v7 = vec(3, 1);
  const mapA = map.copy({
    config: map.config.copy({
      objectives: defineObjectives([
        {
          amount: 3,
          hidden: false,
          optional: false,
          type: Criteria.DefeatAmount,
        },
      ]),
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

  expect(validateObjectives(mapA)).toBe(true);

  const [, gameActionResponseA] = await executeGameActions(mapA, [
    AttackUnitAction(v1, v2),
    AttackUnitAction(v3, v6),
    AttackUnitAction(v5, v4),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "AttackUnit (1,1 → 1,2) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 33, chargeB: 100 }
      AttackUnit (1,3 → 2,3) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 66, chargeB: 200 }
      AttackUnit (2,2 → 2,1) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 99, chargeB: 300 }
      GameEnd { objective: { amount: 3, completed: Set(0) {}, hidden: false, optional: false, players: [], reward: null, type: 9 }, objectiveId: 0, toPlayer: 1, chaosStars: null }"
    `);

  const mapWithOptionalObjectives = optional(mapA);

  expect(validateObjectives(mapWithOptionalObjectives)).toBe(true);

  const [gameStateB, gameActionResponseB] = await executeGameActions(
    mapWithOptionalObjectives,
    [
      AttackUnitAction(v1, v2),
      AttackUnitAction(v3, v6),
      AttackUnitAction(v5, v4),
    ],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseB))
    .toMatchInlineSnapshot(`
      "AttackUnit (1,1 → 1,2) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 33, chargeB: 100 }
      AttackUnit (1,3 → 2,3) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 66, chargeB: 200 }
      AttackUnit (2,2 → 2,1) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 99, chargeB: 300 }
      OptionalObjective { objective: { amount: 3, completed: Set(1) { 1 }, hidden: false, optional: true, players: [], reward: null, type: 9 }, objectiveId: 0, toPlayer: 1 }"
    `);

  expect(gameHasEnded(gameStateB)).toBe(false);
});

test('defeat by amount through counter attack', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v3 = vec(1, 3);
  const mapA = map.copy({
    config: map.config.copy({
      objectives: defineObjectives([
        {
          amount: 1,
          hidden: false,
          optional: false,
          type: Criteria.DefeatAmount,
        },
      ]),
    }),
    units: map.units
      .set(v1, Flamethrower.create(player1).setHealth(1))
      .set(v2, Flamethrower.create(player2))
      .set(v3, Flamethrower.create(player1)),
  });

  expect(validateObjectives(mapA)).toBe(true);

  const [, gameActionResponseA] = await executeGameActions(mapA, [
    AttackUnitAction(v1, v2),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "AttackUnit (1,1 → 1,2) { hasCounterAttack: true, playerA: 1, playerB: 2, unitA: null, unitB: DryUnit { health: 56, ammo: [ [ 1, 3 ] ] }, chargeA: 62, chargeB: 176 }
      GameEnd { objective: { amount: 1, completed: Set(0) {}, hidden: false, optional: false, players: [], reward: null, type: 9 }, objectiveId: 0, toPlayer: 2, chaosStars: null }"
    `);

  const mapWithOptionalObjectives = optional(mapA);

  expect(validateObjectives(mapWithOptionalObjectives)).toBe(true);

  const [gameStateB, gameActionResponseB] = await executeGameActions(
    mapWithOptionalObjectives,
    [AttackUnitAction(v1, v2)],
  );

  expect(
    snapshotEncodedActionResponse(gameActionResponseB),
  ).toMatchInlineSnapshot(
    `
    "AttackUnit (1,1 → 1,2) { hasCounterAttack: true, playerA: 1, playerB: 2, unitA: null, unitB: DryUnit { health: 56, ammo: [ [ 1, 3 ] ] }, chargeA: 62, chargeB: 176 }
    OptionalObjective { objective: { amount: 1, completed: Set(1) { 2 }, hidden: false, optional: true, players: [], reward: null, type: 9 }, objectiveId: 0, toPlayer: 2 }"
  `,
  );

  expect(gameHasEnded(gameStateB)).toBe(false);
});

test('defeat with label and Zombie', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v3 = vec(1, 3);
  const mapA = map.copy({
    config: map.config.copy({
      objectives: defineObjectives([
        {
          hidden: false,
          label: new Set([2]),
          optional: false,
          type: Criteria.DefeatLabel,
        },
      ]),
    }),
    units: map.units
      .set(v1, Zombie.create(player1))
      .set(v2, Flamethrower.create(player2, { label: 2 }))
      .set(v3, Flamethrower.create(player2)),
  });

  expect(validateObjectives(mapA)).toBe(true);

  const [, gameActionResponseA] = await executeGameActions(mapA, [
    AttackUnitAction(v1, v2),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "AttackUnit (1,1 → 1,2) { hasCounterAttack: true, playerA: 1, playerB: 2, unitA: DryUnit { health: 48, ammo: [ [ 1, 4 ] ] }, unitB: DryUnit { health: 30, ammo: [ [ 1, 3 ] ] }, chargeA: 300, chargeB: 280 }
      GameEnd { objective: { completed: Set(0) {}, hidden: false, label: [ 2 ], optional: false, players: [], reward: null, type: 3 }, objectiveId: 0, toPlayer: 1, chaosStars: null }"
    `);

  const mapWithOptionalObjectives = optional(mapA);

  expect(validateObjectives(mapWithOptionalObjectives)).toBe(true);

  const [gameStateB, gameActionResponseB] = await executeGameActions(
    mapWithOptionalObjectives,
    [AttackUnitAction(v1, v2)],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseB))
    .toMatchInlineSnapshot(`
      "AttackUnit (1,1 → 1,2) { hasCounterAttack: true, playerA: 1, playerB: 2, unitA: DryUnit { health: 48, ammo: [ [ 1, 4 ] ] }, unitB: DryUnit { health: 30, ammo: [ [ 1, 3 ] ] }, chargeA: 300, chargeB: 280 }
      OptionalObjective { objective: { completed: Set(1) { 1 }, hidden: false, label: [ 2 ], optional: true, players: [], reward: null, type: 3 }, objectiveId: 0, toPlayer: 1 }"
    `);

  expect(gameHasEnded(gameStateB)).toBe(false);
});

test('defeat by amount and Zombie', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v3 = vec(2, 2);
  const mapA = map.copy({
    config: map.config.copy({
      objectives: defineObjectives([
        {
          amount: 1,
          hidden: false,
          optional: false,
          type: Criteria.DefeatAmount,
        },
      ]),
    }),
    units: map.units
      .set(v1, Zombie.create(player1))
      .set(v2, Infantry.create(player2))
      .set(v3, Infantry.create(player2)),
  });

  expect(validateObjectives(mapA)).toBe(true);

  const [, gameActionResponseA] = await executeGameActions(mapA, [
    AttackUnitAction(v1, v2),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "AttackUnit (1,1 → 1,2) { hasCounterAttack: true, playerA: 1, playerB: 2, unitA: DryUnit { health: 75, ammo: [ [ 1, 4 ] ] }, unitB: DryUnit { health: 35 }, chargeA: 142, chargeB: 130 }
      GameEnd { objective: { amount: 1, completed: Set(0) {}, hidden: false, optional: false, players: [], reward: null, type: 9 }, objectiveId: 0, toPlayer: 1, chaosStars: null }"
    `);

  const mapWithOptionalObjectives = optional(mapA);

  expect(validateObjectives(mapWithOptionalObjectives)).toBe(true);

  const [gameStateB, gameActionResponseB] = await executeGameActions(
    mapWithOptionalObjectives,
    [AttackUnitAction(v1, v2)],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseB))
    .toMatchInlineSnapshot(`
      "AttackUnit (1,1 → 1,2) { hasCounterAttack: true, playerA: 1, playerB: 2, unitA: DryUnit { health: 75, ammo: [ [ 1, 4 ] ] }, unitB: DryUnit { health: 35 }, chargeA: 142, chargeB: 130 }
      OptionalObjective { objective: { amount: 1, completed: Set(1) { 1 }, hidden: false, optional: true, players: [], reward: null, type: 9 }, objectiveId: 0, toPlayer: 1 }"
    `);

  expect(gameHasEnded(gameStateB)).toBe(false);
});

test('defeat with label (fail because label did not previously exist)', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v3 = vec(1, 3);
  const v4 = vec(2, 3);
  const v5 = vec(3, 3);
  const mapA = map.copy({
    config: map.config.copy({
      objectives: defineObjectives([
        {
          hidden: false,
          label: new Set([4]),
          optional: false,
          type: Criteria.DefeatLabel,
        },
      ]),
    }),
    units: map.units
      .set(v1, Flamethrower.create(player1))
      .set(v2, Pioneer.create(player2))
      .set(v3, Flamethrower.create(player1))
      .set(v4, Pioneer.create(player2))
      .set(v5, Pioneer.create(player2)),
  });

  expect(validateObjectives(mapA)).toBe(true);

  const [, gameActionResponseA] = await executeGameActions(mapA, [
    AttackUnitAction(v1, v2),
    AttackUnitAction(v3, v4),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "AttackUnit (1,1 → 1,2) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 33, chargeB: 100 }
      AttackUnit (1,3 → 2,3) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 66, chargeB: 200 }"
    `);

  const mapWithOptionalObjectives = optional(mapA);

  expect(validateObjectives(mapWithOptionalObjectives)).toBe(true);

  const [, gameActionResponseB] = await executeGameActions(
    mapWithOptionalObjectives,
    [AttackUnitAction(v1, v2), AttackUnitAction(v3, v4)],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseB))
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
  const mapA = map.copy({
    config: map.config.copy({
      objectives: defineObjectives([
        {
          hidden: false,
          label: new Set([4, 2]),
          optional: false,
          players: [1],
          type: Criteria.DefeatLabel,
        },
      ]),
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

  expect(validateObjectives(mapA)).toBe(true);

  const [, gameActionResponseA] = await executeGameActions(mapA, [
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
      GameEnd { objective: { completed: Set(0) {}, hidden: false, label: [ 4, 2 ], optional: false, players: [ 1 ], reward: null, type: 3 }, objectiveId: 0, toPlayer: 1, chaosStars: null }"
    `);

  const mapWithOptionalObjectives = optional(mapA);

  expect(validateObjectives(mapWithOptionalObjectives)).toBe(true);

  const [gameStateB, gameActionResponseB] = await executeGameActions(
    mapWithOptionalObjectives,
    [
      EndTurnAction(),
      MoveAction(v3, v2),
      EndTurnAction(),
      AttackUnitAction(v9, v6),
      AttackUnitAction(v1, v2),
      AttackUnitAction(v5, v2),
    ],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseB))
    .toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      Move (1,3 → 1,2) { fuel: 39, completed: false, path: [1,2] }
      EndTurn { current: { funds: 500, player: 2 }, next: { funds: 500, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }
      AttackUnit (3,3 → 2,3) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 33, chargeB: 100 }
      AttackUnit (1,1 → 1,2) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 6 ] ] }, unitB: DryUnit { health: 20 }, chargeA: 72, chargeB: 220 }
      AttackUnit (2,2 → 1,2) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 6 ] ] }, unitB: null, chargeA: 81, chargeB: 250 }
      OptionalObjective { objective: { completed: Set(1) { 1 }, hidden: false, label: [ 4, 2 ], optional: true, players: [ 1 ], reward: null, type: 3 }, objectiveId: 0, toPlayer: 1 }"
    `);

  expect(gameHasEnded(gameStateB)).toBe(false);
});

test('win by survival', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v3 = vec(2, 1);
  const mapA = map.copy({
    config: map.config.copy({
      objectives: defineObjectives([
        {
          hidden: false,
          optional: false,
          players: [1],
          rounds: 3,
          type: Criteria.Survival,
        },
      ]),
    }),
    units: map.units
      .set(v1, Flamethrower.create(player1))
      .set(v2, Pioneer.create(player2)),
  });

  expect(validateObjectives(mapA)).toBe(true);

  const [, gameActionResponseA] = await executeGameActions(mapA, [
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
      GameEnd { objective: { completed: Set(0) {}, hidden: false, optional: false, players: [ 1 ], reward: null, rounds: 3, type: 5 }, objectiveId: 0, toPlayer: 1, chaosStars: null }"
    `);

  const mapWithOptionalObjectives = optional(mapA);

  expect(validateObjectives(mapWithOptionalObjectives)).toBe(true);

  const [gameStateB, gameActionResponseB] = await executeGameActions(
    mapWithOptionalObjectives,
    [
      EndTurnAction(),
      EndTurnAction(),
      EndTurnAction(),
      EndTurnAction(),
      MoveAction(v1, v3),
    ],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseB))
    .toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      EndTurn { current: { funds: 500, player: 2 }, next: { funds: 500, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 2, rotatePlayers: false, supply: null, miss: false }
      EndTurn { current: { funds: 500, player: 2 }, next: { funds: 500, player: 1 }, round: 3, rotatePlayers: false, supply: null, miss: false }
      OptionalObjective { objective: { completed: Set(1) { 1 }, hidden: false, optional: true, players: [ 1 ], reward: null, rounds: 3, type: 5 }, objectiveId: 0, toPlayer: 1 }
      Move (1,1 → 2,1) { fuel: 29, completed: false, path: [2,1] }"
    `);

  expect(gameHasEnded(gameStateB)).toBe(false);
});

test('win by survival in one round', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const mapA = map.copy({
    config: map.config.copy({
      objectives: defineObjectives([
        {
          hidden: false,
          optional: false,
          players: [2],
          rounds: 1,
          type: Criteria.Survival,
        },
      ]),
    }),
    units: map.units
      .set(v1, Flamethrower.create(player1))
      .set(v2, Pioneer.create(player2)),
  });

  expect(
    validateObjectives(
      mapA.copy({
        config: mapA.config.copy({
          objectives: defineObjectives([
            {
              hidden: false,
              optional: false,
              players: [1],
              rounds: 1,
              type: Criteria.Survival,
            } as const,
          ]),
        }),
      }),
    ),
  ).toBe(false);

  expect(validateObjectives(mapA)).toBe(true);

  const [, gameActionResponseA] = await executeGameActions(mapA, [
    EndTurnAction(),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      GameEnd { objective: { completed: Set(0) {}, hidden: false, optional: false, players: [ 2 ], reward: null, rounds: 1, type: 5 }, objectiveId: 0, toPlayer: 2, chaosStars: null }"
    `);

  const mapWithOptionalObjectives = optional(mapA);

  expect(
    validateObjectives(
      mapWithOptionalObjectives.copy({
        config: mapWithOptionalObjectives.config.copy({
          objectives: defineObjectives([
            { hidden: false, type: Criteria.Default },
            {
              hidden: false,
              optional: true,
              players: [1],
              rounds: 1,
              type: Criteria.Survival,
            } as const,
          ]),
        }),
      }),
    ),
  ).toBe(false);

  expect(validateObjectives(mapWithOptionalObjectives)).toBe(true);

  const [gameStateB, gameActionResponseB] = await executeGameActions(
    mapWithOptionalObjectives,
    [EndTurnAction()],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseB))
    .toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      OptionalObjective { objective: { completed: Set(1) { 2 }, hidden: false, optional: true, players: [ 2 ], reward: null, rounds: 1, type: 5 }, objectiveId: 0, toPlayer: 2 }"
    `);

  expect(gameHasEnded(gameStateB)).toBe(false);
});

test('win by survival with optional survival', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const mapA = map.copy({
    config: map.config.copy({
      objectives: defineObjectives([
        {
          hidden: false,
          optional: false,
          players: [1],
          rounds: 3,
          type: Criteria.Survival,
        },
        {
          hidden: true,
          optional: true,
          players: [1],
          rounds: 2,
          type: Criteria.Survival,
        },
      ]),
    }),
    units: map.units
      .set(v1, Flamethrower.create(player1))
      .set(v2, Pioneer.create(player2)),
  });

  expect(validateObjectives(mapA)).toBe(true);

  const [, gameActionResponseA] = await executeGameActions(mapA, [
    EndTurnAction(),
    EndTurnAction(),
    EndTurnAction(),
    EndTurnAction(),
    EndTurnAction(),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      EndTurn { current: { funds: 500, player: 2 }, next: { funds: 500, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }
      OptionalObjective { objective: { completed: Set(1) { 1 }, hidden: true, optional: true, players: [ 1 ], reward: null, rounds: 2, type: 5 }, objectiveId: 1, toPlayer: 1 }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 2, rotatePlayers: false, supply: null, miss: false }
      EndTurn { current: { funds: 500, player: 2 }, next: { funds: 500, player: 1 }, round: 3, rotatePlayers: false, supply: null, miss: false }
      GameEnd { objective: { completed: Set(0) {}, hidden: false, optional: false, players: [ 1 ], reward: null, rounds: 3, type: 5 }, objectiveId: 0, toPlayer: 1, chaosStars: null }"
    `);
});

test('escort units', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v5 = vec(2, 2);
  const v6 = vec(2, 3);
  const v7 = vec(3, 1);
  const mapA = map.copy({
    config: map.config.copy({
      objectives: defineObjectives([
        {
          hidden: false,
          label: new Set([1]),
          optional: false,
          players: [1],
          type: Criteria.EscortLabel,
          vectors: new Set([v7, v6]),
        },
      ]),
    }),
    units: map.units
      .set(v1, Pioneer.create(player1, { label: 1 }))
      .set(v2, Pioneer.create(player2))
      .set(v5, Pioneer.create(player1, { label: 1 })),
  });

  expect(validateObjectives(mapA)).toBe(true);

  const [, gameActionResponseA] = await executeGameActions(mapA, [
    MoveAction(v1, v6),
    MoveAction(v5, v7),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "Move (1,1 → 2,3) { fuel: 37, completed: false, path: [2,1 → 2,2 → 2,3] }
      Move (2,2 → 3,1) { fuel: 38, completed: false, path: [2,1 → 3,1] }
      GameEnd { objective: { completed: Set(0) {}, hidden: false, label: [ 1 ], optional: false, players: [ 1 ], reward: null, type: 4, vectors: [ '3,1', '2,3' ] }, objectiveId: 0, toPlayer: 1, chaosStars: null }"
    `);

  const mapWithOptionalObjectives = optional(mapA);

  expect(validateObjectives(mapWithOptionalObjectives)).toBe(true);

  const [gameStateB, gameActionResponseB] = await executeGameActions(
    mapWithOptionalObjectives,
    [MoveAction(v1, v6), MoveAction(v5, v7)],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseB))
    .toMatchInlineSnapshot(`
      "Move (1,1 → 2,3) { fuel: 37, completed: false, path: [2,1 → 2,2 → 2,3] }
      Move (2,2 → 3,1) { fuel: 38, completed: false, path: [2,1 → 3,1] }
      OptionalObjective { objective: { completed: Set(1) { 1 }, hidden: false, label: [ 1 ], optional: true, players: [ 1 ], reward: null, type: 4, vectors: [ '3,1', '2,3' ] }, objectiveId: 0, toPlayer: 1 }"
    `);

  expect(gameHasEnded(gameStateB)).toBe(false);
});

test('escort units by label without having units with that label (fails)', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v5 = vec(2, 2);
  const v6 = vec(2, 3);
  const v7 = vec(3, 1);
  const mapA = map.copy({
    config: map.config.copy({
      objectives: defineObjectives([
        {
          hidden: false,
          label: new Set([1]),
          optional: false,
          players: [1],
          type: Criteria.EscortLabel,
          vectors: new Set([v7, v6]),
        },
      ]),
    }),
    units: map.units
      .set(v1, Pioneer.create(player1))
      .set(v2, Pioneer.create(player2, { label: 1 }))
      .set(v5, Pioneer.create(player1)),
  });

  expect(validateObjectives(mapA)).toBe(true);

  const [, gameActionResponseA] = await executeGameActions(mapA, [
    MoveAction(v1, v6),
    MoveAction(v5, v7),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "Move (1,1 → 2,3) { fuel: 37, completed: false, path: [2,1 → 2,2 → 2,3] }
      Move (2,2 → 3,1) { fuel: 38, completed: false, path: [2,1 → 3,1] }"
    `);

  const mapWithOptionalObjectives = optional(mapA);

  expect(validateObjectives(mapWithOptionalObjectives)).toBe(true);

  const [, gameActionResponseB] = await executeGameActions(
    mapWithOptionalObjectives,
    [MoveAction(v1, v6), MoveAction(v5, v7)],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseB))
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
  const mapA = map.copy({
    config: map.config.copy({
      objectives: defineObjectives([
        {
          hidden: false,
          label: new Set([1]),
          optional: false,
          players: [1],
          type: Criteria.EscortLabel,
          vectors: new Set([v7, v6]),
        },
      ]),
    }),
    units: map.units
      .set(v1, Pioneer.create(player1, { label: 1 }))
      .set(v2, Pioneer.create(player2))
      .set(v5, Pioneer.create(player1, { label: 1 }))
      .set(v4, Jeep.create(player1)),
  });

  expect(validateObjectives(mapA)).toBe(true);

  const [, gameActionResponseA] = await executeGameActions(mapA, [
    MoveAction(v1, v6),
    MoveAction(v5, v4),
    MoveAction(v4, v7),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "Move (1,1 → 2,3) { fuel: 37, completed: false, path: [2,1 → 2,2 → 2,3] }
      Move (2,2 → 2,1) { fuel: 39, completed: false, path: [2,1] }
      Move (2,1 → 3,1) { fuel: 59, completed: false, path: [3,1] }
      GameEnd { objective: { completed: Set(0) {}, hidden: false, label: [ 1 ], optional: false, players: [ 1 ], reward: null, type: 4, vectors: [ '3,1', '2,3' ] }, objectiveId: 0, toPlayer: 1, chaosStars: null }"
    `);

  const mapWithOptionalObjectives = optional(mapA);

  expect(validateObjectives(mapWithOptionalObjectives)).toBe(true);

  const [gameStateB, gameActionResponseB] = await executeGameActions(
    mapWithOptionalObjectives,
    [MoveAction(v1, v6), MoveAction(v5, v4), MoveAction(v4, v7)],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseB))
    .toMatchInlineSnapshot(`
      "Move (1,1 → 2,3) { fuel: 37, completed: false, path: [2,1 → 2,2 → 2,3] }
      Move (2,2 → 2,1) { fuel: 39, completed: false, path: [2,1] }
      Move (2,1 → 3,1) { fuel: 59, completed: false, path: [3,1] }
      OptionalObjective { objective: { completed: Set(1) { 1 }, hidden: false, label: [ 1 ], optional: true, players: [ 1 ], reward: null, type: 4, vectors: [ '3,1', '2,3' ] }, objectiveId: 0, toPlayer: 1 }"
    `);

  expect(gameHasEnded(gameStateB)).toBe(false);
});

test('escort units by drop (transport)', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v4 = vec(2, 1);
  const v5 = vec(2, 2);
  const v6 = vec(2, 3);
  const v7 = vec(3, 1);
  const mapA = map.copy({
    config: map.config.copy({
      objectives: defineObjectives([
        {
          hidden: false,
          label: new Set([1]),
          optional: false,
          players: [1],
          type: Criteria.EscortLabel,
          vectors: new Set([v7, v6]),
        },
      ]),
    }),
    units: map.units
      .set(v1, Pioneer.create(player1, { label: 1 }))
      .set(v2, Pioneer.create(player2))
      .set(v5, Pioneer.create(player1, { label: 1 }))
      .set(v4, Jeep.create(player1)),
  });

  expect(validateObjectives(mapA)).toBe(true);

  const [, gameActionResponseA] = await executeGameActions(mapA, [
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
      GameEnd { objective: { completed: Set(0) {}, hidden: false, label: [ 1 ], optional: false, players: [ 1 ], reward: null, type: 4, vectors: [ '3,1', '2,3' ] }, objectiveId: 0, toPlayer: 1, chaosStars: null }"
    `);

  const mapWithOptionalObjectives = optional(mapA);

  expect(validateObjectives(mapWithOptionalObjectives)).toBe(true);

  const [gameStateB, gameActionResponseB] = await executeGameActions(
    mapWithOptionalObjectives,
    [
      MoveAction(v1, v6),
      MoveAction(v5, v4),
      DropUnitAction(v4, 0, v5),
      EndTurnAction(),
      EndTurnAction(),
      MoveAction(v5, v4),
      DropUnitAction(v4, 0, v7),
    ],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseB))
    .toMatchInlineSnapshot(`
      "Move (1,1 → 2,3) { fuel: 37, completed: false, path: [2,1 → 2,2 → 2,3] }
      Move (2,2 → 2,1) { fuel: 39, completed: false, path: [2,1] }
      DropUnit (2,1 → 2,2) { index: 0 }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      EndTurn { current: { funds: 500, player: 2 }, next: { funds: 500, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }
      Move (2,2 → 2,1) { fuel: 39, completed: false, path: [2,1] }
      DropUnit (2,1 → 3,1) { index: 0 }
      OptionalObjective { objective: { completed: Set(1) { 1 }, hidden: false, label: [ 1 ], optional: true, players: [ 1 ], reward: null, type: 4, vectors: [ '3,1', '2,3' ] }, objectiveId: 0, toPlayer: 1 }"
    `);

  expect(gameHasEnded(gameStateB)).toBe(false);
});

test('escort units by label fails', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v3 = vec(1, 3);
  const v4 = vec(2, 1);
  const v5 = vec(2, 2);
  const v6 = vec(2, 3);
  const v7 = vec(3, 1);
  const mapA = map.copy({
    config: map.config.copy({
      objectives: defineObjectives([
        {
          hidden: false,
          label: new Set([1]),
          optional: false,
          players: [1],
          type: Criteria.EscortLabel,
          vectors: new Set([v7, v6]),
        },
      ]),
    }),
    units: map.units
      .set(v1, Pioneer.create(player1, { label: 1 }))
      .set(v2, Pioneer.create(player2))
      .set(v5, Pioneer.create(player1, { label: 1 }))
      .set(v3, Flamethrower.create(player2))
      .set(v7, Flamethrower.create(player2)),
  });

  expect(validateObjectives(mapA)).toBe(true);

  const [, gameActionResponseA] = await executeGameActions(mapA, [
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
      GameEnd { objective: { completed: Set(0) {}, hidden: false, label: [ 1 ], optional: false, players: [ 1 ], reward: null, type: 4, vectors: [ '3,1', '2,3' ] }, objectiveId: 0, toPlayer: 2, chaosStars: null }"
    `);

  const mapWithOptionalObjectives = optional(mapA);

  expect(validateObjectives(mapWithOptionalObjectives)).toBe(true);

  const [gameStateB, gameActionResponseB] = await executeGameActions(
    mapWithOptionalObjectives,
    [
      MoveAction(v1, v6),
      MoveAction(v5, v4),
      EndTurnAction(),
      AttackUnitAction(v7, v4),
    ],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseB))
    .toMatchInlineSnapshot(`
      "Move (1,1 → 2,3) { fuel: 37, completed: false, path: [2,1 → 2,2 → 2,3] }
      Move (2,2 → 2,1) { fuel: 39, completed: false, path: [2,1] }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      AttackUnit (3,1 → 2,1) { hasCounterAttack: false, playerA: 2, playerB: 1, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 33, chargeB: 100 }"
    `);

  expect(gameHasEnded(gameStateB)).toBe(false);
});

test('escort units by label fails (transport)', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v3 = vec(1, 3);
  const v4 = vec(2, 1);
  const v5 = vec(2, 2);
  const v6 = vec(2, 3);
  const v7 = vec(3, 1);
  const mapA = map.copy({
    config: map.config.copy({
      objectives: defineObjectives([
        {
          hidden: false,
          label: new Set([1]),
          optional: false,
          players: [1],
          type: Criteria.EscortLabel,
          vectors: new Set([v7, v6]),
        },
      ]),
    }),
    units: map.units
      .set(v1, Pioneer.create(player1, { label: 1 }))
      .set(v2, Pioneer.create(player2))
      .set(v5, Pioneer.create(player1, { label: 1 }))
      .set(v4, Jeep.create(player1))
      .set(v3, SmallTank.create(player2))
      .set(v7, SmallTank.create(player2)),
  });

  expect(validateObjectives(mapA)).toBe(true);

  const [, gameActionResponseA] = await executeGameActions(mapA, [
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
      GameEnd { objective: { completed: Set(0) {}, hidden: false, label: [ 1 ], optional: false, players: [ 1 ], reward: null, type: 4, vectors: [ '3,1', '2,3' ] }, objectiveId: 0, toPlayer: 2, chaosStars: null }"
    `);

  const mapWithOptionalObjectives = optional(mapA);

  expect(validateObjectives(mapWithOptionalObjectives)).toBe(true);

  const [gameStateB, gameActionResponseB] = await executeGameActions(
    mapWithOptionalObjectives,
    [
      MoveAction(v1, v6),
      MoveAction(v5, v4),
      EndTurnAction(),
      AttackUnitAction(v7, v4),
      MoveAction(v3, v5),
      AttackUnitAction(v5, v4),
    ],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseB))
    .toMatchInlineSnapshot(`
      "Move (1,1 → 2,3) { fuel: 37, completed: false, path: [2,1 → 2,2 → 2,3] }
      Move (2,2 → 2,1) { fuel: 39, completed: false, path: [2,1] }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      AttackUnit (3,1 → 2,1) { hasCounterAttack: false, playerA: 2, playerB: 1, unitA: DryUnit { health: 100, ammo: [ [ 1, 6 ] ] }, unitB: DryUnit { health: 20 }, chargeA: 39, chargeB: 120 }
      Move (1,3 → 2,2) { fuel: 28, completed: false, path: [1,2 → 2,2] }
      AttackUnit (2,2 → 2,1) { hasCounterAttack: false, playerA: 2, playerB: 1, unitA: DryUnit { health: 100, ammo: [ [ 1, 6 ] ] }, unitB: null, chargeA: 48, chargeB: 150 }"
    `);

  expect(gameHasEnded(gameStateB)).toBe(false);
});

test('escort units by amount', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v5 = vec(2, 2);
  const v6 = vec(2, 3);
  const v7 = vec(3, 1);
  const mapA = map.copy({
    config: map.config.copy({
      objectives: defineObjectives([
        {
          amount: 2,
          hidden: false,
          optional: false,
          players: [1],
          type: Criteria.EscortAmount,
          vectors: new Set([v7, v6]),
        },
      ]),
    }),
    units: map.units
      .set(v1, Pioneer.create(player1))
      .set(v2, Pioneer.create(player2))
      .set(v5, Pioneer.create(player1)),
  });

  expect(validateObjectives(mapA)).toBe(true);

  const [, gameActionResponseA] = await executeGameActions(mapA, [
    MoveAction(v1, v6),
    MoveAction(v5, v7),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "Move (1,1 → 2,3) { fuel: 37, completed: false, path: [2,1 → 2,2 → 2,3] }
      Move (2,2 → 3,1) { fuel: 38, completed: false, path: [2,1 → 3,1] }
      GameEnd { objective: { amount: 2, completed: Set(0) {}, hidden: false, label: [], optional: false, players: [ 1 ], reward: null, type: 6, vectors: [ '3,1', '2,3' ] }, objectiveId: 0, toPlayer: 1, chaosStars: null }"
    `);

  const mapWithOptionalObjectives = optional(mapA);

  expect(validateObjectives(mapWithOptionalObjectives)).toBe(true);

  const [gameStateB, gameActionResponseB] = await executeGameActions(
    mapWithOptionalObjectives,
    [MoveAction(v1, v6), MoveAction(v5, v7)],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseB))
    .toMatchInlineSnapshot(`
      "Move (1,1 → 2,3) { fuel: 37, completed: false, path: [2,1 → 2,2 → 2,3] }
      Move (2,2 → 3,1) { fuel: 38, completed: false, path: [2,1 → 3,1] }
      OptionalObjective { objective: { amount: 2, completed: Set(1) { 1 }, hidden: false, label: [], optional: true, players: [ 1 ], reward: null, type: 6, vectors: [ '3,1', '2,3' ] }, objectiveId: 0, toPlayer: 1 }"
    `);

  expect(gameHasEnded(gameStateB)).toBe(false);
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
  const mapA = map.copy({
    buildings: map.buildings.set(v4, House.create(player1)),
    config: map.config.copy({
      objectives: defineObjectives([
        {
          amount: 1,
          hidden: false,
          label: new Set([2]),
          optional: false,
          players: [1],
          type: Criteria.EscortAmount,
          vectors: new Set([v4, v5]),
        },
        {
          amount: 7,
          hidden: false,
          label: new Set([1]),
          optional: false,
          players: [2],
          type: Criteria.EscortAmount,
          vectors: new Set([v6, v7]),
        },
        {
          amount: 15,
          hidden: false,
          optional: false,
          players: [1],
          type: Criteria.EscortAmount,
          vectors: new Set([v8, v9]),
        },
      ]),
    }),
    units: map.units
      .set(v1, Pioneer.create(player1))
      .set(v2, Pioneer.create(player2, { label: 1 }))
      .set(v3, Pioneer.create(player1, { label: 2 })),
  });

  expect(validateObjectives(mapA)).toBe(true);

  const [, gameActionResponseA] = await executeGameActions(mapA, [
    MoveAction(v1, v5),
    MoveAction(v3, v4),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "Move (1,1 → 2,3) { fuel: 37, completed: false, path: [2,1 → 2,2 → 2,3] }
      Move (2,2 → 3,1) { fuel: 38, completed: false, path: [2,1 → 3,1] }
      GameEnd { objective: { amount: 1, completed: Set(0) {}, hidden: false, label: [ 2 ], optional: false, players: [ 1 ], reward: null, type: 6, vectors: [ '3,1', '2,3' ] }, objectiveId: 0, toPlayer: 1, chaosStars: null }"
    `);

  const mapWithOptionalObjectives = mapA.copy({
    config: mapA.config.copy({
      objectives: defineObjectives([
        {
          amount: 1,
          hidden: false,
          label: new Set([2]),
          optional: true,
          players: [1],
          type: Criteria.EscortAmount,
          vectors: new Set([v4, v5]),
        },
        {
          amount: 1,
          hidden: false,
          label: new Set([1]),
          optional: true,
          players: [2],
          type: Criteria.EscortAmount,
          vectors: new Set([v6, v7]),
        },
        {
          amount: 15,
          hidden: false,
          optional: true,
          players: [1],
          type: Criteria.EscortAmount,
          vectors: new Set([v8, v9]),
        },
        { hidden: false, type: Criteria.Default },
      ]),
    }),
  });

  expect(validateObjectives(mapWithOptionalObjectives)).toBe(true);

  const [gameStateB, gameActionResponseB] = await executeGameActions(
    mapWithOptionalObjectives,
    [
      MoveAction(v1, v5),
      MoveAction(v3, v4),
      EndTurnAction(),
      MoveAction(v2, v6),
    ],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseB))
    .toMatchInlineSnapshot(`
      "Move (1,1 → 2,3) { fuel: 37, completed: false, path: [2,1 → 2,2 → 2,3] }
      Move (2,2 → 3,1) { fuel: 38, completed: false, path: [2,1 → 3,1] }
      OptionalObjective { objective: { amount: 1, completed: Set(1) { 1 }, hidden: false, label: [ 2 ], optional: true, players: [ 1 ], reward: null, type: 6, vectors: [ '3,1', '2,3' ] }, objectiveId: 0, toPlayer: 1 }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      Move (1,2 → 3,3) { fuel: 37, completed: false, path: [2,2 → 3,2 → 3,3] }
      OptionalObjective { objective: { amount: 1, completed: Set(1) { 2 }, hidden: false, label: [ 1 ], optional: true, players: [ 2 ], reward: null, type: 6, vectors: [ '3,3', '3,2' ] }, objectiveId: 1, toPlayer: 2 }"
    `);

  expect(gameHasEnded(gameStateB)).toBe(false);
});

test('escort units by amount with label fails', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v3 = vec(1, 3);
  const v4 = vec(2, 1);
  const v5 = vec(2, 2);
  const v6 = vec(2, 3);
  const v7 = vec(3, 1);
  const mapA = map.copy({
    config: map.config.copy({
      objectives: defineObjectives([
        {
          amount: 2,
          hidden: false,
          label: new Set([1]),
          optional: false,
          players: [1],
          type: Criteria.EscortAmount,
          vectors: new Set([v7, v6]),
        },
      ]),
    }),
    units: map.units
      .set(v1, Pioneer.create(player1, { label: 1 }))
      .set(v2, Pioneer.create(player2))
      .set(v5, Pioneer.create(player1, { label: 1 }))
      .set(v3, Flamethrower.create(player2))
      .set(v7, Flamethrower.create(player2)),
  });

  expect(validateObjectives(mapA)).toBe(true);

  const [, gameActionResponseA] = await executeGameActions(mapA, [
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
      GameEnd { objective: { amount: 2, completed: Set(0) {}, hidden: false, label: [ 1 ], optional: false, players: [ 1 ], reward: null, type: 6, vectors: [ '3,1', '2,3' ] }, objectiveId: 0, toPlayer: 2, chaosStars: null }"
    `);

  const mapWithOptionalObjectives = optional(mapA);

  expect(validateObjectives(mapWithOptionalObjectives)).toBe(true);

  const [gameStateB, gameActionResponseB] = await executeGameActions(
    mapWithOptionalObjectives,
    [
      MoveAction(v1, v6),
      MoveAction(v5, v4),
      EndTurnAction(),
      AttackUnitAction(v7, v4),
    ],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseB))
    .toMatchInlineSnapshot(`
      "Move (1,1 → 2,3) { fuel: 37, completed: false, path: [2,1 → 2,2 → 2,3] }
      Move (2,2 → 2,1) { fuel: 39, completed: false, path: [2,1] }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      AttackUnit (3,1 → 2,1) { hasCounterAttack: false, playerA: 2, playerB: 1, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 33, chargeB: 100 }"
    `);

  expect(gameHasEnded(gameStateB)).toBe(false);
});

test('escort units by amount does not fail when enough units are remaining', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v3 = vec(1, 3);
  const v4 = vec(2, 1);
  const v5 = vec(2, 2);
  const v6 = vec(2, 3);
  const v7 = vec(3, 1);
  const mapA = map.copy({
    config: map.config.copy({
      objectives: defineObjectives([
        {
          amount: 1,
          hidden: false,
          label: new Set([1]),
          optional: false,
          players: [1],
          type: Criteria.EscortAmount,
          vectors: new Set([v7]),
        },
      ]),
    }),
    units: map.units
      .set(v1, Pioneer.create(player1, { label: 1 }).setHealth(1))
      .set(v2, Pioneer.create(player1, { label: 1 }).setHealth(1))
      .set(v5, Pioneer.create(player1, { label: 1 }).setHealth(1))
      .set(v3, Flamethrower.create(player2))
      .set(v7, Flamethrower.create(player2)),
  });

  expect(validateObjectives(mapA)).toBe(true);

  const [, gameActionResponseA] = await executeGameActions(mapA, [
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

  const mapWithOptionalObjectives = optional(mapA);

  expect(validateObjectives(mapWithOptionalObjectives)).toBe(true);

  const [, gameActionResponseB] = await executeGameActions(
    mapWithOptionalObjectives,
    [
      MoveAction(v1, v6),
      MoveAction(v5, v4),
      EndTurnAction(),
      AttackUnitAction(v7, v4),
      AttackUnitAction(v3, v2),
    ],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseB))
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
  const mapA = map.copy({
    config: map.config.copy({
      objectives: defineObjectives([
        {
          amount: 1,
          hidden: false,
          optional: false,
          players: [1],
          type: Criteria.EscortAmount,
          vectors: new Set([v7]),
        },
      ]),
    }),
    units: map.units
      .set(v1, Pioneer.create(player1))
      .set(v2, Pioneer.create(player2))
      .set(v5, Pioneer.create(player1))
      .set(v3, Flamethrower.create(player2))
      .set(v7, Flamethrower.create(player2)),
  });

  expect(validateObjectives(mapA)).toBe(true);

  const [, gameActionResponseA] = await executeGameActions(mapA, [
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

  const mapWithOptionalObjectives = optional(mapA);

  expect(validateObjectives(mapWithOptionalObjectives)).toBe(true);

  const [, gameActionResponseB] = await executeGameActions(
    mapWithOptionalObjectives,
    [
      MoveAction(v1, v6),
      MoveAction(v5, v4),
      EndTurnAction(),
      AttackUnitAction(v7, v4),
    ],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseB))
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
  const mapA = map.copy({
    config: map.config.copy({
      objectives: defineObjectives([
        {
          hidden: false,
          label: new Set([0, 3]),
          optional: false,
          type: Criteria.RescueLabel,
        },
      ]),
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

  expect(validateObjectives(mapA)).toBe(true);

  const [, gameActionResponseA] = await executeGameActions(mapA, [
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
      "Rescue (1,2 → 1,1) { player: 1, name: null }
      Rescue (2,3 → 1,3) { player: 1, name: null }
      Rescue (2,1 → 2,2) { player: 1, name: null }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      EndTurn { current: { funds: 500, player: 2 }, next: { funds: 500, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }
      Rescue (1,2 → 1,1) { player: 1, name: -7 }
      Rescue (2,3 → 1,3) { player: 1, name: 21 }
      Rescue (2,1 → 2,2) { player: 1, name: 20 }
      GameEnd { objective: { completed: Set(0) {}, hidden: false, label: [ 0, 3 ], optional: false, players: [], reward: null, type: 8 }, objectiveId: 0, toPlayer: 1, chaosStars: null }"
    `);

  const mapWithOptionalObjectives = optional(mapA);

  expect(validateObjectives(mapWithOptionalObjectives)).toBe(true);

  const [gameStateB, gameActionResponseB] = await executeGameActions(
    mapWithOptionalObjectives,
    [
      RescueAction(v2, v1),
      RescueAction(v4, v3),
      RescueAction(v6, v5),
      EndTurnAction(),
      EndTurnAction(),
      RescueAction(v2, v1),
      RescueAction(v4, v3),
      RescueAction(v6, v5),
    ],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseB))
    .toMatchInlineSnapshot(`
      "Rescue (1,2 → 1,1) { player: 1, name: null }
      Rescue (2,3 → 1,3) { player: 1, name: null }
      Rescue (2,1 → 2,2) { player: 1, name: null }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      EndTurn { current: { funds: 500, player: 2 }, next: { funds: 500, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }
      Rescue (1,2 → 1,1) { player: 1, name: -7 }
      Rescue (2,3 → 1,3) { player: 1, name: 21 }
      Rescue (2,1 → 2,2) { player: 1, name: 20 }
      OptionalObjective { objective: { completed: Set(1) { 1 }, hidden: false, label: [ 0, 3 ], optional: true, players: [], reward: null, type: 8 }, objectiveId: 0, toPlayer: 1 }"
    `);

  expect(gameHasEnded(gameStateB)).toBe(false);
});

test('rescue label win criteria loses when destroying the rescuable unit', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v3 = vec(1, 3);
  const v4 = vec(2, 3);
  const v5 = vec(2, 2);
  const v6 = vec(2, 1);
  const v7 = vec(3, 3);
  const mapA = map.copy({
    config: map.config.copy({
      objectives: defineObjectives([
        {
          hidden: false,
          label: new Set([0, 3]),
          optional: false,
          players: [1],
          type: Criteria.RescueLabel,
        },
      ]),
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

  expect(validateObjectives(mapA)).toBe(true);

  const [, gameActionResponseA] = await executeGameActions(mapA, [
    RescueAction(v2, v1),
    AttackUnitAction(v4, v3),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "Rescue (1,2 → 1,1) { player: 1, name: null }
      AttackUnit (2,3 → 1,3) { hasCounterAttack: false, playerA: 1, playerB: 0, unitA: DryUnit { health: 100, ammo: [ [ 1, 6 ] ] }, unitB: null, chargeA: 0, chargeB: null }
      GameEnd { objective: { completed: Set(0) {}, hidden: false, label: [ 0, 3 ], optional: false, players: [ 1 ], reward: null, type: 8 }, objectiveId: 0, toPlayer: 2, chaosStars: null }"
    `);

  const mapWithOptionalObjectives = optional(mapA);

  expect(validateObjectives(mapWithOptionalObjectives)).toBe(true);

  const [gameStateA_2, gameActionResponseA_2] = await executeGameActions(
    mapWithOptionalObjectives,
    [RescueAction(v2, v1), AttackUnitAction(v4, v3)],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseA_2))
    .toMatchInlineSnapshot(`
      "Rescue (1,2 → 1,1) { player: 1, name: null }
      AttackUnit (2,3 → 1,3) { hasCounterAttack: false, playerA: 1, playerB: 0, unitA: DryUnit { health: 100, ammo: [ [ 1, 6 ] ] }, unitB: null, chargeA: 0, chargeB: null }"
    `);

  expect(gameHasEnded(gameStateA_2)).toBe(false);

  const [, gameActionResponseB] = await executeGameActions(
    mapA.copy({
      units: mapA.units.set(v4, SmallTank.create(2)),
    }),
    [RescueAction(v2, v3), EndTurnAction(), AttackUnitAction(v4, v3)],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseB))
    .toMatchInlineSnapshot(`
      "Rescue (1,2 → 1,3) { player: 1, name: null }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      AttackUnit (2,3 → 1,3) { hasCounterAttack: false, playerA: 2, playerB: 0, unitA: DryUnit { health: 100, ammo: [ [ 1, 6 ] ] }, unitB: null, chargeA: 0, chargeB: null }
      GameEnd { objective: { completed: Set(0) {}, hidden: false, label: [ 0, 3 ], optional: false, players: [ 1 ], reward: null, type: 8 }, objectiveId: 0, toPlayer: 2, chaosStars: null }"
    `);

  const [gameStateB_2, gameActionResponseB_2] = await executeGameActions(
    mapWithOptionalObjectives.copy({
      units: mapWithOptionalObjectives.units.set(v4, SmallTank.create(2)),
    }),
    [RescueAction(v2, v3), EndTurnAction(), AttackUnitAction(v4, v3)],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseB_2))
    .toMatchInlineSnapshot(`
      "Rescue (1,2 → 1,3) { player: 1, name: null }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      AttackUnit (2,3 → 1,3) { hasCounterAttack: false, playerA: 2, playerB: 0, unitA: DryUnit { health: 100, ammo: [ [ 1, 6 ] ] }, unitB: null, chargeA: 0, chargeB: null }"
    `);

  expect(gameHasEnded(gameStateB_2)).toBe(false);

  const [, gameActionResponseC] = await executeGameActions(
    mapA.copy({
      teams: ImmutableMap([
        ...map.teams,
        [
          3,
          new Team(
            3,
            '',
            ImmutableMap([
              [
                3,
                new Bot(
                  3,
                  'Bot',
                  3,
                  300,
                  undefined,
                  new Set(),
                  new Set(),
                  0,
                  null,
                  0,
                ),
              ],
            ]),
          ),
        ],
      ]),
      units: mapA.units.set(v4, SmallTank.create(2)).set(v7, Pioneer.create(3)),
    }),
    [RescueAction(v2, v3), EndTurnAction(), AttackUnitAction(v4, v3)],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseC))
    .toMatchInlineSnapshot(`
      "Rescue (1,2 → 1,3) { player: 1, name: null }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      AttackUnit (2,3 → 1,3) { hasCounterAttack: false, playerA: 2, playerB: 0, unitA: DryUnit { health: 100, ammo: [ [ 1, 6 ] ] }, unitB: null, chargeA: 0, chargeB: null }
      GameEnd { objective: { completed: Set(0) {}, hidden: false, label: [ 0, 3 ], optional: false, players: [ 1 ], reward: null, type: 8 }, objectiveId: 0, toPlayer: 2, chaosStars: null }"
    `);

  const [gameStateC_2, gameActionResponseC_2] = await executeGameActions(
    mapWithOptionalObjectives.copy({
      teams: ImmutableMap([
        ...map.teams,
        [
          3,
          new Team(
            3,
            '',
            ImmutableMap([
              [
                3,
                new Bot(
                  3,
                  'Bot',
                  3,
                  300,
                  undefined,
                  new Set(),
                  new Set(),
                  0,
                  null,
                  0,
                ),
              ],
            ]),
          ),
        ],
      ]),
      units: mapWithOptionalObjectives.units
        .set(v4, SmallTank.create(2))
        .set(v7, Pioneer.create(3)),
    }),
    [RescueAction(v2, v3), EndTurnAction(), AttackUnitAction(v4, v3)],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseC_2))
    .toMatchInlineSnapshot(`
      "Rescue (1,2 → 1,3) { player: 1, name: null }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      AttackUnit (2,3 → 1,3) { hasCounterAttack: false, playerA: 2, playerB: 0, unitA: DryUnit { health: 100, ammo: [ [ 1, 6 ] ] }, unitB: null, chargeA: 0, chargeB: null }"
    `);

  expect(gameHasEnded(gameStateC_2)).toBe(false);

  const [, gameActionResponseD] = await executeGameActions(
    mapA.copy({
      buildings: mapA.buildings.set(v3, House.create(1).setHealth(1)),
      units: mapA.units.set(v4, SmallTank.create(2)),
    }),
    [RescueAction(v2, v3), EndTurnAction(), AttackBuildingAction(v4, v3)],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseD))
    .toMatchInlineSnapshot(`
      "Rescue (1,2 → 1,3) { player: 1, name: null }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      AttackBuilding (2,3 → 1,3) { hasCounterAttack: false, playerA: 2, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 6 ] ] }, unitC: null, chargeA: null, chargeB: 1200, chargeC: 1 }
      GameEnd { objective: { completed: Set(0) {}, hidden: false, label: [ 0, 3 ], optional: false, players: [ 1 ], reward: null, type: 8 }, objectiveId: 0, toPlayer: 2, chaosStars: null }"
    `);

  const [gameStateD_2, gameActionResponseD_2] = await executeGameActions(
    mapWithOptionalObjectives.copy({
      buildings: mapWithOptionalObjectives.buildings.set(
        v3,
        House.create(1).setHealth(1),
      ),
      units: mapWithOptionalObjectives.units.set(v4, SmallTank.create(2)),
    }),
    [RescueAction(v2, v3), EndTurnAction(), AttackBuildingAction(v4, v3)],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseD_2))
    .toMatchInlineSnapshot(`
      "Rescue (1,2 → 1,3) { player: 1, name: null }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      AttackBuilding (2,3 → 1,3) { hasCounterAttack: false, playerA: 2, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 6 ] ] }, unitC: null, chargeA: null, chargeB: 1200, chargeC: 1 }"
    `);

  expect(gameHasEnded(gameStateD_2)).toBe(false);
});

test('rescue amount win criteria', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v3 = vec(1, 3);
  const v4 = vec(2, 3);
  const v5 = vec(2, 2);
  const v6 = vec(2, 1);
  const v7 = vec(3, 3);
  const mapA = map.copy({
    config: map.config.copy({
      objectives: defineObjectives([
        {
          amount: 2,
          hidden: false,
          optional: false,
          type: Criteria.RescueAmount,
        },
      ]),
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

  expect(validateObjectives(mapA)).toBe(true);

  const [, gameActionResponseA] = await executeGameActions(mapA, [
    RescueAction(v2, v1),
    RescueAction(v4, v3),
    RescueAction(v6, v5),
    EndTurnAction(),
    EndTurnAction(),
    RescueAction(v2, v1),
    RescueAction(v4, v3),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "Rescue (1,2 → 1,1) { player: 1, name: null }
      Rescue (2,3 → 1,3) { player: 1, name: null }
      Rescue (2,1 → 2,2) { player: 1, name: null }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      EndTurn { current: { funds: 500, player: 2 }, next: { funds: 500, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }
      Rescue (1,2 → 1,1) { player: 1, name: -7 }
      Rescue (2,3 → 1,3) { player: 1, name: 21 }
      GameEnd { objective: { amount: 2, completed: Set(0) {}, hidden: false, optional: false, players: [], reward: null, type: 13 }, objectiveId: 0, toPlayer: 1, chaosStars: null }"
    `);

  const mapWithOptionalObjectives = optional(mapA);

  expect(validateObjectives(mapWithOptionalObjectives)).toBe(true);

  const [gameStateB, gameActionResponseB] = await executeGameActions(
    mapWithOptionalObjectives,
    [
      RescueAction(v2, v1),
      RescueAction(v4, v3),
      RescueAction(v6, v5),
      EndTurnAction(),
      EndTurnAction(),
      RescueAction(v2, v1),
      RescueAction(v4, v3),
    ],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseB))
    .toMatchInlineSnapshot(`
      "Rescue (1,2 → 1,1) { player: 1, name: null }
      Rescue (2,3 → 1,3) { player: 1, name: null }
      Rescue (2,1 → 2,2) { player: 1, name: null }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      EndTurn { current: { funds: 500, player: 2 }, next: { funds: 500, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }
      Rescue (1,2 → 1,1) { player: 1, name: -7 }
      Rescue (2,3 → 1,3) { player: 1, name: 21 }
      OptionalObjective { objective: { amount: 2, completed: Set(1) { 1 }, hidden: false, optional: true, players: [], reward: null, type: 13 }, objectiveId: 0, toPlayer: 1 }"
    `);

  expect(gameHasEnded(gameStateB)).toBe(false);
});

test('rescue amount win criteria loses when destroying the rescuable unit', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v3 = vec(1, 3);
  const v4 = vec(2, 3);
  const v5 = vec(2, 2);
  const mapA = map.copy({
    config: map.config.copy({
      objectives: defineObjectives([
        {
          amount: 3,
          hidden: false,
          optional: false,
          players: [1],
          type: Criteria.RescueAmount,
        },
      ]),
    }),
    units: map.units
      .set(v1, Pioneer.create(0))
      .set(v2, Pioneer.create(player1))
      .set(v3, Pioneer.create(0).setHealth(1))
      .set(v4, SmallTank.create(player1))
      .set(v5, Pioneer.create(0)),
  });

  expect(validateObjectives(mapA)).toBe(true);

  const [, gameActionResponseA] = await executeGameActions(mapA, [
    RescueAction(v2, v1),
    AttackUnitAction(v4, v3),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "Rescue (1,2 → 1,1) { player: 1, name: null }
      AttackUnit (2,3 → 1,3) { hasCounterAttack: false, playerA: 1, playerB: 0, unitA: DryUnit { health: 100, ammo: [ [ 1, 6 ] ] }, unitB: null, chargeA: 0, chargeB: null }
      GameEnd { objective: { amount: 3, completed: Set(0) {}, hidden: false, optional: false, players: [ 1 ], reward: null, type: 13 }, objectiveId: 0, toPlayer: 2, chaosStars: null }"
    `);

  const mapB = map.copy({
    config: map.config.copy({
      objectives: defineObjectives([
        {
          amount: 3,
          hidden: false,
          optional: false,
          players: [1],
          type: Criteria.RescueAmount,
        },
      ]),
    }),
    units: map.units
      .set(v1, Pioneer.create(0))
      .set(v2, Pioneer.create(player1))
      .set(v3, Pioneer.create(0).setHealth(1))
      .set(v4, SmallTank.create(player2))
      .set(v5, Pioneer.create(0)),
  });

  expect(validateObjectives(mapB)).toBe(true);

  const [, gameActionResponseB] = await executeGameActions(mapB, [
    RescueAction(v2, v1),
    EndTurnAction(),
    AttackUnitAction(v4, v3),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseB))
    .toMatchInlineSnapshot(`
      "Rescue (1,2 → 1,1) { player: 1, name: null }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      AttackUnit (2,3 → 1,3) { hasCounterAttack: false, playerA: 2, playerB: 0, unitA: DryUnit { health: 100, ammo: [ [ 1, 6 ] ] }, unitB: null, chargeA: 0, chargeB: null }
      GameEnd { objective: { amount: 3, completed: Set(0) {}, hidden: false, optional: false, players: [ 1 ], reward: null, type: 13 }, objectiveId: 0, toPlayer: 2, chaosStars: null }"
    `);
});

test('optional objectives should not be triggered multiple times for the same player', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v3 = vec(1, 3);
  const v4 = vec(1, 4);
  const v5 = vec(2, 1);
  const v6 = vec(2, 2);
  const v7 = vec(2, 3);
  const v8 = vec(2, 4);
  const v9 = vec(3, 3);
  const mapA = map.copy({
    config: map.config.copy({
      objectives: defineObjectives([
        {
          amount: 2,
          hidden: false,
          optional: true,
          type: Criteria.DefeatAmount,
        },
        { hidden: false, type: Criteria.Default },
      ]),
    }),
    map: Array(3 * 4).fill(1),
    size: new SizeVector(3, 4),
    units: map.units
      .set(v1, Flamethrower.create(player1))
      .set(v2, Flamethrower.create(player1))
      .set(v3, Flamethrower.create(player1))
      .set(v4, Flamethrower.create(player1))
      .set(v5, Flamethrower.create(player2))
      .set(v6, Flamethrower.create(player2))
      .set(v7, Flamethrower.create(player2))
      .set(v8, Flamethrower.create(player2))
      .set(v9, Flamethrower.create(player2)),
  });

  expect(validateObjectives(mapA)).toBe(true);

  const [, gameActionResponseA] = await executeGameActions(mapA, [
    AttackUnitAction(v1, v5),
    AttackUnitAction(v2, v6),
    EndTurnAction(),
    AttackUnitAction(v7, v3),
    AttackUnitAction(v8, v4),
    EndTurnAction(),
    MoveAction(v1, v3),
    AttackUnitAction(v3, v7),
    MoveAction(v2, v4),
    EndTurnAction(),
    AttackUnitAction(v8, v4),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "AttackUnit (1,1 → 2,1) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 132, chargeB: 400 }
      AttackUnit (1,2 → 2,2) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 264, chargeB: 800 }
      OptionalObjective { objective: { amount: 2, completed: Set(1) { 1 }, hidden: false, optional: true, players: [], reward: null, type: 9 }, objectiveId: 0, toPlayer: 1 }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      AttackUnit (2,3 → 1,3) { hasCounterAttack: false, playerA: 2, playerB: 1, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 932, chargeB: 664 }
      AttackUnit (2,4 → 1,4) { hasCounterAttack: false, playerA: 2, playerB: 1, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 1064, chargeB: 1064 }
      OptionalObjective { objective: { amount: 2, completed: Set(2) { 1, 2 }, hidden: false, optional: true, players: [], reward: null, type: 9 }, objectiveId: 0, toPlayer: 2 }
      EndTurn { current: { funds: 500, player: 2 }, next: { funds: 500, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }
      Move (1,1 → 1,3) { fuel: 28, completed: false, path: [1,2 → 1,3] }
      AttackUnit (1,3 → 2,3) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 2 ] ] }, unitB: null, chargeA: 1196, chargeB: 1464 }
      Move (1,2 → 1,4) { fuel: 28, completed: false, path: [1,3 → 1,4] }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 2, rotatePlayers: false, supply: null, miss: false }
      AttackUnit (2,4 → 1,4) { hasCounterAttack: false, playerA: 2, playerB: 1, unitA: DryUnit { health: 100, ammo: [ [ 1, 2 ] ] }, unitB: null, chargeA: 1596, chargeB: 1596 }"
    `);
});

test('optional objectives should not end the game, but non-optional one should when both exist', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v3 = vec(1, 3);
  const v4 = vec(1, 4);
  const v5 = vec(2, 1);
  const v6 = vec(2, 2);
  const v7 = vec(2, 3);
  const v8 = vec(2, 4);
  const mapA = map.copy({
    config: map.config.copy({
      objectives: defineObjectives([
        {
          amount: 4,
          hidden: false,
          optional: false,
          type: Criteria.DefeatAmount,
        },
        {
          amount: 2,
          hidden: false,
          optional: true,
          type: Criteria.DefeatAmount,
        },
      ]),
    }),
    map: Array(3 * 4).fill(1),
    size: new SizeVector(3, 4),
    units: map.units
      .set(v1, Flamethrower.create(player1))
      .set(v2, Flamethrower.create(player1))
      .set(v3, Flamethrower.create(player1))
      .set(v4, Flamethrower.create(player1))
      .set(v5, Flamethrower.create(player2))
      .set(v6, Flamethrower.create(player2))
      .set(v7, Flamethrower.create(player2))
      .set(v8, Flamethrower.create(player2)),
  });

  expect(validateObjectives(mapA)).toBe(true);

  const [, gameActionResponseA] = await executeGameActions(mapA, [
    AttackUnitAction(v1, v5),
    AttackUnitAction(v2, v6),
    EndTurnAction(),
    AttackUnitAction(v7, v3),
    AttackUnitAction(v8, v4),
    EndTurnAction(),
    MoveAction(v1, v3),
    AttackUnitAction(v3, v7),
    MoveAction(v2, v4),
    AttackUnitAction(v4, v8),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "AttackUnit (1,1 → 2,1) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 132, chargeB: 400 }
      AttackUnit (1,2 → 2,2) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 264, chargeB: 800 }
      OptionalObjective { objective: { amount: 2, completed: Set(1) { 1 }, hidden: false, optional: true, players: [], reward: null, type: 9 }, objectiveId: 1, toPlayer: 1 }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      AttackUnit (2,3 → 1,3) { hasCounterAttack: false, playerA: 2, playerB: 1, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 932, chargeB: 664 }
      AttackUnit (2,4 → 1,4) { hasCounterAttack: false, playerA: 2, playerB: 1, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 1064, chargeB: 1064 }
      OptionalObjective { objective: { amount: 2, completed: Set(2) { 1, 2 }, hidden: false, optional: true, players: [], reward: null, type: 9 }, objectiveId: 1, toPlayer: 2 }
      EndTurn { current: { funds: 500, player: 2 }, next: { funds: 500, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }
      Move (1,1 → 1,3) { fuel: 28, completed: false, path: [1,2 → 1,3] }
      AttackUnit (1,3 → 2,3) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 2 ] ] }, unitB: null, chargeA: 1196, chargeB: 1464 }
      Move (1,2 → 1,4) { fuel: 28, completed: false, path: [1,3 → 1,4] }
      AttackUnit (1,4 → 2,4) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 2 ] ] }, unitB: null, chargeA: 1328, chargeB: 1864 }
      GameEnd { objective: { amount: 4, completed: Set(0) {}, hidden: false, optional: false, players: [], reward: null, type: 9 }, objectiveId: 0, toPlayer: 1, chaosStars: null }"
    `);
});

test('optional objectives are processed before game end responses', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const mapA = map.copy({
    config: map.config.copy({
      objectives: defineObjectives([
        { hidden: false, type: Criteria.Default },
        {
          amount: 1,
          hidden: false,
          optional: true,
          reward: {
            skill: Skill.BuyUnitBazookaBear,
            type: 'Skill',
          },
          type: Criteria.DefeatAmount,
        },
      ]),
    }),
    units: map.units
      .set(v1, Flamethrower.create(player1))
      .set(v2, Flamethrower.create(player2)),
  });

  const [, gameActionResponseA] = await executeGameActions(
    mapA,
    [AttackUnitAction(v1, v2)],
    new Map([
      [
        'OptionalObjective',
        new Set<Effect>([
          {
            actions: [
              {
                message: `FIRE!`,
                player: 'self',
                type: 'CharacterMessageEffect',
                unitId: Flamethrower.id,
                variant: 2,
              },
            ],
            conditions: [
              {
                type: 'OptionalObjective',
                value: 1,
              },
            ],
          },
        ]),
      ],
    ]),
  );

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "AttackUnit (1,1 → 1,2) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 132, chargeB: 400 }
      OptionalObjective { objective: { amount: 1, completed: Set(1) { 1 }, hidden: false, optional: true, players: [], reward: { skill: 12, type: 'Skill' }, type: 9 }, objectiveId: 1, toPlayer: 1 }
      CharacterMessage { message: 'FIRE!', player: 'self', unitId: 15, variant: 2 }
      ReceiveReward { player: 1, reward: 'Reward { skill: 12 }', permanent: false }
      AttackUnitGameOver { fromPlayer: 2, toPlayer: 1 }
      GameEnd { objective: null, objectiveId: null, toPlayer: 1, chaosStars: null }"
    `);
});

test('multiple optional objectives can trigger at once', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const mapA = map.copy({
    buildings: map.buildings.set(v2, House.create(player2, { label: 4 })),
    config: map.config.copy({
      objectives: defineObjectives([
        { hidden: false, type: Criteria.Default },
        {
          hidden: false,
          label: new Set([4]),
          optional: true,
          type: Criteria.CaptureLabel,
        },
        {
          amount: 1,
          hidden: false,
          optional: true,
          type: Criteria.CaptureAmount,
        },
      ]),
    }),
    units: map.units
      .set(v1, Pioneer.create(player2))
      .set(v2, Pioneer.create(player1).capture()),
  });

  expect(validateObjectives(mapA)).toBe(true);

  const [, gameActionResponseA] = await executeGameActions(mapA, [
    CaptureAction(v2),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
    "Capture (1,2) { building: House { id: 2, health: 100, player: 1, label: 4 }, player: 2 }
    OptionalObjective { objective: { completed: Set(1) { 1 }, hidden: false, label: [ 4 ], optional: true, players: [], reward: null, type: 1 }, objectiveId: 1, toPlayer: 1 }
    OptionalObjective { objective: { amount: 1, completed: Set(1) { 1 }, hidden: false, optional: true, players: [], reward: null, type: 2 }, objectiveId: 2, toPlayer: 1 }"
  `);
});

test('optional and game ending objectives might be triggered at the same time', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const mapA = map.copy({
    buildings: map.buildings.set(v2, House.create(player2, { label: 4 })),
    config: map.config.copy({
      objectives: defineObjectives([
        {
          hidden: false,
          label: new Set([4]),
          optional: true,
          type: Criteria.CaptureLabel,
        },
        {
          amount: 1,
          hidden: false,
          optional: false,
          type: Criteria.CaptureAmount,
        },
      ]),
    }),
    units: map.units
      .set(v1, Pioneer.create(player2))
      .set(v2, Pioneer.create(player1).capture()),
  });

  expect(validateObjectives(mapA)).toBe(true);

  const [, gameActionResponseA] = await executeGameActions(mapA, [
    CaptureAction(v2),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "Capture (1,2) { building: House { id: 2, health: 100, player: 1, label: 4 }, player: 2 }
      OptionalObjective { objective: { completed: Set(1) { 1 }, hidden: false, label: [ 4 ], optional: true, players: [], reward: null, type: 1 }, objectiveId: 0, toPlayer: 1 }
      GameEnd { objective: { amount: 1, completed: Set(0) {}, hidden: false, optional: false, players: [], reward: null, type: 2 }, objectiveId: 1, toPlayer: 1, chaosStars: null }"
    `);
});

test('optional and default game ending objectives might be triggered at the same time', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const mapA = map.copy({
    buildings: map.buildings.set(v2, HQ.create(player2, { label: 4 })),
    config: map.config.copy({
      objectives: defineObjectives([
        { hidden: false, type: Criteria.Default },
        {
          hidden: false,
          label: new Set([4]),
          optional: true,
          type: Criteria.CaptureLabel,
        },
      ]),
    }),
    units: map.units
      .set(v1, Pioneer.create(player2))
      .set(v2, Pioneer.create(player1).capture()),
  });

  expect(validateObjectives(mapA)).toBe(true);

  const [, gameActionResponseA] = await executeGameActions(mapA, [
    CaptureAction(v2),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "Capture (1,2) { building: Barracks { id: 12, health: 100, player: 1, label: 4 }, player: 2 }
      OptionalObjective { objective: { completed: Set(1) { 1 }, hidden: false, label: [ 4 ], optional: true, players: [], reward: null, type: 1 }, objectiveId: 1, toPlayer: 1 }
      CaptureGameOver { fromPlayer: 2, toPlayer: 1 }
      GameEnd { objective: null, objectiveId: null, toPlayer: 1, chaosStars: null }"
    `);
});

test('multiple optional objectives have their effects applied correctly', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v3 = vec(1, 3);
  const mapA = map.copy({
    buildings: map.buildings.set(v2, House.create(player2, { label: 4 })),
    config: map.config.copy({
      objectives: defineObjectives([
        { hidden: false, type: Criteria.Default },
        {
          hidden: false,
          label: new Set([4]),
          optional: true,
          type: Criteria.CaptureLabel,
        },
        {
          amount: 1,
          hidden: false,
          optional: true,
          type: Criteria.CaptureAmount,
        },
      ]),
    }),
    units: map.units
      .set(v1, Pioneer.create(player2))
      .set(v2, Pioneer.create(player1).capture()),
  });

  expect(validateObjectives(mapA)).toBe(true);

  const [gameState, gameActionResponseA] = await executeGameActions(
    mapA,
    [CaptureAction(v2)],
    new Map([
      [
        'OptionalObjective',
        new Set<Effect>([
          {
            actions: [
              {
                player: 0,
                type: 'SpawnEffect',
                units: ImmutableMap([[v3, Flamethrower.create(0)]]),
              },
            ],
            conditions: [
              {
                type: 'OptionalObjective',
                value: 1,
              },
            ],
            occurrence: 'once',
          },
        ]),
      ],
    ]),
  );

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "Capture (1,2) { building: House { id: 2, health: 100, player: 1, label: 4 }, player: 2 }
      OptionalObjective { objective: { completed: Set(1) { 1 }, hidden: false, label: [ 4 ], optional: true, players: [], reward: null, type: 1 }, objectiveId: 1, toPlayer: 1 }
      Spawn { units: [1,3 → Flamethrower { id: 15, health: 100, player: 0, fuel: 30, ammo: [ [ 1, 4 ] ], name: 'Uli' }], teams: null }
      OptionalObjective { objective: { amount: 1, completed: Set(1) { 1 }, hidden: false, optional: true, players: [], reward: null, type: 2 }, objectiveId: 2, toPlayer: 1 }"
    `);

  const lastMap = gameState.at(-1)![1];
  const unit = lastMap.units.get(v3);
  expect(unit).toBeDefined();
  expect(unit?.id).toBe(Flamethrower.id);
  expect(unit?.player).toBe(0);
});

test('poison at the begin of a turn properly fires objectives', async () => {
  const v1 = vec(1, 3);
  const v2 = vec(2, 4);
  const v3 = vec(5, 1);
  const v4 = vec(4, 1);

  const map = MapData.createMap({
    teams: [
      {
        id: 1,
        name: '',
        players: [
          { funds: 0, id: 1, name: 'Bot 1', skills: [] },
          { funds: 0, id: 2, name: 'Bot 2', skills: [] },
        ],
      },
      {
        id: 4,
        name: '',
        players: [{ funds: 0, id: 4, name: 'Bot 4', skills: [] }],
      },
    ],
  });

  const mapA = map.copy({
    buildings: map.buildings.set(v4, HQ.create(1)),
    config: map.config.copy({
      objectives: defineObjectives([
        { hidden: false, type: Criteria.Default },
        {
          hidden: false,
          label: new Set([2]),
          optional: false,
          players: [4],
          type: Criteria.DefeatOneLabel,
        },
      ]),
    }),
    map: Array(5 * 5).fill(1),
    size: new SizeVector(5, 5),
    units: map.units
      .set(v1, Brute.create(2, { label: 2 }).setHealth(25))
      .set(v2, Alien.create(4))
      .set(v3, Pioneer.create(2)),
  });

  expect(validateObjectives(mapA)).toBe(true);

  const [, gameActionResponseA] = await executeGameActions(mapA, [
    EndTurnAction(),
  ]);

  expect(
    snapshotEncodedActionResponse(gameActionResponseA),
  ).toMatchInlineSnapshot(
    `
    "EndTurn { current: { funds: 0, player: 1 }, next: { funds: 0, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
    Move (1,3 → 2,3) { fuel: 59, completed: false, path: [2,3] }
    AttackUnit (2,3 → 2,4) { hasCounterAttack: true, playerA: 2, playerB: 4, unitA: DryUnit { health: 20, ammo: [ [ 1, 5 ] ], statusEffect: 'Poison' }, unitB: DryUnit { health: 70 }, chargeA: 169, chargeB: 180 }
    CompleteUnit (5,1)
    EndTurn { current: { funds: 0, player: 2 }, next: { funds: 0, player: 4 }, round: 1, rotatePlayers: false, supply: null, miss: false }
    Move (2,4 → 3,3) { fuel: 18, completed: false, path: [3,4 → 3,3] }
    EndTurn { current: { funds: 0, player: 4 }, next: { funds: 0, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }
    EndTurn { current: { funds: 0, player: 1 }, next: { funds: 0, player: 2 }, round: 2, rotatePlayers: false, supply: null, miss: false }
    GameEnd { objective: { completed: Set(0) {}, hidden: false, label: [ 2 ], optional: false, players: [ 4 ], reward: null, type: 10 }, objectiveId: 1, toPlayer: 4, chaosStars: null }"
  `,
  );

  const mapB = mapA.copy({
    config: mapA.config.copy({
      objectives: defineObjectives([
        { hidden: false, type: Criteria.Default },
        {
          hidden: false,
          label: new Set([2]),
          optional: false,
          players: [4],
          type: Criteria.DefeatLabel,
        },
      ]),
    }),
  });

  expect(validateObjectives(mapB)).toBe(true);

  const [, gameActionResponseB] = await executeGameActions(mapB, [
    EndTurnAction(),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseB))
    .toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 0, player: 1 }, next: { funds: 0, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      Move (1,3 → 2,3) { fuel: 59, completed: false, path: [2,3] }
      AttackUnit (2,3 → 2,4) { hasCounterAttack: true, playerA: 2, playerB: 4, unitA: DryUnit { health: 20, ammo: [ [ 1, 5 ] ], statusEffect: 'Poison' }, unitB: DryUnit { health: 70 }, chargeA: 169, chargeB: 180 }
      CompleteUnit (5,1)
      EndTurn { current: { funds: 0, player: 2 }, next: { funds: 0, player: 4 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      Move (2,4 → 3,3) { fuel: 18, completed: false, path: [3,4 → 3,3] }
      EndTurn { current: { funds: 0, player: 4 }, next: { funds: 0, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }
      EndTurn { current: { funds: 0, player: 1 }, next: { funds: 0, player: 2 }, round: 2, rotatePlayers: false, supply: null, miss: false }
      GameEnd { objective: { completed: Set(0) {}, hidden: false, label: [ 2 ], optional: false, players: [ 4 ], reward: null, type: 3 }, objectiveId: 1, toPlayer: 4, chaosStars: null }"
    `);

  const mapC = mapA.copy({
    config: mapA.config.copy({
      objectives: defineObjectives([
        { hidden: false, type: Criteria.Default },
        {
          hidden: false,
          label: new Set([2]),
          optional: false,
          players: [2],
          type: Criteria.EscortLabel,
          vectors: new Set([v4]),
        },
      ]),
    }),
  });

  expect(validateObjectives(mapC)).toBe(true);

  const [, gameActionResponseC] = await executeGameActions(mapC, [
    EndTurnAction(),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseC))
    .toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 0, player: 1 }, next: { funds: 0, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      Move (1,3 → 2,3) { fuel: 59, completed: false, path: [2,3] }
      AttackUnit (2,3 → 2,4) { hasCounterAttack: true, playerA: 2, playerB: 4, unitA: DryUnit { health: 20, ammo: [ [ 1, 5 ] ], statusEffect: 'Poison' }, unitB: DryUnit { health: 70 }, chargeA: 169, chargeB: 180 }
      CompleteUnit (5,1)
      EndTurn { current: { funds: 0, player: 2 }, next: { funds: 0, player: 4 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      Move (2,4 → 3,3) { fuel: 18, completed: false, path: [3,4 → 3,3] }
      EndTurn { current: { funds: 0, player: 4 }, next: { funds: 0, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }
      EndTurn { current: { funds: 0, player: 1 }, next: { funds: 0, player: 2 }, round: 2, rotatePlayers: false, supply: null, miss: false }
      GameEnd { objective: { completed: Set(0) {}, hidden: false, label: [ 2 ], optional: false, players: [ 2 ], reward: null, type: 4, vectors: [ '4,1' ] }, objectiveId: 1, toPlayer: 4, chaosStars: null }"
    `);

  const mapD = mapA.copy({
    config: mapA.config.copy({
      objectives: defineObjectives([
        { hidden: false, type: Criteria.Default },
        {
          amount: 1,
          hidden: false,
          optional: false,
          players: [4],
          type: Criteria.DefeatAmount,
        },
      ]),
    }),
  });

  expect(validateObjectives(mapD)).toBe(true);

  const [, gameActionResponseD] = await executeGameActions(mapD, [
    EndTurnAction(),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseD))
    .toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 0, player: 1 }, next: { funds: 0, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      Move (1,3 → 2,3) { fuel: 59, completed: false, path: [2,3] }
      AttackUnit (2,3 → 2,4) { hasCounterAttack: true, playerA: 2, playerB: 4, unitA: DryUnit { health: 20, ammo: [ [ 1, 5 ] ], statusEffect: 'Poison' }, unitB: DryUnit { health: 70 }, chargeA: 169, chargeB: 180 }
      CompleteUnit (5,1)
      EndTurn { current: { funds: 0, player: 2 }, next: { funds: 0, player: 4 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      Move (2,4 → 3,3) { fuel: 18, completed: false, path: [3,4 → 3,3] }
      EndTurn { current: { funds: 0, player: 4 }, next: { funds: 0, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }
      EndTurn { current: { funds: 0, player: 1 }, next: { funds: 0, player: 2 }, round: 2, rotatePlayers: false, supply: null, miss: false }
      GameEnd { objective: { amount: 1, completed: Set(0) {}, hidden: false, optional: false, players: [ 4 ], reward: null, type: 9 }, objectiveId: 1, toPlayer: 4, chaosStars: null }"
    `);
});

test('counter attack triggers objectives correctly', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(2, 1);
  const v3 = vec(3, 1);

  const mapA = map.copy({
    config: map.config.copy({
      objectives: defineObjectives([
        { hidden: false, type: Criteria.Default },
        {
          hidden: false,
          label: new Set([2]),
          optional: false,
          players: [2],
          type: Criteria.DefeatOneLabel,
        },
      ]),
    }),
    units: map.units
      .set(v1, Brute.create(1, { label: 2 }).setHealth(5))
      .set(v2, Alien.create(2))
      .set(v3, Pioneer.create(1)),
  });

  expect(validateObjectives(mapA)).toBe(true);

  const [, gameActionResponseA] = await executeGameActions(mapA, [
    AttackUnitAction(v1, v2),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "AttackUnit (1,1 → 2,1) { hasCounterAttack: true, playerA: 1, playerB: 2, unitA: null, unitB: DryUnit { health: 81 }, chargeA: 147, chargeB: 114 }
      GameEnd { objective: { completed: Set(0) {}, hidden: false, label: [ 2 ], optional: false, players: [ 2 ], reward: null, type: 10 }, objectiveId: 1, toPlayer: 2, chaosStars: null }"
    `);

  const mapB = map.copy({
    buildings: mapA.buildings.set(v2, House.create(2)),
    config: map.config.copy({
      objectives: defineObjectives([
        { hidden: false, type: Criteria.Default },
        {
          hidden: false,
          label: new Set([2]),
          optional: false,
          players: [2],
          type: Criteria.DefeatOneLabel,
        },
      ]),
    }),
    units: map.units
      .set(v1, SmallTank.create(1, { label: 2 }).setHealth(5))
      .set(v2, SuperTank.create(2))
      .set(v3, Pioneer.create(1)),
  });

  expect(validateObjectives(mapA)).toBe(true);

  const [, gameActionResponseB] = await executeGameActions(mapB, [
    AttackBuildingAction(v1, v2),
  ]);

  expect(
    snapshotEncodedActionResponse(gameActionResponseB),
  ).toMatchInlineSnapshot(
    `
    "AttackBuilding (1,1 → 2,1) { hasCounterAttack: true, playerA: 1, building: House { id: 2, health: 84, player: 2 }, playerC: 2, unitA: null, unitC: DryUnit { health: 100, ammo: [ [ 1, 9 ] ] }, chargeA: 9, chargeB: 0, chargeC: 0 }
    GameEnd { objective: { completed: Set(0) {}, hidden: false, label: [ 2 ], optional: false, players: [ 2 ], reward: null, type: 10 }, objectiveId: 1, toPlayer: 2, chaosStars: null }"
  `,
  );
});
