import { EndTurnAction } from '@deities/apollo/action-mutators/ActionMutators.tsx';
import executeGameAction from '@deities/apollo/actions/executeGameAction.tsx';
import {
  Airbase,
  Barracks,
  Factory,
  filterBuildings,
  House,
  HQ,
  RepairShop,
  Shipyard,
} from '@deities/athena/info/Building.tsx';
import {
  Airfield,
  ConstructionSite,
  Forest,
  Plain,
  RailTrack,
  Sea,
  ShipyardConstructionSite,
} from '@deities/athena/info/Tile.tsx';
import {
  Artillery,
  Battleship,
  Corvette,
  FighterJet,
  Flamethrower,
  HeavyArtillery,
  HeavyTank,
  Humvee,
  Infantry,
  Jetpack,
  Pioneer,
  Saboteur,
  SmallTank,
  Sniper,
  SuperTank,
  TransportHelicopter,
  XFighter,
} from '@deities/athena/info/Unit.tsx';
import updatePlayer from '@deities/athena/lib/updatePlayer.tsx';
import updatePlayers from '@deities/athena/lib/updatePlayers.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import { AIBehavior } from '@deities/athena/map/AIBehavior.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData, { SizeVector } from '@deities/athena/MapData.tsx';
import { Criteria } from '@deities/athena/Objectives.tsx';
import AIRegistry from '@deities/dionysus/AIRegistry.tsx';
import ImmutableMap from '@nkzw/immutable-map';
import { expect, test } from 'vitest';
import snapshotGameState from '../snapshotGameState.tsx';

