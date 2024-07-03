import {
  AttackUnitAction,
  CaptureAction,
  CreateUnitAction,
  EndTurnAction,
  MoveAction,
  StartAction,
} from '@deities/apollo/action-mutators/ActionMutators.tsx';
import { Effect, Effects } from '@deities/apollo/Effects.tsx';
import { RelativeVectors } from '@deities/apollo/lib/transformEffectValue.tsx';
import { Barracks } from '@deities/athena/info/Building.tsx';
import {
  Flamethrower,
  Helicopter,
  Pioneer,
  SmallTank,
} from '@deities/athena/info/Unit.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import { AIBehavior } from '@deities/athena/map/AIBehavior.tsx';
import { HumanPlayer } from '@deities/athena/map/Player.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { Criteria } from '@deities/athena/Objectives.tsx';
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
        players: [{ funds: 10_000, id: 1, userId: '1' }],
      },
      {
        id: 2,
        name: '',
        players: [{ funds: 500, id: 2, name: 'Bot' }],
      },
    ],
  }),
);
const player1 = HumanPlayer.from(map.getPlayer(1), '1');

test('applies an effect after a unit moves and drops it', async () => {
  const vecA = vec(1, 1);
  const vecB = vec(2, 3);
  const vecC = vec(3, 3);
  const vecD = vec(3, 2);
  const initialMap = map.copy({
    units: map.units
      .set(vecA, SmallTank.create(player1))
      .set(vecC, Helicopter.create(2).setHealth(1)),
  });

  const effects: Effects = new Map([
    [
      'Move',
      new Set<Effect>([
        {
          actions: [
            { from: vecB, to: vecD, type: 'Move' },
            {
              message: `Rollin' Rollin' Rollin'`,
              player: 'self',
              type: 'CharacterMessageEffect',
              unitId: SmallTank.id,
              variant: 1,
            },
          ],
          occurrence: 'once',
        },
      ]),
    ],
    [
      'AttackUnit',
      new Set<Effect>([{ actions: [{ from: vecC, type: 'CompleteUnit' }] }]),
    ],
  ]);

  const [, gameActionResponse, newEffects] = executeGameActions(
    initialMap,
    [MoveAction(vecA, vecB)],
    effects,
  );

  expect(snapshotEncodedActionResponse(gameActionResponse))
    .toMatchInlineSnapshot(`
      "Move (1,1 → 2,3) { fuel: 27, completed: false, path: [2,1 → 2,2 → 2,3] }
      Move (2,3 → 3,2) { fuel: 25, completed: false, path: [2,2 → 3,2] }
      CharacterMessage { message: 'Rollin' Rollin' Rollin'', player: 'self', unitId: 5, variant: 1 }"
    `);

  expect(newEffects).toMatchInlineSnapshot(`
    Map {
      "AttackUnit" => Set {
        {
          "actions": [
            {
              "from": [
                3,
                3,
              ],
              "type": "CompleteUnit",
            },
          ],
        },
      },
    }
  `);
});

test('silently discard an effect if an action cannot be applied', async () => {
  const vecA = vec(1, 1);
  const vecB = vec(2, 3);
  const vecC = vec(3, 3);
  const initialMap = map.copy({
    units: map.units
      .set(vecA, SmallTank.create(player1))
      .set(vecC, Helicopter.create(2).setHealth(1)),
  });

  const effects: Effects = new Map([
    [
      'Move',
      new Set([
        {
          actions: [{ from: vecA, to: vecB, type: 'Move' }],
          occurrence: 'once',
        },
      ]),
    ],
  ]);

  const [, gameActionResponse] = executeGameActions(
    initialMap,
    [MoveAction(vecA, vecB)],
    effects,
  );

  expect(
    snapshotEncodedActionResponse(gameActionResponse),
  ).toMatchInlineSnapshot(
    `"Move (1,1 → 2,3) { fuel: 27, completed: false, path: [2,1 → 2,2 → 2,3] }"`,
  );
});

