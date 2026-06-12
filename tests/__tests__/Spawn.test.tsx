import { EndTurnAction } from '@deities/apollo/action-mutators/ActionMutators.tsx';
import { executeEffect } from '@deities/apollo/Action.tsx';
import { SpawnActionResponse } from '@deities/apollo/ActionResponse.tsx';
import applyActionResponse from '@deities/apollo/actions/applyActionResponse.tsx';
import encodeGameActionResponse from '@deities/apollo/actions/encodeGameActionResponse.tsx';
import { Effect, Effects } from '@deities/apollo/Effects.tsx';
import computeVisibleActions from '@deities/apollo/lib/computeVisibleActions.tsx';
import updateVisibleEntities from '@deities/apollo/lib/updateVisibleEntities.tsx';
import { GameState } from '@deities/apollo/Types.tsx';
import { Barracks, House } from '@deities/athena/info/Building.tsx';
import {
  Bomber,
  FighterJet,
  Flamethrower,
  Helicopter,
  Pioneer,
} from '@deities/athena/info/Unit.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import { Bot, HumanPlayer, PlayerID } from '@deities/athena/map/Player.tsx';
import Team from '@deities/athena/map/Team.tsx';
import type Unit from '@deities/athena/map/Unit.tsx';
import vec from '@deities/athena/map/vec.tsx';
import type Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import ImmutableMap from '@nkzw/immutable-map';
import { expect, test } from 'vitest';
import executeGameActions from '../executeGameActions.tsx';
import { printGameState } from '../printGameState.tsx';
import {
  captureGameActionResponse,
  captureGameState,
  getRenderedGameMapState,
} from '../screenshot.tsx';
import snapshotEncodedActionResponse from '../snapshotEncodedActionResponse.tsx';

const map = withModifiers(
  MapData.createMap({
    config: {
      // Restrictions are ignored in Spawn Effects.
      blocklistedUnits: [Bomber.id],
      fog: true,
    },
    map: [1, 1, 3, 1, 3, 1, 1, 1, 3, 1, 1, 3, 1, 1, 1, 3, 1, 3, 1, 1, 2, 2, 2, 1, 1],
    size: { height: 5, width: 5 },
    teams: [
      { id: 1, name: '', players: [{ funds: 500, id: 1, userId: '1' }] },
      { id: 2, name: '', players: [{ funds: 500, id: 2, name: 'AI' }] },
    ],
    units: [[2, 1, { g: 40, h: 100, i: 1, p: 1 }]],
  }),
);
const player1 = HumanPlayer.from(map.getPlayer(1), '1');
const team1 = map.getTeam(player1);
const player3 = new Bot(3, 'Invader', 3, 500, undefined, new Set(), new Set(), 0, null, 0);
const team3 = ImmutableMap<PlayerID, Team>([[3, new Team(3, '', ImmutableMap([[3, player3]]))]]);

const applyVisibleSpawn = (spawnAction: SpawnActionResponse) => {
  const vision = map.createVisionObject(player1);
  const serverMap = applyActionResponse(map, vision, spawnAction);
  const visibleAction = computeVisibleActions(map, vision, [[spawnAction, serverMap]]).at(0)?.[0];
  if (!visibleAction) {
    throw new Error('Expected a visible action.');
  }

  return updateVisibleEntities(
    applyActionResponse(vision.apply(map), vision, visibleAction),
    vision,
    {},
  );
};