const initialMap = MapData.createMap({
  config: {
    fog: true,
  },
  map: [1, 1, ConstructionSite.id, 1, 1, 1, 1, 1, 1],
  size: {
    height: 3,
    width: 3,
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
const player1 = initialMap.getPlayer(1);

test('attempt to attack new units when they are revealed after a move', async () => {
  const from = vec(1, 1);
  const to = vec(3, 3);
  const map = initialMap.copy({
    buildings: initialMap.buildings.set(to, House.create(player1)),
    units: initialMap.units
      .set(from, Infantry.create(2))
      .set(to, Infantry.create(1)),
  });

  const [, , gameState] = executeGameAction(
    map,
    map.createVisionObject(player1),
    new Map(),
    EndTurnAction(),
    AIRegistry,
  );

  expect(snapshotGameState(gameState)).toMatchInlineSnapshot(`
    "Move (1,1 → 3,2) { fuel: 47, completed: null, path: [2,1 → 2,2 → 3,2] }
    AttackUnit (3,2 → 3,3) { hasCounterAttack: true, playerA: 2, playerB: 1, unitA: DryUnit { health: 75 }, unitB: DryUnit { health: 45 }, chargeA: 86, chargeB: 110 }
    EndTurn { current: { funds: 1000, player: 2 }, next: { funds: 100, player: 1 }, round: 2, rotatePlayers: null, supply: null, miss: null }"
  `);
});

test('attempt to attack new units when they are revealed after creating a unit', async () => {
  const vecA = vec(1, 1);
  const vecB = vec(3, 3);
  const vecC = vec(1, 3);
  const tileMap = initialMap.map.slice();
  tileMap[initialMap.getTileIndex(vecC.up())] = Sea.id;
  const map = initialMap.copy({
    buildings: initialMap.buildings
      .set(vecB, House.create(1))
      .set(vecC, Factory.create(2)),
    map: tileMap,
    units: initialMap.units
      .set(vecA, HeavyArtillery.create(2).setFuel(0))
      .set(vecC, Sniper.create(2).complete())
      .set(vecB, Pioneer.create(1)),
  });

  const [, , gameState] = executeGameAction(
    map,
    map.createVisionObject(player1),
    new Map(),
    EndTurnAction(),
    AIRegistry,
  );

  expect(snapshotGameState(gameState)).toMatchInlineSnapshot(`
    "CreateUnit (1,3 → 2,3) { unit: Jeep { id: 6, health: 100, player: 2, fuel: 60, moved: true, name: 'Remy', completed: true }, free: false, skipBehaviorRotation: false }
    AttackUnit (1,1 → 3,3) { hasCounterAttack: false, playerA: 2, playerB: 1, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 33, chargeB: 100 }
    AttackUnitGameOver { fromPlayer: 1, toPlayer: 2 }
    GameEnd { objective: null, objectiveId: null, toPlayer: 2 }"
  `);
});

test('attempt to attack new units when they are revealed after unfolding', async () => {
  const vecA = vec(1, 1);
  const vecB = vec(3, 3);
  const vecC = vec(1, 3);
  const map = initialMap.copy({
    buildings: initialMap.buildings.set(vecB, House.create(1)),
    units: initialMap.units
      .set(vecA, HeavyArtillery.create(2).setFuel(0))
      .set(vecC, Sniper.create(2))
      .set(vecB, Pioneer.create(1)),
  });

  const [, , gameState] = executeGameAction(
    map,
    map.createVisionObject(player1),
    new Map(),
    EndTurnAction(),
    AIRegistry,
  );

  expect(snapshotGameState(gameState)).toMatchInlineSnapshot(`
    "Unfold (1,3)
    AttackUnit (1,1 → 3,3) { hasCounterAttack: false, playerA: 2, playerB: 1, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: null, chargeA: 33, chargeB: 100 }
    AttackUnitGameOver { fromPlayer: 1, toPlayer: 2 }
    GameEnd { objective: null, objectiveId: null, toPlayer: 2 }"
  `);
});

test('A unit with `stay` behavior will never move or fold', () => {
  const from = vec(2, 1);
  const to = vec(3, 3);
  const map = initialMap.copy({
    config: initialMap.config.copy({ fog: false }),
    units: initialMap.units
      .set(from, Sniper.create(2, { behavior: AIBehavior.Stay }))
      .set(to, Pioneer.create(1)),
  });

  const [, , gameState] = executeGameAction(
    map,
    map.createVisionObject(player1),
    new Map(),
    EndTurnAction(),
    AIRegistry,
  );

  expect(snapshotGameState(gameState)).toMatchInlineSnapshot(
    `
    "Unfold (2,1)
    EndTurn { current: { funds: 1000, player: 2 }, next: { funds: 0, player: 1 }, round: 2, rotatePlayers: null, supply: null, miss: null }"
  `,
  );

  const currentMap = gameState?.at(-1)?.[1];
  if (!currentMap) {
    throw new Error(`Expected 'currentMap' not to be 'null'.`);
  }
  const [, , secondGameState] = executeGameAction(
    currentMap,
    currentMap.createVisionObject(player1),
    new Map(),
    EndTurnAction(),
    AIRegistry,
  );

  expect(snapshotGameState(secondGameState)).toMatchInlineSnapshot(`
    "AttackUnit (2,1 → 3,3) { hasCounterAttack: false, playerA: 2, playerB: 1, unitA: DryUnit { health: 100, ammo: [ [ 1, 6 ] ] }, unitB: null, chargeA: 33, chargeB: 100 }
    AttackUnitGameOver { fromPlayer: 1, toPlayer: 2 }
    GameEnd { objective: null, objectiveId: null, toPlayer: 2 }"
  `);

  const thirdMap = initialMap.copy({
    config: initialMap.config.copy({ fog: false }),
    units: initialMap.units.set(
      from,
      Sniper.create(2, { behavior: AIBehavior.Stay }).unfold(),
    ),
  });

  const [, , thirdGameState] = executeGameAction(
    thirdMap,
    thirdMap.createVisionObject(player1),
    new Map(),
    EndTurnAction(),
    AIRegistry,
  );

  expect(snapshotGameState(thirdGameState)).toMatchInlineSnapshot(
    `"EndTurn { current: { funds: 1000, player: 2 }, next: { funds: 0, player: 1 }, round: 2, rotatePlayers: null, supply: null, miss: null }"`,
  );
});

test('A unit with `stay` behavior will never move, but it might attack, build or ', () => {
  const vecA = vec(1, 1);
  const vecB = vec(2, 3);
  const vecC = vec(3, 3);
  const vecD = vec(1, 3);
  const vecE = vec(3, 1);
  const map = initialMap.copy({
    buildings: initialMap.buildings.set(vecD, House.create(1)),
    config: initialMap.config.copy({ fog: false }),
    units: initialMap.units
      .set(vecA, SmallTank.create(2, { behavior: AIBehavior.Stay }))
      .set(vecB, SmallTank.create(2, { behavior: AIBehavior.Stay }))
      .set(vecC, Infantry.create(1))
      .set(vecD, Pioneer.create(2, { behavior: AIBehavior.Stay }))
      .set(vecE, Pioneer.create(2, { behavior: AIBehavior.Stay })),
  });

  const [, , gameState] = executeGameAction(
    map,
    map.createVisionObject(player1),
    new Map(),
    EndTurnAction(),
    AIRegistry,
  );

  if (!gameState) {
    throw new Error(`Expected 'gameState' not to be 'null'.`);
  }

  // The AI might build different buildings, so we just check the action types here.
  expect(gameState.at(2)![0].type).toBe('CreateBuilding');
  expect(gameState.at(3)![0].type).toBe('EndTurn');

  expect(snapshotGameState(gameState.slice(0, 2))).toMatchInlineSnapshot(
    `
    "AttackUnit (2,3 → 3,3) { hasCounterAttack: true, playerA: 2, playerB: 1, unitA: DryUnit { health: 95, ammo: [ [ 1, 6 ] ] }, unitB: DryUnit { health: 50 }, chargeA: 51, chargeB: 100 }
    Capture (1,3)"
  `,
  );
});

test('A unit with `adaptive` behavior will change to `attack` behavior after engaging in an attack', () => {
  const vecA = vec(1, 1);
  const vecB = vec(2, 3);
  const vecC = vec(3, 3);
  const map = initialMap.copy({
    config: initialMap.config.copy({ fog: false }),
    units: initialMap.units
      .set(vecA, SmallTank.create(2, { behavior: AIBehavior.Stay }))
      .set(vecB, SmallTank.create(2, { behavior: AIBehavior.Adaptive }))
      .set(vecC, Infantry.create(1)),
  });

  const [, , gameState] = executeGameAction(
    map,
    map.createVisionObject(player1),
    new Map(),
    EndTurnAction(),
    AIRegistry,
  );

  expect(snapshotGameState(gameState)).toMatchInlineSnapshot(`
    "AttackUnit (2,3 → 3,3) { hasCounterAttack: true, playerA: 2, playerB: 1, unitA: DryUnit { health: 95, ammo: [ [ 1, 6 ] ] }, unitB: DryUnit { health: 50 }, chargeA: 51, chargeB: 100 }
    EndTurn { current: { funds: 1000, player: 2 }, next: { funds: 0, player: 1 }, round: 2, rotatePlayers: null, supply: null, miss: null }"
  `);

  const currentMap = gameState?.at(-1)?.[1];
  expect(map.units.get(vecB)?.matchesBehavior(AIBehavior.Adaptive)).toBe(true);
  expect(currentMap?.units.get(vecB)?.matchesBehavior(AIBehavior.Attack)).toBe(
    true,
  );
});

test('AI behavior from buildings carries over in a round-robin fashion', () => {
  const vecA = vec(1, 1);
  const vecB = vec(1, 3);
  const vecC = vec(3, 3);
  const map = initialMap.copy({
    buildings: initialMap.buildings
      .set(
        vecA,
        Factory.create(2, {
          behaviors: new Set([AIBehavior.Stay, AIBehavior.Passive]),
        }),
      )
      .set(
        vecB,
        Barracks.create(2, {
          behaviors: new Set([AIBehavior.Defense]),
        }),
      ),
    config: initialMap.config.copy({
      blocklistedBuildings: new Set([RepairShop.id]),
      fog: false,
    }),
    units: initialMap.units.set(vecC, SmallTank.create(1)),
  });

  const [, , gameState] = executeGameAction(
    map,
    map.createVisionObject(player1),
    new Map(),
    EndTurnAction(),
    AIRegistry,
  );

  expect(snapshotGameState(gameState)).toMatchInlineSnapshot(`
    "CreateUnit (1,3 → 2,3) { unit: Pioneer { id: 1, health: 100, player: 2, fuel: 40, moved: true, name: 'Sam', completed: true, behavior: 1 }, free: false, skipBehaviorRotation: false }
    CreateUnit (1,1 → 2,1) { unit: Heavy Artillery { id: 12, health: 100, player: 2, fuel: 15, ammo: [ [ 1, 4 ] ], moved: true, name: 'Joey', completed: true, behavior: 2 }, free: false, skipBehaviorRotation: false }
    EndTurn { current: { funds: 250, player: 2 }, next: { funds: 0, player: 1 }, round: 2, rotatePlayers: null, supply: null, miss: null }"
  `);

  const [, , secondGameState] = executeGameAction(
    gameState!.at(-1)![1],
    map.createVisionObject(player1),
    new Map(),
    EndTurnAction(),
    AIRegistry,
  );

  expect(snapshotGameState(secondGameState)).toMatchInlineSnapshot(`
    "AttackUnit (2,1 → 3,3) { hasCounterAttack: false, playerA: 2, playerB: 1, unitA: DryUnit { health: 100, ammo: [ [ 1, 3 ] ] }, unitB: DryUnit { health: 15, ammo: [ [ 1, 7 ] ] }, chargeA: 105, chargeB: 318 }
    Move (2,3 → 3,1) { fuel: 37, completed: null, path: [2,2 → 3,2 → 3,1] }
    CreateBuilding (3,1) { building: House { id: 2, health: 100, player: 2, completed: true } }
    CreateUnit (1,3 → 2,3) { unit: Pioneer { id: 1, health: 100, player: 2, fuel: 40, moved: true, name: 'Sam', completed: true, behavior: 1 }, free: false, skipBehaviorRotation: false }
    EndTurn { current: { funds: 50, player: 2 }, next: { funds: 0, player: 1 }, round: 3, rotatePlayers: null, supply: null, miss: null }"
  `);
});

test('AI behavior will not use `Stay` on units that do not have an attack', () => {
  const vecA = vec(1, 1);
  const vecC = vec(3, 3);
  const map = initialMap.copy({
    buildings: initialMap.buildings.set(
      vecA,
      Barracks.create(2, {
        behaviors: new Set([AIBehavior.Stay, AIBehavior.Adaptive]),
      }),
    ),
    config: initialMap.config.copy({ fog: false }),
    map: initialMap.map.map(() => 1),
    units: initialMap.units.set(vecC, SmallTank.create(1)),
  });

  const [, , gameState] = executeGameAction(
    map,
    map.createVisionObject(player1),
    new Map(),
    EndTurnAction(),
    AIRegistry,
  );

  expect(snapshotGameState(gameState)).toMatchInlineSnapshot(`
    "CreateUnit (1,1 → 2,1) { unit: Rocket Launcher { id: 3, health: 100, player: 2, fuel: 40, ammo: [ [ 1, 4 ] ], moved: true, name: 'Davide', completed: true, behavior: 2 }, free: false, skipBehaviorRotation: false }
    EndTurn { current: { funds: 725, player: 2 }, next: { funds: 0, player: 1 }, round: 2, rotatePlayers: null, supply: null, miss: null }"
  `);

  expect(gameState!.at(-1)![1].buildings.get(vecA)?.getFirstAIBehavior()).toBe(
    AIBehavior.Adaptive,
  );

  const player2 = map.getPlayer(2);
  const currentMap = map.copy({
    teams: updatePlayer(
      map.teams,
      player2.setFunds(Pioneer.getCostFor(player2)),
    ),
  });

  const [, , secondGameState] = executeGameAction(
    currentMap,
    currentMap.createVisionObject(player1),
    new Map(),
    EndTurnAction(),
    AIRegistry,
  );

  expect(snapshotGameState(secondGameState)).toMatchInlineSnapshot(`
    "CreateUnit (1,1 → 2,1) { unit: Pioneer { id: 1, health: 100, player: 2, fuel: 40, moved: true, name: 'Sam', completed: true }, free: false, skipBehaviorRotation: true }
    EndTurn { current: { funds: 0, player: 2 }, next: { funds: 0, player: 1 }, round: 2, rotatePlayers: null, supply: null, miss: null }"
  `);

  expect(
    secondGameState!.at(-1)![1].buildings.get(vecA)?.getFirstAIBehavior(),
  ).toBe(AIBehavior.Stay);
});

test('AI will not attempt to create a unit it cannot deploy', () => {
  const vecA = vec(1, 1);
  const vecB = vec(1, 2);
  const vecC = vec(3, 3);
  const map = initialMap.copy({
    buildings: initialMap.buildings.set(vecA, Factory.create(2)),
    config: initialMap.config.copy({ fog: false }),
    units: initialMap.units.set(vecC, SmallTank.create(1)),
  });

  const newTiles = [...map.map];
  newTiles[map.getTileIndex(vecB)] = RailTrack.id;
  const [, , gameState] = executeGameAction(
    map.copy({
      map: newTiles,
    }),
    map.createVisionObject(player1),
    new Map(),
    EndTurnAction(),
    AIRegistry,
  );

  expect(snapshotGameState(gameState)).toMatchInlineSnapshot(`
    "CreateUnit (1,1 → 1,2) { unit: Mammoth { id: 34, health: 100, player: 2, fuel: 30, ammo: [ [ 1, 6 ] ], moved: true, name: 'Shamus', completed: true }, free: false, skipBehaviorRotation: false }
    EndTurn { current: { funds: 100, player: 2 }, next: { funds: 0, player: 1 }, round: 2, rotatePlayers: null, supply: null, miss: null }"
  `);

  const [, , secondGameState] = executeGameAction(
    map,
    map.createVisionObject(player1),
    new Map(),
    EndTurnAction(),
    AIRegistry,
  );

  // The AI tries to build the strongest unit (likely 'Mammoth') which requires rails, but there are none.
  // This test ensures that the AI still actually creates a unit.
  expect(snapshotGameState(secondGameState)).toMatchInlineSnapshot(`
    "CreateUnit (1,1 → 2,1) { unit: Heavy Artillery { id: 12, health: 100, player: 2, fuel: 15, ammo: [ [ 1, 4 ] ], moved: true, name: 'Joey', completed: true }, free: false, skipBehaviorRotation: false }
    EndTurn { current: { funds: 350, player: 2 }, next: { funds: 0, player: 1 }, round: 2, rotatePlayers: null, supply: null, miss: null }"
  `);
});

test('AI will not attack if the damage is too low', () => {
  const vecA = vec(1, 2);
  const vecB = vec(3, 3);
  const map = initialMap.copy({
    config: initialMap.config.copy({ fog: false }),
    units: initialMap.units
      .set(vecA, Infantry.create(2))
      .set(vecB, HeavyTank.create(1)),
  });

  const [, , gameStateA] = executeGameAction(
    map,
    map.createVisionObject(player1),
    new Map(),
    EndTurnAction(),
    AIRegistry,
  );

  expect(snapshotGameState(gameStateA)).toMatchInlineSnapshot(`
    "Move (1,2 → 3,2) { fuel: 48, completed: null, path: [2,2 → 3,2] }
    EndTurn { current: { funds: 1000, player: 2 }, next: { funds: 0, player: 1 }, round: 2, rotatePlayers: null, supply: null, miss: null }"
  `);

  const [, , gameStateB] = executeGameAction(
    map.copy({
      units: map.units.set(vecB, SmallTank.create(1).setHealth(1)),
    }),
    map.createVisionObject(player1),
    new Map(),
    EndTurnAction(),
    AIRegistry,
  );

  expect(snapshotGameState(gameStateB)).toMatchInlineSnapshot(`
    "Move (1,2 → 2,3) { fuel: 48, completed: null, path: [1,3 → 2,3] }
    AttackUnit (2,3 → 3,3) { hasCounterAttack: false, playerA: 2, playerB: 1, unitA: DryUnit { health: 100 }, unitB: null, chargeA: 1, chargeB: 3 }
    AttackUnitGameOver { fromPlayer: 1, toPlayer: 2 }
    GameEnd { objective: null, objectiveId: null, toPlayer: 2 }"
  `);
});

test('AI will prefer to rescue over capture', () => {
  const vecA = vec(1, 2);
  const vecB = vec(3, 3);
  const vecC = vec(1, 1);
  const vecD = vec(2, 3);
  const map = initialMap.copy({
    buildings: initialMap.buildings.set(vecC, HQ.create(1)),
    config: initialMap.config.copy({ fog: false }),
    units: initialMap.units
      .set(vecA, Saboteur.create(2))
      .set(vecB, HeavyTank.create(0))
      .set(vecD, SmallTank.create(1)),
  });

  const [, , gameStateA] = executeGameAction(
    map,
    map.createVisionObject(player1),
    new Map(),
    EndTurnAction(),
    AIRegistry,
  );

  expect(snapshotGameState(gameStateA)).toMatchInlineSnapshot(`
    "Move (1,2 → 3,2) { fuel: 38, completed: null, path: [2,2 → 3,2] }
    Rescue (3,2 → 3,3) { player: 2, name: null }
    EndTurn { current: { funds: 1000, player: 2 }, next: { funds: 0, player: 1 }, round: 2, rotatePlayers: null, supply: null, miss: null }"
  `);

  const lastMapA = gameStateA!.at(-1)![1];
  const [, , gameStateB] = executeGameAction(
    lastMapA,
    map.createVisionObject(player1),
    new Map(),
    EndTurnAction(),
    AIRegistry,
  );

  expect(snapshotGameState(gameStateB)).toMatchInlineSnapshot(`
    "Rescue (3,2 → 3,3) { player: 2, name: -18 }
    AttackUnit (3,3 → 2,3) { hasCounterAttack: true, playerA: 2, playerB: 1, unitA: DryUnit { health: 95, ammo: [ [ 1, 9 ] ] }, unitB: DryUnit { health: 20, ammo: [ [ 1, 6 ] ] }, chargeA: 129, chargeB: 300 }
    EndTurn { current: { funds: 1000, player: 2 }, next: { funds: 0, player: 1 }, round: 3, rotatePlayers: null, supply: null, miss: null }"
  `);
});

test('AI is able to sabotage other units', () => {
  const vecA = vec(1, 2);
  const vecB = vec(3, 3);
  const vecC = vec(2, 3);
  const map = initialMap.copy({
    config: initialMap.config.copy({ fog: false }),
    units: initialMap.units
      .set(vecA, Saboteur.create(2))
      .set(vecB, SuperTank.create(1))
      .set(vecC, Infantry.create(1)),
  });

  const [, , gameStateA] = executeGameAction(
    map,
    map.createVisionObject(player1),
    new Map(),
    EndTurnAction(),
    AIRegistry,
  );

  expect(snapshotGameState(gameStateA)).toMatchInlineSnapshot(`
    "Move (1,2 → 3,2) { fuel: 38, completed: null, path: [2,2 → 3,2] }
    Sabotage (3,2 → 3,3)
    EndTurn { current: { funds: 1000, player: 2 }, next: { funds: 0, player: 1 }, round: 2, rotatePlayers: null, supply: null, miss: null }"
  `);
});

test('AI will prefer attacks over sabotage against weaker units', () => {
  const vecA = vec(1, 2);
  const vecB = vec(3, 3);
  const vecC = vec(2, 3);
  const map = initialMap.copy({
    config: initialMap.config.copy({ fog: false }),
    units: initialMap.units
      .set(vecA, Saboteur.create(2))
      .set(vecB, Infantry.create(1))
      .set(vecC, Infantry.create(1)),
  });

  const [, , gameStateA] = executeGameAction(
    map,
    map.createVisionObject(player1),
    new Map(),
    EndTurnAction(),
    AIRegistry,
  );

  expect(snapshotGameState(gameStateA)).toMatchInlineSnapshot(`
    "Move (1,2 → 3,2) { fuel: 38, completed: null, path: [2,2 → 3,2] }
    AttackUnit (3,2 → 3,3) { hasCounterAttack: true, playerA: 2, playerB: 1, unitA: DryUnit { health: 76 }, unitB: DryUnit { health: 55 }, chargeA: 107, chargeB: 90 }
    EndTurn { current: { funds: 1000, player: 2 }, next: { funds: 0, player: 1 }, round: 2, rotatePlayers: null, supply: null, miss: null }"
  `);
});

test('AI does not crash when moving away from a unit which it can no longer see after the move', () => {
  const vecA = vec(2, 2);
  const vecB = vec(3, 2);
  const map = initialMap.copy({
    map: [1, 1, 1, 1, 1, Forest.id, 1, 1, 1],
    units: initialMap.units
      .set(vecA, XFighter.create(2))
      .set(vecB, Jetpack.create(1)),
  });

  const [, , gameStateA] = executeGameAction(
    map,
    map.createVisionObject(player1),
    new Map(),
    EndTurnAction(),
    AIRegistry,
  );

  expect(snapshotGameState(gameStateA)).toMatchInlineSnapshot(`
    "Move (2,2 → 2,3) { fuel: 38, completed: null, path: [2,3] }
    EndTurn { current: { funds: 1000, player: 2 }, next: { funds: 0, player: 1 }, round: 2, rotatePlayers: null, supply: null, miss: null }"
  `);
});

test('AI keeps attacking even if one unit gets blocked', async () => {
  const vecA = vec(1, 1);
  const vecB = vec(2, 2);
  const vecC = vec(3, 1);
  const vecD = vec(1, 3);
  const vecE = vec(3, 3);
  const vecF = vec(5, 5);
  const vecG = vec(2, 4);
  const vecH = vec(4, 1);
  const tileMap = Array(5 * 5).fill(Forest.id);
  tileMap[3] = Plain.id;
  const map = withModifiers(
    initialMap.copy({
      buildings: initialMap.buildings.set(vecG, Barracks.create(2)),
      map: tileMap,
      size: new SizeVector(5, 5),
      units: initialMap.units
        .set(vecA, Humvee.create(2))
        .set(vecB, Infantry.create(1))
        .set(vecC, Infantry.create(1))
        .set(vecD, Infantry.create(1))
        .set(vecE, Infantry.create(1))
        .set(vecF, Artillery.create(2).setHealth(1).unfold())
        .set(vecH, Infantry.create(1))
        .set(vecG, Pioneer.create(2).setFuel(0)),
    }),
  );

  const [, , gameStateA] = executeGameAction(
    map,
    map.createVisionObject(player1),
    new Map(),
    EndTurnAction(),
    AIRegistry,
  );

  expect(snapshotGameState(gameStateA)).toMatchInlineSnapshot(`
    "Move (1,1 → 2,1) { fuel: 48, completed: true, path: [2,1] }
    CreateUnit (2,4 → 2,3) { unit: Flamethrower { id: 15, health: 100, player: 2, fuel: 30, ammo: [ [ 1, 4 ] ], moved: true, name: 'Yuki', completed: true }, free: false, skipBehaviorRotation: false }
    AttackUnit (5,5 → 3,3) { hasCounterAttack: false, playerA: 2, playerB: 1, unitA: DryUnit { health: 1, ammo: [ [ 1, 6 ] ] }, unitB: DryUnit { health: 71 }, chargeA: 19, chargeB: 57 }
    EndTurn { current: { funds: 600, player: 2 }, next: { funds: 0, player: 1 }, round: 2, rotatePlayers: null, supply: null, miss: null }"
  `);
});

test('AI does not keep building naval units if the opponent does not have any naval units', async () => {
  const teams = updatePlayers(
    initialMap.teams,
    initialMap.getPlayers().map((player) => player.setFunds(800)),
  );

  const vecA = vec(1, 1);
  const vecB = vec(2, 2);
  const vecC = vec(3, 1);
  const vecD = vec(1, 2);
  const vecE = vec(3, 3);
  const seaTileMap = Array(5 * 5).fill(Sea.id);
  seaTileMap[0] = [Sea.id, ShipyardConstructionSite.id];
  const tileMap = [...seaTileMap];
  tileMap[2] = Plain.id;
  tileMap[3] = Plain.id;

  const mapWithOpponentShips = withModifiers(
    initialMap.copy({
      buildings: initialMap.buildings.set(vecA, Shipyard.create(2)),
      config: initialMap.config.copy({ fog: false }),
      map: seaTileMap,
      size: new SizeVector(5, 5),
      teams,
      units: initialMap.units
        .set(vecD, Battleship.create(1))
        .set(vecB, Battleship.create(1)),
    }),
  );

  const mapWithoutOpponentShips = withModifiers(
    initialMap.copy({
      buildings: initialMap.buildings
        .set(vecA, Shipyard.create(2))
        .set(vecC, Factory.create(2)),
      config: initialMap.config.copy({ fog: false }),
      map: tileMap,
      size: new SizeVector(5, 5),
      teams,
      units: initialMap.units.set(vecD, Infantry.create(1)),
    }),
  );

  const mapWithAIShips = withModifiers(
    mapWithoutOpponentShips.copy({
      units: mapWithOpponentShips.units.set(vecE, Corvette.create(2)),
    }),
  );

  const mapWithShips = withModifiers(
    mapWithOpponentShips.copy({
      units: mapWithOpponentShips.units.set(vecE, Corvette.create(2)),
    }),
  );

  const [, , gameStateA] = executeGameAction(
    mapWithOpponentShips,
    mapWithOpponentShips.createVisionObject(player1),
    new Map(),
    EndTurnAction(),
    AIRegistry,
  );

  expect(snapshotGameState(gameStateA)).toMatchInlineSnapshot(`
    "CreateUnit (1,1 → 2,1) { unit: Frigate { id: 29, health: 100, player: 2, fuel: 60, ammo: [ [ 1, 8 ] ], moved: true, name: 'Thomas', completed: true }, free: false, skipBehaviorRotation: false }
    EndTurn { current: { funds: 400, player: 2 }, next: { funds: 800, player: 1 }, round: 2, rotatePlayers: null, supply: null, miss: null }"
  `);

  const [, , gameStateB] = executeGameAction(
    mapWithoutOpponentShips,
    mapWithoutOpponentShips.createVisionObject(player1),
    new Map(),
    EndTurnAction(),
    AIRegistry,
  );

  expect(snapshotGameState(gameStateB)).toMatchInlineSnapshot(`
    "CreateUnit (3,1 → 3,1) { unit: Heavy Artillery { id: 12, health: 100, player: 2, fuel: 15, ammo: [ [ 1, 4 ] ], moved: true, name: 'Joey', completed: true }, free: false, skipBehaviorRotation: false }
    EndTurn { current: { funds: 150, player: 2 }, next: { funds: 800, player: 1 }, round: 2, rotatePlayers: null, supply: null, miss: null }"
  `);

  const [, , gameStateC] = executeGameAction(
    mapWithAIShips,
    mapWithAIShips.createVisionObject(player1),
    new Map(),
    EndTurnAction(),
    AIRegistry,
  );

  expect(snapshotGameState(gameStateC)).toMatchInlineSnapshot(`
    "Move (3,3 → 1,3) { fuel: 27, completed: null, path: [2,3 → 1,3] }
    AttackUnit (1,3 → 1,2) { hasCounterAttack: false, playerA: 2, playerB: 1, unitA: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, unitB: DryUnit { health: 67, ammo: [ [ 1, 4 ] ] }, chargeA: 108, chargeB: 330 }
    CreateUnit (3,1 → 3,1) { unit: Heavy Artillery { id: 12, health: 100, player: 2, fuel: 15, ammo: [ [ 1, 4 ] ], moved: true, name: 'Joey', completed: true }, free: false, skipBehaviorRotation: false }
    EndTurn { current: { funds: 150, player: 2 }, next: { funds: 800, player: 1 }, round: 2, rotatePlayers: null, supply: null, miss: null }"
  `);

  const [, , gameStateD] = executeGameAction(
    mapWithShips,
    mapWithShips.createVisionObject(player1),
    new Map(),
    EndTurnAction(),
    AIRegistry,
  );

  expect(snapshotGameState(gameStateD)).toMatchInlineSnapshot(`
    "Move (3,3 → 1,3) { fuel: 27, completed: null, path: [2,3 → 1,3] }
    AttackUnit (1,3 → 1,2) { hasCounterAttack: false, playerA: 2, playerB: 1, unitA: DryUnit { health: 100, ammo: [ [ 1, 4 ] ] }, unitB: DryUnit { health: 67, ammo: [ [ 1, 4 ] ] }, chargeA: 108, chargeB: 330 }
    CreateUnit (1,1 → 2,1) { unit: Frigate { id: 29, health: 100, player: 2, fuel: 60, ammo: [ [ 1, 8 ] ], moved: true, name: 'Thomas', completed: true }, free: false, skipBehaviorRotation: false }
    EndTurn { current: { funds: 400, player: 2 }, next: { funds: 800, player: 1 }, round: 2, rotatePlayers: null, supply: null, miss: null }"
  `);
});

test('AI will prefer funds generating buildings over factories if it has no income', () => {
  const vecA = vec(1, 2);
  const vecB = vec(2, 2);
  const map = initialMap.copy({
    map: [1, Airfield.id, ConstructionSite.id, 1, 1, 1, 1, 1, 1],
    teams: updatePlayers(
      initialMap.teams,
      initialMap
        .getPlayers()
        .map((player) => player.setFunds(Airbase.configuration.cost)),
    ),
    units: initialMap.units
      .set(vecA, Pioneer.create(2))
      .set(vecB, Flamethrower.create(2)),
  });

  const [, , gameStateA] = executeGameAction(
    map,
    map.createVisionObject(player1),
    new Map(),
    EndTurnAction(),
    AIRegistry,
  );

  expect(snapshotGameState(gameStateA)).toMatchInlineSnapshot(`
    "Move (1,2 → 3,1) { fuel: 37, completed: null, path: [2,2 → 3,2 → 3,1] }
    CreateBuilding (3,1) { building: House { id: 2, health: 100, player: 2, completed: true } }
    CompleteUnit (2,2)
    EndTurn { current: { funds: 100, player: 2 }, next: { funds: 200, player: 1 }, round: 2, rotatePlayers: null, supply: null, miss: null }"
  `);
});

test('AI will create factories if it has no income and cannot build funds generating buildings', () => {
  const vecA = vec(1, 2);
  const vecB = vec(3, 3);
  const blocklistedBuildings = new Set(
    filterBuildings(({ configuration }) => configuration.funds > 0).map(
      ({ id }) => id,
    ),
  );
  const unitBuildings = new Set(
    filterBuildings((building) => building.canBuildUnits()).map(({ id }) => id),
  );

  const map = initialMap.copy({
    config: initialMap.config.copy({
      blocklistedBuildings,
    }),
    map: [1, 1, ConstructionSite.id, 1, 1, 1, 1, 1, 1],
    teams: updatePlayers(
      initialMap.teams,
      initialMap.getPlayers().map((player) => player.setFunds(10_000)),
    ),
    units: initialMap.units.set(vecA, Pioneer.create(2)),
  });

  const [, , gameStateA] = executeGameAction(
    map,
    map.createVisionObject(player1),
    new Map(),
    EndTurnAction(),
    AIRegistry,
  );

  const actionResponseA = gameStateA!.at(1)![0];
  expect(actionResponseA.type).toBe('CreateBuilding');
  expect(
    actionResponseA.type === 'CreateBuilding' &&
      unitBuildings.has(actionResponseA.building.id),
  ).toBe(true);

  expect(
    snapshotGameState([gameStateA![0], ...gameStateA!.slice(2, -1)]),
  ).toMatchInlineSnapshot(
    `"Move (1,2 → 3,1) { fuel: 37, completed: null, path: [2,2 → 3,2 → 3,1] }"`,
  );

  const [, , gameStateB] = executeGameAction(
    map.copy({
      units: map.units.set(vecB, Flamethrower.create(2)),
    }),
    map.createVisionObject(player1),
    new Map(),
    EndTurnAction(),
    AIRegistry,
  );

  const actionResponseB = gameStateB!.at(1)![0];
  expect(actionResponseB.type).toBe('CreateBuilding');
  expect(
    actionResponseB.type === 'CreateBuilding' &&
      unitBuildings.has(actionResponseB.building.id),
  ).toBe(true);

  expect(
    snapshotGameState([gameStateA![0], ...gameStateA!.slice(2, -1)]),
  ).toMatchInlineSnapshot(
    `"Move (1,2 → 3,1) { fuel: 37, completed: null, path: [2,2 → 3,2 → 3,1] }"`,
  );
});

test('AI will move onto escort vectors even if it is a long-range unit', () => {
  const initialMap = withModifiers(
    MapData.createMap({
      map: [
        6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 1, 6, 6, 6,
        6,
      ],
      size: {
        height: 5,
        width: 5,
      },
      teams: [
        { id: 1, name: '', players: [{ funds: 0, id: 1, userId: '1' }] },
        { id: 2, name: '', players: [{ funds: 0, id: 2, name: 'Bot' }] },
      ],
    }),
  );

  const map = initialMap.copy({
    config: initialMap.config.copy({
      objectives: ImmutableMap([
        [0, { hidden: false, type: Criteria.Default }],
        [
          1,
          {
            hidden: false,
            label: new Set([2]),
            optional: false,
            players: [2],
            reward: null,
            type: Criteria.EscortLabel,
            vectors: new Set([vec(5, 4)]),
          },
        ],
      ]),
    }),
    units: initialMap.units
      .set(vec(5, 1), XFighter.create(2, { label: 2 }))
      .set(vec(1, 5), Pioneer.create(1)),
  });

  const [, , gameStateA] = executeGameAction(
    map,
    map.createVisionObject(player1),
    new Map(),
    EndTurnAction(),
    AIRegistry,
  );

  expect(snapshotGameState(gameStateA)).toMatchInlineSnapshot(`
    "Move (5,1 → 5,4) { fuel: 36, completed: null, path: [5,2 → 5,3 → 5,4] }
    GameEnd { objective: { hidden: false, label: [ 2 ], optional: false, players: [ 2 ], reward: null, type: 4, vectors: [ '5,4' ] }, objectiveId: 1, toPlayer: 2 }"
  `);
});

test('AI will prioritize units with labels associated with win conditions', () => {
  const initialMap = withModifiers(
    MapData.createMap({
      map: [
        6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 1, 6, 6, 6,
        6,
      ],
      size: {
        height: 5,
        width: 5,
      },
      teams: [
        { id: 1, name: '', players: [{ funds: 0, id: 1, userId: '1' }] },
        { id: 2, name: '', players: [{ funds: 0, id: 2, name: 'Bot' }] },
      ],
    }),
  );

  const map = initialMap.copy({
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
            reward: null,
            type: Criteria.EscortLabel,
            vectors: new Set([vec(1, 1)]),
          },
        ],
      ]),
    }),
    units: initialMap.units
      .set(vec(1, 1), FighterJet.create(2))
      .set(vec(3, 3), FighterJet.create(1, { label: 2 }).setHealth(1))
      .set(vec(5, 5), TransportHelicopter.create(1, { label: 1 })),
  });

  const [, , gameStateA] = executeGameAction(
    map,
    map.createVisionObject(player1),
    new Map(),
    EndTurnAction(),
    AIRegistry,
  );

  expect(snapshotGameState(gameStateA)).toMatchInlineSnapshot(`
    "Move (1,1 → 5,4) { fuel: 42, completed: null, path: [1,2 → 1,3 → 1,4 → 2,4 → 3,4 → 4,4 → 5,4] }
    AttackUnit (5,4 → 5,5) { hasCounterAttack: false, playerA: 2, playerB: 1, unitA: DryUnit { health: 100, ammo: [ [ 1, 7 ] ] }, unitB: null, chargeA: 66, chargeB: 200 }
    GameEnd { objective: { hidden: false, label: [ 1 ], optional: false, players: [ 1 ], reward: null, type: 4, vectors: [ '1,1' ] }, objectiveId: 1, toPlayer: 2 }"
  `);
});