test('effects are also applied in the AI', async () => {
  const vecA = vec(1, 1);
  const vecC = vec(3, 3);
  const initialMap = map.copy({
    units: map.units
      .set(vecA, SmallTank.create(player1))
      .set(vecC, Helicopter.create(2).setHealth(1)),
  });

  const effects: Effects = new Map([
    [
      'Move',
      new Set<Effect>([
        {
          actions: [
            {
              from: vec(2, 1),
              to: vecC,
              type: 'Move',
            },
          ],
          occurrence: 'once',
          players: new Set([2]),
        },
      ]),
    ],
  ]);

  const [, gameActionResponse, newEffects] = executeGameActions(
    initialMap,
    [EndTurnAction()],
    effects,
  );

  expect(
    snapshotEncodedActionResponse(gameActionResponse),
  ).toMatchInlineSnapshot(
    `
    "EndTurn { current: { funds: 10000, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
    Move (3,3 → 2,1) { fuel: 36, completed: false, path: [3,2 → 2,2 → 2,1] }
    Move (2,1 → 3,3) { fuel: 33, completed: false, path: [3,1 → 3,2 → 3,3] }
    EndTurn { current: { funds: 500, player: 2 }, next: { funds: 10000, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }"
  `,
  );
  expect(newEffects).toMatchInlineSnapshot('Map {}');
});

test('creates a second unit every time a Flamethrower is created', async () => {
  const vecA = vec(1, 1);
  const vecB = vec(2, 3);
  const vecC = vec(3, 3);
  const vecD = vec(1, 3);
  const initialMap = map.copy({
    buildings: map.buildings
      .set(vecA, Barracks.create(player1))
      .set(vecB, Barracks.create(player1))
      .set(vecD, Barracks.create(player1)),
    units: map.units.set(
      vecC,
      Pioneer.create(2, { behavior: AIBehavior.Stay }),
    ),
  });

  const effects: Effects = new Map([
    [
      'CreateUnit',
      new Set<Effect>([
        {
          actions: [
            {
              from: RelativeVectors.Source,
              id: Flamethrower.id,
              to: RelativeVectors.Any,
              type: 'CreateUnit',
            },
          ],
          conditions: [
            {
              from: RelativeVectors.Target,
              target: [Flamethrower.id],
              type: 'UnitEquals',
            },
          ],
        },
      ]),
    ],
  ]);

  const [, gameActionResponse] = executeGameActions(
    initialMap,
    [
      CreateUnitAction(vecA, Flamethrower.id, vecA.right()),
      CreateUnitAction(vecB, Pioneer.id, vecB),
      CreateUnitAction(vecD, Flamethrower.id, vecD),
      EndTurnAction(),
    ],
    effects,
  );

  expect(snapshotEncodedActionResponse(gameActionResponse))
    .toMatchInlineSnapshot(`
      "CreateUnit (1,1 → 2,1) { unit: Flamethrower { id: 15, health: 100, player: 1, fuel: 30, ammo: [ [ 1, 4 ] ], moved: true, name: 'Yuki', completed: true }, free: false, skipBehaviorRotation: false }
      CreateUnit (1,1 → 1,1) { unit: Flamethrower { id: 15, health: 100, player: 1, fuel: 30, ammo: [ [ 1, 4 ] ], moved: true, name: 'Blair', completed: true }, free: true, skipBehaviorRotation: false }
      CreateUnit (2,3 → 2,3) { unit: Pioneer { id: 1, health: 100, player: 1, fuel: 40, moved: true, name: 'Sam', completed: true }, free: false, skipBehaviorRotation: false }
      CreateUnit (1,3 → 1,3) { unit: Flamethrower { id: 15, health: 100, player: 1, fuel: 30, ammo: [ [ 1, 4 ] ], moved: true, name: 'Riley', completed: true }, free: false, skipBehaviorRotation: false }
      CreateUnit (1,3 → 1,2) { unit: Flamethrower { id: 15, health: 100, player: 1, fuel: 30, ammo: [ [ 1, 4 ] ], moved: true, name: 'Cameron', completed: true }, free: true, skipBehaviorRotation: false }
      EndTurn { current: { funds: 9100, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      EndTurn { current: { funds: 500, player: 2 }, next: { funds: 9100, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }"
    `);
});