test('spawns units and adds new players', async () => {
  const vision = map.createVisionObject(player1);
  const gameStateEntry = executeEffect(map, vision, {
    teams: ImmutableMap([
      [
        1,
        team1.copy({
          players: ImmutableMap([
            [4, new Bot(4, 'Test Player', 1, 500, undefined, new Set(), new Set(), 0, null, 0)],
          ]),
        }),
      ],
      [
        5,
        new Team(
          5,
          '',
          ImmutableMap([
            [5, new Bot(5, 'Test Player', 5, 500, undefined, new Set(), new Set(), 0, null, 0)],
          ]),
        ),
      ],
    ]),
    type: 'SpawnEffect',
    units: ImmutableMap([
      [vec(3, 2), Bomber.create(2)],
      [vec(2, 2), FighterJet.create(1)],
      [vec(5, 4), Helicopter.create(5)],
      [vec(1, 3), Bomber.create(4)],
    ]),
  } as const);
  const gameState: GameState = gameStateEntry ? [gameStateEntry] : [];
  const encodedGameActionResponse = encodeGameActionResponse(
    map,
    map,
    vision,
    gameState,
    null,
    null,
    null,
  );
  const screenshot = await captureGameActionResponse(
    map,
    encodedGameActionResponse,
    player1.userId,
  );

  expect(snapshotEncodedActionResponse(encodedGameActionResponse)).toMatchInlineSnapshot(
    `"Spawn { units: [2,2 → Fighter Jet { id: 18, health: 100, player: 1, fuel: 50, ammo: [ [ 1, 8 ] ], name: 'Titan' }, 1,3 → Bomber { id: 19, health: 100, player: 4, fuel: 40, ammo: [ [ 1, 5 ] ], name: 'Léon' }, 3,2 → Bomber { id: 19, health: 100, player: 2, fuel: 40, ammo: [ [ 1, 5 ] ], name: 'Léon' }], teams: [ { id: 1, name: '', players: [ { activeSkills: [], ai: undefined, charge: 0, funds: 500, id: 4, misses: 0, name: 'Test Player', skills: [], stats: [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ] } ] }, { id: 5, name: '', players: [ { activeSkills: [], ai: undefined, charge: 0, funds: 500, id: 5, misses: 0, name: 'Test Player', skills: [], stats: [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ] } ] } ], buildings: [] }"`,
  );

  printGameState('Last State', screenshot);
  expect(screenshot).toMatchImageSnapshot();

  const actionResponse = gameStateEntry![0];
  const gameActionResponseScreenshot = (
    await captureGameState(
      [[actionResponse, applyActionResponse(map, vision, actionResponse)]],
      player1.userId,
    )
  ).at(-1)?.[2];
  if (!gameActionResponseScreenshot) {
    throw new Error('Could not generate screenshot.');
  }
  printGameState('Client State', gameActionResponseScreenshot);
  expect(gameActionResponseScreenshot).toMatchImageSnapshot();
});

test('clears spawn scroll animations after client processing', async () => {
  const vision = map.createVisionObject(player1);
  const gameStateEntry = executeEffect(map, vision, {
    type: 'SpawnEffect',
    units: ImmutableMap([[vec(2, 2), FighterJet.create(1)]]),
  } as const);
  const encodedGameActionResponse = encodeGameActionResponse(
    map,
    map,
    vision,
    gameStateEntry ? [gameStateEntry] : [],
    null,
    null,
    null,
  );

  await captureGameActionResponse(map, encodedGameActionResponse, player1.userId);

  expect(await getRenderedGameMapState()).toEqual({
    animations: [],
  });
});

test('spawns non-production buildings as neutral without adding new owners', () => {
  const position = vec(3, 3);
  const gameStateEntry = executeEffect(map, map.createVisionObject(player1), {
    buildings: ImmutableMap([[position, House.create(3)]]),
    type: 'SpawnEffect',
    units: ImmutableMap(),
  } as const);

  expect(gameStateEntry).not.toBeNull();
  const actionResponse = gameStateEntry![0];
  const newMap = gameStateEntry![1];
  expect(actionResponse.type).toBe('Spawn');
  expect(actionResponse.type === 'Spawn' && actionResponse.teams).toBeUndefined();
  expect(newMap.buildings.get(position)?.player).toBe(0);
  expect(newMap.maybeGetPlayer(3)).toBeUndefined();
  expect(newMap.active).not.toContain(3);
});

test('spawns production buildings and adds new building owners', () => {
  const position = vec(3, 3);
  const gameStateEntry = executeEffect(map, map.createVisionObject(player1), {
    buildings: ImmutableMap([[position, Barracks.create(3)]]),
    type: 'SpawnEffect',
    units: ImmutableMap(),
  } as const);

  expect(gameStateEntry).not.toBeNull();
  const newMap = gameStateEntry![1];
  expect(newMap.buildings.get(position)?.player).toBe(3);
  expect(newMap.maybeGetPlayer(3)).toBeTruthy();
  expect(newMap.active).toContain(3);
});

