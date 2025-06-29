import {
  ActivatePowerAction,
  AttackBuildingAction,
  AttackUnitAction,
  CaptureAction,
  EndTurnAction,
} from '@deities/apollo/action-mutators/ActionMutators.tsx';
import { Factory, House, HQ, Shelter } from '@deities/athena/info/Building.tsx';
import {
  getSkillConfig,
  getSkillPowerDamage,
  Skill,
} from '@deities/athena/info/Skill.tsx';
import {
  APU,
  Bomber,
  Flamethrower,
  Helicopter,
  Infantry,
  Pioneer,
  SmallTank,
  Zombie,
} from '@deities/athena/info/Unit.tsx';
import updatePlayer from '@deities/athena/lib/updatePlayer.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import { Charge, PoisonDamage } from '@deities/athena/map/Configuration.tsx';
import { HumanPlayer } from '@deities/athena/map/Player.tsx';
import Team from '@deities/athena/map/Team.tsx';
import { UnitStatusEffect } from '@deities/athena/map/Unit.tsx';
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
      { id: 1, name: '', players: [{ funds: 500, id: 1, userId: '1' }] },
      { id: 2, name: '', players: [{ funds: 500, id: 2, userId: '4' }] },
    ],
  }),
);
const player1 = HumanPlayer.from(map.getPlayer(1), '1');
const player2 = HumanPlayer.from(map.getPlayer(2), '4');