test('spawns an additional unit', async () => {
  const vecA = vec(1, 1);
  const vecB = vec(1, 2);
  const vecC = vec(3, 3);
  const vecD = vec(1, 3);
  const initialMap = map.copy({
    units: map.units
      .set(vecA, Pioneer.create(1))
      .set(vecB, Pioneer.create(1))
      .set(vecD, Pioneer.create(2)),
  });

  const effects: Effects = new Map([
    [
      'EndTurn',
      new Set<Effect>([
        {
          actions: [
            {
              player: 'self',
              type: 'SpawnEffect',
              units: ImmutableMap([[vecC, Flamethrower.create(0)]]),
            },
          ],
          occurrence: 'once',
        },
      ]),
    ],
  ]);

  const [, gameActionResponse] = executeGameActions(
    initialMap,
    [EndTurnAction()],
    effects,
  );

  expect(snapshotEncodedActionResponse(gameActionResponse))
    .toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 10000, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      Spawn { units: [3,3 → Flamethrower { id: 15, health: 100, player: 2, fuel: 30, ammo: [ [ 1, 4 ] ], name: 'Yuki' }], teams: null }
      Move (3,3 → 2,1) { fuel: 27, completed: false, path: [3,2 → 2,2 → 2,1] }
      AttackUnit (2,1 → 1,1) { hasCounterAttack: false, playerA: 2, playerB: 1, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 33, chargeB: 100 }
      CompleteUnit (1,3)
      EndTurn { current: { funds: 500, player: 2 }, next: { funds: 10000, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }"
    `);
});

test('spawns a neutral unit', async () => {
  const vecA = vec(1, 1);
  const vecB = vec(1, 2);
  const vecC = vec(3, 3);
  const vecD = vec(1, 3);
  const initialMap = map.copy({
    units: map.units
      .set(vecA, Pioneer.create(1))
      .set(vecB, Pioneer.create(1))
      .set(vecD, Pioneer.create(2)),
  });

  const effects: Effects = new Map([
    [
      'EndTurn',
      new Set<Effect>([
        {
          actions: [
            {
              player: 0,
              type: 'SpawnEffect',
              units: ImmutableMap([[vecC, Flamethrower.create(0)]]),
            },
          ],
          occurrence: 'once',
        },
      ]),
    ],
  ]);

  const [, gameActionResponse] = executeGameActions(
    initialMap,
    [EndTurnAction()],
    effects,
  );

  expect(snapshotEncodedActionResponse(gameActionResponse))
    .toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 10000, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      Spawn { units: [3,3 → Flamethrower { id: 15, health: 100, player: 0, fuel: 30, ammo: [ [ 1, 4 ] ], name: 'Casey' }], teams: null }
      Move (1,3 → 2,3) { fuel: 39, completed: false, path: [2,3] }
      Rescue (2,3 → 3,3) { player: 2, name: null }
      EndTurn { current: { funds: 500, player: 2 }, next: { funds: 10000, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }"
    `);
});

test('effects work for game start and end', async () => {
  const vecA = vec(1, 1);
  const vecB = vec(2, 3);
  const vecC = vec(3, 3);
  const initialMap = map.copy({
    units: map.units
      .set(vecA, SmallTank.create(player1))
      .set(vecC, Pioneer.create(2).setHealth(1)),
  });

  const effects: Effects = new Map([
    [
      'Start',
      new Set<Effect>([
        {
          actions: [
            {
              message: `Let's go!`,
              player: 'self',
              type: 'CharacterMessageEffect',
              unitId: SmallTank.id,
              variant: 0,
            },
          ],
        },
      ]),
    ],
    [
      'GameEnd',
      new Set<Effect>([
        {
          actions: [
            {
              message: `I win again!`,
              player: 'self',
              type: 'CharacterMessageEffect',
              unitId: SmallTank.id,
              variant: 1,
            },
          ],
          conditions: [
            {
              type: 'GameEnd',
              value: 'win',
            },
          ],
        },
      ]),
    ],
  ]);

  const [, gameActionResponse, newEffects] = executeGameActions(
    initialMap,
    [StartAction(), MoveAction(vecA, vecB), AttackUnitAction(vecB, vecC)],
    effects,
  );

  expect(snapshotEncodedActionResponse(gameActionResponse))
    .toMatchInlineSnapshot(`
      "Start
      CharacterMessage { message: 'Let's go!', player: 'self', unitId: 5, variant: 0 }
      BeginGame
      Move (1,1 → 2,3) { fuel: 27, completed: false, path: [2,1 → 2,2 → 2,3] }
      AttackUnit (2,3 → 3,3) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 6 ] ] }, unitB: null, chargeA: 0, chargeB: 1 }
      AttackUnitGameOver { fromPlayer: 2, toPlayer: 1 }
      SetViewer
      CharacterMessage { message: 'I win again!', player: 'self', unitId: 5, variant: 1 }
      GameEnd { objective: null, objectiveId: null, toPlayer: 1 }"
    `);

  expect(newEffects?.get('Start')).toMatchInlineSnapshot(`
    Set {
      {
        "actions": [
          {
            "message": "Let's go!",
            "player": "self",
            "type": "CharacterMessageEffect",
            "unitId": 5,
            "variant": 0,
          },
        ],
      },
    }
  `);
});