test('keeps hidden spawned players active in fog', () => {
  const hiddenPosition = vec(5, 5);
  const vision = map.createVisionObject(player1);
  expect(vision.isVisible(map, hiddenPosition)).toBe(false);

  const spawnAction = {
    teams: team3,
    type: 'Spawn',
    units: ImmutableMap([[hiddenPosition, Pioneer.create(3)]]),
  } as const;
  const serverMap = applyActionResponse(map, vision, spawnAction);
  const visibleAction = computeVisibleActions(map, vision, [[spawnAction, serverMap]]).at(0)?.[0];

  expect(visibleAction?.type).toBe('Spawn');
  expect(visibleAction?.type === 'Spawn' && visibleAction.units.size).toBe(0);

  const clientMap = applyVisibleSpawn(spawnAction);
  expect(clientMap.maybeGetPlayer(3)).toBeTruthy();
  expect(clientMap.units.has(hiddenPosition)).toBe(false);
  expect(clientMap.active).toContain(3);
});

test('keeps spawned buildings visible as neutral in fog while preserving player activity', () => {
  const hiddenPosition = vec(5, 5);
  const vision = map.createVisionObject(player1);
  expect(vision.isVisible(map, hiddenPosition)).toBe(false);

  const clientMap = applyVisibleSpawn({
    buildings: ImmutableMap([[hiddenPosition, Barracks.create(3)]]),
    teams: team3,
    type: 'Spawn',
    units: ImmutableMap<Vector, Unit>(),
  } as const);

  const building = clientMap.buildings.get(hiddenPosition);
  expect(building?.info).toBe(Barracks);
  expect(building?.player).toBe(0);
  expect(clientMap.active).toContain(3);
});

test('neutralizes hidden spawned buildings in visible spawn actions', () => {
  const hiddenPosition = vec(5, 5);
  const visiblePosition = vec(3, 1);
  const vision = map.createVisionObject(player1);
  expect(vision.isVisible(map, hiddenPosition)).toBe(false);
  expect(vision.isVisible(map, visiblePosition)).toBe(true);

  const spawnAction = {
    buildings: ImmutableMap([
      [hiddenPosition, Barracks.create(3)],
      [visiblePosition, Barracks.create(3)],
    ]),
    teams: team3,
    type: 'Spawn',
    units: ImmutableMap<Vector, Unit>(),
  } as const;
  const serverMap = applyActionResponse(map, vision, spawnAction);
  const visibleAction = computeVisibleActions(map, vision, [[spawnAction, serverMap]]).at(0)?.[0];

  expect(visibleAction?.type).toBe('Spawn');
  expect(
    visibleAction?.type === 'Spawn' && visibleAction.buildings?.get(hiddenPosition)?.player,
  ).toBe(0);
  expect(
    visibleAction?.type === 'Spawn' && visibleAction.buildings?.get(visiblePosition)?.player,
  ).toBe(3);
});

test('does not activate hidden players with only non-production spawned buildings', () => {
  const hiddenPosition = vec(5, 5);
  const vision = map.createVisionObject(player1);
  expect(vision.isVisible(map, hiddenPosition)).toBe(false);
  const gameStateEntry = executeEffect(map, vision, {
    buildings: ImmutableMap([[hiddenPosition, House.create(3)]]),
    type: 'SpawnEffect',
    units: ImmutableMap(),
  } as const);

  expect(gameStateEntry).not.toBeNull();
  const actionResponse = gameStateEntry![0];
  expect(actionResponse.type).toBe('Spawn');
  expect(actionResponse.type === 'Spawn' && actionResponse.teams).toBeUndefined();

  const clientMap = applyVisibleSpawn(actionResponse as SpawnActionResponse);

  const building = clientMap.buildings.get(hiddenPosition);
  expect(building?.info).toBe(House);
  expect(building?.player).toBe(0);
  expect(clientMap.maybeGetPlayer(3)).toBeUndefined();
  expect(clientMap.active).not.toContain(3);
});

test('keeps hidden spawned players active when their entities are discovered later', () => {
  const hiddenPosition = vec(5, 5);
  const discoveredPosition = vec(3, 1);
  const vision = map.createVisionObject(player1);
  expect(vision.isVisible(map, hiddenPosition)).toBe(false);
  expect(vision.isVisible(map, discoveredPosition)).toBe(true);

  const clientMap = applyVisibleSpawn({
    teams: team3,
    type: 'Spawn',
    units: ImmutableMap([[hiddenPosition, Pioneer.create(3)]]),
  } as const);
  const discoveredMap = updateVisibleEntities(clientMap, vision, {
    units: ImmutableMap([[discoveredPosition, Pioneer.create(3)]]),
  });

  expect(discoveredMap.units.get(discoveredPosition)?.player).toBe(3);
  expect(discoveredMap.active).toContain(3);
});