const team3 = new Team(
  3,
  '',
  ImmutableMap([
    [
      3,
      new HumanPlayer(
        3,
        '3',
        3,
        300,
        undefined,
        new Set(),
        new Set(),
        0,
        null,
        0,
        null,
        null,
      ),
    ],
  ]),
);

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

  const [gameState, gameActionResponse] = await executeGameActions(initialMap, [
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
      BeginTurnGameOver { abandoned: false, fromPlayer: 1 }
      GameEnd { objective: null, objectiveId: null, toPlayer: 2, chaosStars: null }"
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

  const [gameState, gameActionResponse] = await executeGameActions(initialMap, [
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
      BeginTurnGameOver { abandoned: false, fromPlayer: 1 }
      GameEnd { objective: null, objectiveId: null, toPlayer: 2, chaosStars: null }"
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

  const [gameState, gameActionResponse] = await executeGameActions(initialMap, [
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
      GameEnd { objective: null, objectiveId: null, toPlayer: 1, chaosStars: null }"
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

  const [, gameActionResponse] = await executeGameActions(initialMap, [
    CaptureAction(capturePosition),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponse))
    .toMatchInlineSnapshot(`
      "Capture (2,2) { building: HQ { id: 1, health: 100, player: 1 }, player: 2 }
      CaptureGameOver { fromPlayer: 2, toPlayer: 1 }
      GameEnd { objective: null, objectiveId: null, toPlayer: 1, chaosStars: null }"
    `);
});

test('game over conditions with no HQ and no units or production facilities', async () => {
  const capturePosition = vec(2, 2);
  const v2 = vec(1, 1);
  const initialMap = map.copy({
    buildings: map.buildings.set(capturePosition, Factory.create(player2)),
    units: map.units.set(capturePosition, Pioneer.create(player1).capture()),
  });

  const [, gameActionResponseA] = await executeGameActions(initialMap, [
    CaptureAction(capturePosition),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "Capture (2,2) { building: Factory { id: 3, health: 100, player: 1 }, player: 2 }
      CaptureGameOver { fromPlayer: 2, toPlayer: 1 }
      GameEnd { objective: null, objectiveId: null, toPlayer: 1, chaosStars: null }"
    `);

  const [, gameActionResponseB] = await executeGameActions(
    initialMap.copy({
      buildings: initialMap.buildings.set(v2, House.create(2)),
    }),
    [CaptureAction(capturePosition)],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseB))
    .toMatchInlineSnapshot(`
        "Capture (2,2) { building: Factory { id: 3, health: 100, player: 1 }, player: 2 }
        CaptureGameOver { fromPlayer: 2, toPlayer: 1 }
        GameEnd { objective: null, objectiveId: null, toPlayer: 1, chaosStars: null }"
      `);

  const [, gameActionResponseC] = await executeGameActions(
    initialMap.copy({
      buildings: initialMap.buildings.set(v2, HQ.create(2)),
    }),
    [CaptureAction(capturePosition)],
  );

  expect(
    snapshotEncodedActionResponse(gameActionResponseC),
  ).toMatchInlineSnapshot(
    `"Capture (2,2) { building: Factory { id: 3, health: 100, player: 1 }, player: 2 }"`,
  );

  const [, gameActionResponseD] = await executeGameActions(
    initialMap.copy({
      buildings: initialMap.buildings.set(v2, Factory.create(2)),
    }),
    [CaptureAction(capturePosition)],
  );

  expect(
    snapshotEncodedActionResponse(gameActionResponseD),
  ).toMatchInlineSnapshot(
    `"Capture (2,2) { building: Factory { id: 3, health: 100, player: 1 }, player: 2 }"`,
  );

  const [, gameActionResponseE] = await executeGameActions(
    initialMap.copy({
      units: initialMap.units.set(v2, Flamethrower.create(2)),
    }),
    [CaptureAction(capturePosition)],
  );

  expect(
    snapshotEncodedActionResponse(gameActionResponseE),
  ).toMatchInlineSnapshot(
    `"Capture (2,2) { building: Factory { id: 3, health: 100, player: 1 }, player: 2 }"`,
  );
});

test('if the player self-destructs, an end-turn action is issued', async () => {
  const map = withModifiers(
    MapData.createMap({
      map: [1, 1, 1, 1, 1, 1, 1, 1, 1],
      size: { height: 3, width: 3 },
      teams: [
        { id: 1, name: '', players: [{ funds: 500, id: 1, userId: '1' }] },
        { id: 2, name: '', players: [{ funds: 500, id: 2, userId: '4' }] },
        { id: 3, name: '', players: [{ funds: 500, id: 3, userId: '5' }] },
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

  const [, gameActionResponse] = await executeGameActions(initialMap, [
    AttackUnitAction(vecA, vecB),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponse))
    .toMatchInlineSnapshot(`
      "AttackUnit (1,1 → 2,1) { hasCounterAttack: true, playerA: 1, playerB: 2, unitA: null, unitB: DryUnit { health: 95, ammo: [ [ 1, 6 ] ] }, chargeA: 9, chargeB: 18 }
      AttackUnitGameOver { fromPlayer: 1, toPlayer: 2 }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }"
    `);
});

test('defeating a neutral unit does not end or crash the game', async () => {
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

  const [, gameActionResponse] = await executeGameActions(initialMap, [
    AttackUnitAction(vecA, vecB),
  ]);

  expect(
    snapshotEncodedActionResponse(gameActionResponse),
  ).toMatchInlineSnapshot(
    `"AttackUnit (1,1 → 2,1) { hasCounterAttack: false, playerA: 1, playerB: 0, unitA: DryUnit { health: 100, ammo: [ [ 1, 6 ] ] }, unitB: null, chargeA: 0, chargeB: null }"`,
  );
});

test('destroying a building with a neutral unit does not end the game', async () => {
  const map = withModifiers(
    MapData.createMap({
      map: [1, 1, 1, 1, 1, 1, 1, 1, 1],
      size: { height: 3, width: 3 },
    }),
  );
  const vecA = vec(1, 1);
  const vecB = vec(2, 1);
  const vecC = vec(3, 1);
  const initialMap = map.copy({
    buildings: map.buildings.set(vecB, House.create(2).setHealth(1)),
    units: map.units
      .set(vecA, SmallTank.create(player1))
      .set(vecB, Pioneer.create(0))
      .set(vecC, Pioneer.create(2)),
  });

  const [, gameActionResponse] = await executeGameActions(initialMap, [
    AttackBuildingAction(vecA, vecB),
  ]);

  expect(
    snapshotEncodedActionResponse(gameActionResponse),
  ).toMatchInlineSnapshot(
    `"AttackBuilding (1,1 → 2,1) { hasCounterAttack: false, playerA: 1, building: null, playerC: 0, unitA: DryUnit { health: 100, ammo: [ [ 1, 6 ] ] }, unitC: null, chargeA: null, chargeB: 1200, chargeC: 100, playerB: 2 }"`,
  );
});

test('destroying a building with no production facility ends the game', async () => {
  const map = withModifiers(
    MapData.createMap({
      map: [1, 1, 1, 1, 1, 1, 1, 1, 1],
      size: { height: 3, width: 3 },
    }),
  );
  const vecA = vec(1, 1);
  const vecB = vec(2, 1);
  const initialMap = map.copy({
    buildings: map.buildings.set(vecB, Factory.create(2).setHealth(1)),
    units: map.units.set(vecA, SmallTank.create(player1)),
  });

  const [, gameActionResponse] = await executeGameActions(initialMap, [
    AttackBuildingAction(vecA, vecB),
  ]);

  expect(
    snapshotEncodedActionResponse(gameActionResponse),
  ).toMatchInlineSnapshot(
    `
    "AttackBuilding (1,1 → 2,1) { hasCounterAttack: false, playerA: 1, building: null, playerC: null, unitA: DryUnit { health: 100, ammo: [ [ 1, 6 ] ] }, unitC: null, chargeA: null, chargeB: 1500, chargeC: null, playerB: 2 }
    AttackBuildingGameOver { fromPlayer: 2, toPlayer: 1 }
    GameEnd { objective: null, objectiveId: null, toPlayer: 1, chaosStars: null }"
  `,
  );
});

test('destroying a building with no production facility can beat two players at once', async () => {
  const map = withModifiers(
    MapData.createMap({
      map: [1, 1, 1, 1, 1, 1, 1, 1, 1],
      size: { height: 3, width: 3 },
    }),
  );
  const vecA = vec(1, 1);
  const vecB = vec(2, 1);
  const initialMap = map.copy({
    active: [1, 2, 3],
    buildings: map.buildings.set(vecB, Factory.create(2).setHealth(1)),
    teams: map.teams.set(3, team3),
    units: map.units
      .set(vecA, SmallTank.create(player1))
      .set(vecB, Flamethrower.create(3)),
  });

  const [, gameActionResponse] = await executeGameActions(initialMap, [
    AttackBuildingAction(vecA, vecB),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponse))
    .toMatchInlineSnapshot(`
    "AttackBuilding (1,1 → 2,1) { hasCounterAttack: false, playerA: 1, building: null, playerC: 3, unitA: DryUnit { health: 100, ammo: [ [ 1, 6 ] ] }, unitC: null, chargeA: null, chargeB: 1500, chargeC: 400, playerB: 2 }
    AttackUnitGameOver { fromPlayer: 3, toPlayer: 1 }
    AttackBuildingGameOver { fromPlayer: 2, toPlayer: 1 }
    GameEnd { objective: null, objectiveId: null, toPlayer: 1, chaosStars: null }"
  `);
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

  const [, gameActionResponse] = await executeGameActions(initialMap, [
    AttackUnitAction(vecA, vecB),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponse))
    .toMatchInlineSnapshot(`
      "AttackUnit (1,1 → 2,1) { hasCounterAttack: true, playerA: 1, playerB: 2, unitA: DryUnit { health: 74, ammo: [ [ 1, 4 ] ] }, unitB: DryUnit { health: 34 }, chargeA: 147, chargeB: 132 }
      AttackUnitGameOver { fromPlayer: 2, toPlayer: 1 }
      GameEnd { objective: null, objectiveId: null, toPlayer: 1, chaosStars: null }"
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

  const [, gameActionResponse] = await executeGameActions(initialMap, [
    AttackBuildingAction(vecA, vecB),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponse))
    .toMatchInlineSnapshot(`
      "AttackBuilding (1,1 → 2,1) { hasCounterAttack: true, playerA: 1, building: House { id: 2, health: 39, player: 2 }, playerC: 2, unitA: DryUnit { health: 92, ammo: [ [ 1, 6 ] ] }, unitC: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, chargeA: 15, chargeB: 0, chargeC: 0, playerB: 2 }
      AttackUnitGameOver { fromPlayer: 1, toPlayer: 2 }
      GameEnd { objective: null, objectiveId: null, toPlayer: 2, chaosStars: null }"
    `);
});

test('lose the game if you destroy the last unit of the opponent but miss your own win condition', async () => {
  const initialMap = withModifiers(
    MapData.createMap({
      map: [1, 8, 1, 1, 1, 1, 1, 1, 1],
      size: { height: 3, width: 3 },
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

  const [, gameActionResponse] = await executeGameActions(map, [
    AttackBuildingAction(from, to),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponse))
    .toMatchInlineSnapshot(`
      "AttackBuilding (1,1 → 2,1) { hasCounterAttack: false, playerA: 1, building: null, playerC: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 5 ] ] }, unitC: null, chargeA: null, chargeB: 1200, chargeC: 2000, playerB: 2 }
      GameEnd { objective: { bonus: undefined, completed: Set(0) {}, hidden: false, label: [ 1 ], optional: false, players: [ 1 ], reward: null, type: 1 }, objectiveId: 1, toPlayer: 2, chaosStars: null }"
    `);
});

test('game over through poison status effects', async () => {
  const initialMap = map.copy({
    units: map.units
      .set(
        vec(2, 2),
        Flamethrower.create(player1)
          .setStatusEffect(UnitStatusEffect.Poison)
          .setHealth(PoisonDamage + 10),
      )
      .set(vec(4, 4), Helicopter.create(player2)),
  });

  const [gameStateA, gameActionResponseA] = await executeGameActions(
    initialMap,
    [EndTurnAction(), EndTurnAction(), EndTurnAction(), EndTurnAction()],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      EndTurn { current: { funds: 500, player: 2 }, next: { funds: 500, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 2, rotatePlayers: false, supply: null, miss: false }
      EndTurn { current: { funds: 500, player: 2 }, next: { funds: 500, player: 1 }, round: 3, rotatePlayers: false, supply: null, miss: false }
      BeginTurnGameOver { abandoned: false, fromPlayer: 1 }
      GameEnd { objective: null, objectiveId: null, toPlayer: 2, chaosStars: null }"
    `);

  const initialState = await captureOne(initialMap, player1.userId);
  printGameState('Base State', initialState);
  expect(initialState).toMatchImageSnapshot();

  const finalState = await captureOne(gameStateA.at(-1)![1], player1.userId);
  printGameState('Final State', finalState);
  expect(finalState).toMatchImageSnapshot();

  const [, gameActionResponseB] = await executeGameActions(
    initialMap.copy({
      buildings: initialMap.buildings.set(vec(2, 2), Shelter.create(1)),
    }),
    [EndTurnAction(), EndTurnAction(), EndTurnAction(), EndTurnAction()],
  );

  expect(snapshotEncodedActionResponse(gameActionResponseB))
    .toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      EndTurn { current: { funds: 500, player: 2 }, next: { funds: 550, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }
      EndTurn { current: { funds: 550, player: 1 }, next: { funds: 500, player: 2 }, round: 2, rotatePlayers: false, supply: null, miss: false }
      EndTurn { current: { funds: 500, player: 2 }, next: { funds: 600, player: 1 }, round: 3, rotatePlayers: false, supply: null, miss: false }"
    `);
});

test('game over through activating a power', async () => {
  const skill = Skill.BuyUnitOctopus;
  const skills = new Set([skill]);
  const { charges } = getSkillConfig(skill);
  const mapA = map.copy({
    teams: updatePlayer(
      map.teams,
      map.getPlayer(2).copy({ charge: (charges || 0) * Charge, skills }),
    ),
    units: map.units
      .set(
        vec(2, 2),
        Flamethrower.create(player1).setHealth(getSkillPowerDamage(skill) - 1),
      )
      .set(vec(4, 4), Helicopter.create(player2)),
  });

  const [, gameActionResponseA] = await executeGameActions(mapA, [
    EndTurnAction(),
    ActivatePowerAction(skill, null),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      ActivatePower () { skill: 26, units: null, free: false }
      AttackUnitGameOver { fromPlayer: 1, toPlayer: 2 }
      GameEnd { objective: null, objectiveId: null, toPlayer: 2, chaosStars: null }"
    `);

  const mapB = mapA.copy({
    config: mapA.config.copy({
      objectives: ImmutableMap([
        [
          0,
          {
            amount: 1,
            hidden: false,
            optional: false,
            type: Criteria.DefeatAmount,
          },
        ],
      ]),
    }),
  });

  const [, gameActionResponseB] = await executeGameActions(mapB, [
    EndTurnAction(),
    ActivatePowerAction(skill, null),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseB))
    .toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      ActivatePower () { skill: 26, units: null, free: false }
      GameEnd { objective: { amount: 1, bonus: undefined, completed: Set(0) {}, hidden: false, optional: false, players: [], reward: null, type: 9 }, objectiveId: 0, toPlayer: 2, chaosStars: null }"
    `);
});

test('game over through activating a power can beat more than one player', async () => {
  const skill = Skill.BuyUnitOctopus;
  const skills = new Set([skill]);
  const { charges } = getSkillConfig(skill);
  const mapA = map.copy({
    active: [1, 2, 3],
    teams: updatePlayer(
      map.teams.set(3, team3),
      map.getPlayer(2).copy({ charge: (charges || 0) * Charge, skills }),
    ),
    units: map.units
      .set(vec(2, 2), Flamethrower.create(player1).setHealth(1))
      .set(vec(4, 4), Helicopter.create(player2))
      .set(vec(1, 1), Flamethrower.create(3)),
  });

  const [, gameActionResponseA] = await executeGameActions(mapA, [
    EndTurnAction(),
    ActivatePowerAction(skill, null),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      ActivatePower () { skill: 26, units: null, free: false }
      AttackUnitGameOver { fromPlayer: 1, toPlayer: 2 }"
    `);

  const mapB = mapA.copy({
    units: mapA.units.set(vec(1, 1), Flamethrower.create(3).setHealth(1)),
  });

  const [, gameActionResponseB] = await executeGameActions(mapB, [
    EndTurnAction(),
    ActivatePowerAction(skill, null),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseB))
    .toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      ActivatePower () { skill: 26, units: null, free: false }
      AttackUnitGameOver { fromPlayer: 1, toPlayer: 2 }
      AttackUnitGameOver { fromPlayer: 3, toPlayer: 2 }
      GameEnd { objective: null, objectiveId: null, toPlayer: 2, chaosStars: null }"
    `);
});