test('effects work when a player loses', () => {
  const vecA = vec(1, 1);
  const vecB = vec(2, 3);
  const vecC = vec(3, 3);
  const initialMap = map.copy({
    units: map.units
      .set(vecA, Pioneer.create(player1).setHealth(1))
      .set(vecC, SmallTank.create(2).setHealth(1)),
  });

  const effects: Effects = new Map([
    [
      'Start',
      new Set<Effect>([
        {
          actions: [
            {
              message: `Let's go!`,
              player: 'self',
              type: 'CharacterMessageEffect',
              unitId: SmallTank.id,
              variant: 0,
            },
          ],
        },
      ]),
    ],
    [
      'GameEnd',
      new Set<Effect>([
        {
          actions: [
            {
              message: `I win again!`,
              player: 'self',
              type: 'CharacterMessageEffect',
              unitId: SmallTank.id,
              variant: 1,
            },
          ],
          conditions: [
            {
              type: 'GameEnd',
              value: 'win',
            },
          ],
        },
        {
          actions: [
            {
              message: `Oh no.`,
              player: 'self',
              type: 'CharacterMessageEffect',
              unitId: SmallTank.id,
              variant: 2,
            },
          ],
          conditions: [
            {
              type: 'GameEnd',
              value: 'lose',
            },
          ],
        },
      ]),
    ],
  ]);

  const [, gameActionResponse] = executeGameActions(
    initialMap,
    [
      StartAction(),
      EndTurnAction(),
      MoveAction(vecC, vecB),
      AttackUnitAction(vecB, vecA),
    ],
    effects,
  );

  expect(snapshotEncodedActionResponse(gameActionResponse))
    .toMatchInlineSnapshot(`
      "Start
      CharacterMessage { message: 'Let's go!', player: 'self', unitId: 5, variant: 0 }
      BeginGame
      EndTurn { current: { funds: 10000, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      Move (3,3 → 2,1) { fuel: 27, completed: false, path: [3,2 → 2,2 → 2,1] }
      AttackUnit (2,1 → 1,1) { hasCounterAttack: false, playerA: 2, playerB: 1, unitA: DryUnit { health: 1, ammo: [ [ 1, 6 ] ] }, unitB: null, chargeA: 0, chargeB: 1 }
      AttackUnitGameOver { fromPlayer: 1, toPlayer: 2 }
      SetViewer
      CharacterMessage { message: 'Oh no.', player: 'self', unitId: 5, variant: 2 }
      GameEnd { objective: null, objectiveId: null, toPlayer: 2 }"
    `);
});

test('only one game end win effect is fired', () => {
  const vecA = vec(1, 1);
  const vecB = vec(3, 3);
  const initialMap = map.copy({
    buildings: map.buildings.set(vecA, Barracks.create(2)),
    config: map.config.copy({
      objectives: ImmutableMap([
        [
          0,
          {
            hidden: false,
            type: Criteria.Default,
          },
        ],
        [
          1,
          {
            amount: 1,
            hidden: false,
            optional: false,
            type: Criteria.CaptureAmount,
          },
        ],
      ]),
    }),
    units: map.units
      .set(vecA, Pioneer.create(player1).capture())
      .set(vecB, SmallTank.create(2).setHealth(1)),
  });

  const effects: Effects = new Map([
    [
      'GameEnd',
      new Set<Effect>([
        {
          actions: [
            {
              message: `I win again!`,
              player: 'self',
              type: 'CharacterMessageEffect',
              unitId: SmallTank.id,
              variant: 1,
            },
          ],
          conditions: [
            {
              type: 'GameEnd',
              value: 'win',
            },
          ],
        },
        {
          actions: [
            {
              message: `Yay`,
              player: 'self',
              type: 'CharacterMessageEffect',
              unitId: SmallTank.id,
              variant: 1,
            },
          ],
          conditions: [
            {
              type: 'GameEnd',
              value: 1,
            },
          ],
        },
      ]),
    ],
  ]);

  const [, gameActionResponse] = executeGameActions(
    initialMap,
    [CaptureAction(vecA)],
    effects,
  );

  expect(snapshotEncodedActionResponse(gameActionResponse))
    .toMatchInlineSnapshot(`
      "Capture (1,1) { building: Barracks { id: 12, health: 100, player: 1 }, player: 2 }
      SetViewer
      CharacterMessage { message: 'Yay', player: 'self', unitId: 5, variant: 1 }
      GameEnd { objective: { amount: 1, completed: Set(0) {}, hidden: false, optional: false, players: [], reward: null, type: 2 }, objectiveId: 1, toPlayer: 1 }"
    `);
});