test('spawns new units at adjacent fields if necessary', async () => {
  const vecA = vec(1, 1);
  const vecB = vec(3, 3);
  const initialMap = map.copy({
    units: map.units.set(vecA, Pioneer.create(1)).set(vecB, Pioneer.create(1)),
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
              units: ImmutableMap([[vecB, Flamethrower.create(0)]]),
            },
          ],
          occurrence: 'once',
        },
      ]),
    ],
  ]);

  const [, gameActionResponse] = await executeGameActions(initialMap, [EndTurnAction()], effects);

  expect(snapshotEncodedActionResponse(gameActionResponse)).toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      Spawn { units: [3,2 → Flamethrower { id: 15, health: 100, player: 0, fuel: 30, ammo: [ [ 1, 4 ] ], name: 'Zephyr' }], teams: null, buildings: [] }
      EndTurn { current: { funds: 500, player: 2 }, next: { funds: 500, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }"
    `);
});

test('drops a spawn if no adjacent field is available', async () => {
  const vecA = vec(1, 1);
  const vecB = vec(2, 2);
  const initialMap = map.copy({
    units: ImmutableMap(vecB.expand().map((vector) => [vector, Pioneer.create(1)])).set(
      vecA,
      Pioneer.create(2),
    ),
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
              units: ImmutableMap([[vecB, Flamethrower.create(0)]]),
            },
          ],
          occurrence: 'once',
        },
      ]),
    ],
  ]);

  const [, gameActionResponse] = await executeGameActions(initialMap, [EndTurnAction()], effects);

  expect(snapshotEncodedActionResponse(gameActionResponse)).toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      CompleteUnit (1,1)
      EndTurn { current: { funds: 500, player: 2 }, next: { funds: 500, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }"
    `);
});

test('stops capturing if there is nothing to capture on that field', async () => {
  const vecA = vec(1, 1);
  const vecB = vec(2, 2);
  const mapA = map.copy({
    buildings: map.buildings.set(vecB, House.create(1)),
    units: map.units.set(vecA, Pioneer.create(1)),
  });

  const effects: Effects = new Map([
    [
      'EndTurn',
      new Set<Effect>([
        {
          actions: [
            {
              type: 'SpawnEffect',
              units: ImmutableMap([[vecB, Pioneer.create(2).setFuel(0).capture()]]),
            },
          ],
          occurrence: 'once',
        },
      ]),
    ],
  ]);

  const [, gameActionResponseA] = await executeGameActions(mapA, [EndTurnAction()], effects);

  expect(snapshotEncodedActionResponse(gameActionResponseA)).toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      Spawn { units: [2,2 → Pioneer { id: 1, health: 100, player: 2, fuel: 0, name: 'Sam', capturing: true }], teams: null, buildings: [] }
      Capture (2,2) { building: House { id: 2, health: 100, player: 2 }, player: 1 }
      EndTurn { current: { funds: 500, player: 2 }, next: { funds: 500, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }"
    `);

  const mapB = mapA.copy({
    buildings: map.buildings.delete(vecB),
  });

  const [, gameActionResponseB] = await executeGameActions(mapB, [EndTurnAction()], effects);

  expect(snapshotEncodedActionResponse(gameActionResponseB)).toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      Spawn { units: [2,2 → Pioneer { id: 1, health: 100, player: 2, fuel: 0, name: 'Sam' }], teams: null, buildings: [] }
      EndTurn { current: { funds: 500, player: 2 }, next: { funds: 500, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }"
    `);

  const mapC = mapA.copy({
    buildings: map.buildings.set(vecB, House.create(2)),
  });

  const [, gameActionResponseC] = await executeGameActions(mapC, [EndTurnAction()], effects);

  expect(snapshotEncodedActionResponse(gameActionResponseC)).toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 500, player: 1 }, next: { funds: 600, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      Spawn { units: [2,2 → Pioneer { id: 1, health: 100, player: 2, fuel: 0, name: 'Sam' }], teams: null, buildings: [] }
      EndTurn { current: { funds: 600, player: 2 }, next: { funds: 500, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }"
    `);
});

test('correctly keeps track of active players', async () => {
  const vision = map.createVisionObject(player1);
  const gameStateEntry = executeEffect(map, vision, {
    type: 'SpawnEffect',
    units: ImmutableMap([[vec(1, 1), Bomber.create(1)]]),
  } as const);

  const newMap = applyActionResponse(vision.apply(map), vision, gameStateEntry![0]);
  expect(newMap.active).toEqual([1, 2]);
});