test('a unit spawns instead of ending the game', async () => {
  const vecA = vec(1, 1);
  const vecB = vec(2, 3);
  const vecC = vec(3, 3);
  const initialMap = map.copy({
    units: map.units
      .set(vecA, SmallTank.create(player1))
      .set(vecC, Pioneer.create(2).setHealth(1)),
  });

  const effects: Effects = new Map([
    [
      'AttackUnitGameOver',
      new Set<Effect>([
        {
          actions: [
            {
              type: 'SpawnEffect',
              units: ImmutableMap([[vecA, Flamethrower.create(2)]]),
            },
          ],
          occurrence: 'once',
        },
      ]),
    ],
  ]);

  const [, gameActionResponse, newEffects] = executeGameActions(
    initialMap,
    [MoveAction(vecA, vecB), AttackUnitAction(vecB, vecC)],
    effects,
  );

  expect(snapshotEncodedActionResponse(gameActionResponse))
    .toMatchInlineSnapshot(`
      "Move (1,1 → 2,3) { fuel: 27, completed: false, path: [2,1 → 2,2 → 2,3] }
      AttackUnit (2,3 → 3,3) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 6 ] ] }, unitB: null, chargeA: 0, chargeB: 1 }
      Spawn { units: [1,1 → Flamethrower { id: 15, health: 100, player: 2, fuel: 30, ammo: [ [ 1, 4 ] ], name: 'Yuki' }], teams: null }"
    `);

  expect(newEffects?.get('AttackUnitGameOver')).toBeUndefined();
});

test('spawns a new unit when a player loses their last unit at the beginning of a turn', async () => {
  const vecA = vec(1, 1);
  const vecB = vec(2, 3);
  const vecC = vec(3, 3);
  const vecD = vec(1, 3);
  const initialMap = map.copy({
    buildings: map.buildings.set(vecD, Barracks.create(2)),
    units: map.units
      .set(vecA, SmallTank.create(player1))
      .set(vecC, Helicopter.create(2).setFuel(0)),
  });

  const effects: Effects = new Map([
    [
      'BeginTurnGameOver',
      new Set<Effect>([
        {
          actions: [
            {
              type: 'SpawnEffect',
              units: ImmutableMap([[vecB, Flamethrower.create(2)]]),
            },
          ],
          occurrence: 'once',
        },
      ]),
    ],
  ]);

  const [gameState, gameActionResponse, newEffects] = executeGameActions(
    initialMap,
    [EndTurnAction()],
    effects,
  );

  expect(snapshotEncodedActionResponse(gameActionResponse))
    .toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 10000, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      Spawn { units: [2,3 → Flamethrower { id: 15, health: 100, player: 2, fuel: 30, ammo: [ [ 1, 4 ] ], name: 'Yuki' }], teams: null }
      Move (2,3 → 2,1) { fuel: 28, completed: false, path: [2,2 → 2,1] }
      AttackUnit (2,1 → 1,1) { hasCounterAttack: true, playerA: 2, playerB: 1, unitA: DryUnit { health: 68, ammo: [ [ 1, 3 ] ] }, unitB: DryUnit { health: 68, ammo: [ [ 1, 6 ] ] }, chargeA: 167, chargeB: 120 }
      CreateUnit (1,3 → 1,2) { unit: Rocket Launcher { id: 3, health: 100, player: 2, fuel: 40, ammo: [ [ 1, 4 ] ], moved: true, name: 'Davide', completed: true }, free: false, skipBehaviorRotation: false }
      EndTurn { current: { funds: 225, player: 2 }, next: { funds: 10000, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }"
    `);

  expect(newEffects?.get('BeginTurnGameOver')).toBeUndefined();

  // Verify that the building is still owned by Player 2.
  const lastMap = gameState.at(-1)![1];
  expect(lastMap).toBeDefined();
  expect(lastMap.buildings.get(vecD)?.format()).toMatchInlineSnapshot(`
    {
      "health": 100,
      "id": 12,
      "player": 2,
    }
  `);
});
