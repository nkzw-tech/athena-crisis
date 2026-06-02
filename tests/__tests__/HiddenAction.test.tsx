import {
  AttackBuildingAction,
  CompleteUnitAction,
  CreateBuildingAction,
  CreateUnitAction,
  EndTurnAction,
} from '@deities/apollo/action-mutators/ActionMutators.tsx';
import applyActionResponse from '@deities/apollo/actions/applyActionResponse.tsx';
import executeGameAction from '@deities/apollo/actions/executeGameAction.tsx';
import { UpAttackDirection } from '@deities/apollo/attack-direction/getAttackDirection.tsx';
import computeVisibleActions from '@deities/apollo/lib/computeVisibleActions.tsx';
import { House, VerticalBarrier } from '@deities/athena/info/Building.tsx';
import { HeavyArtillery, Pioneer, SmallTank } from '@deities/athena/info/Unit.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import { Biome } from '@deities/athena/map/Biome.tsx';
import { Fog } from '@deities/athena/map/PlainMap.tsx';
import { HumanPlayer } from '@deities/athena/map/Player.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import AIRegistry from '@deities/dionysus/AIRegistry.tsx';
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
    map: [1, 8, 4, 8, 2, 8, 4, 4, 4, 8, 4, 4, 3, 4, 4, 8, 4, 4, 4, 8, 2, 8, 4, 8, 1],
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
  const [gameState, gameActionResponse] = await executeGameActions(map, [
    EndTurnAction(),
    CreateBuildingAction(vec(5, 4), 2),
    CompleteUnitAction(vec(1, 1)),
    CreateBuildingAction(vec(4, 5), 2),
    CreateUnitAction(vec(5, 5), 1, vec(5, 5)),
    EndTurnAction(),
  ]);

  expect(snapshotGameState(gameState)).toMatchInlineSnapshot(`
    "EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: null, supply: null, miss: null }
    CreateBuilding (5,4) { building: House { id: 2, health: 100, player: 2, completed: true }, free: null }
    CompleteUnit (1,1)
    CreateBuilding (4,5) { building: House { id: 2, health: 100, player: 2, completed: true }, free: null }
    CreateUnit (5,5 → 5,5) { unit: Pioneer { id: 1, health: 100, player: 2, fuel: 40, moved: true, name: 'Sam', completed: true }, free: false, skipBehaviorRotation: false }
    EndTurn { current: { funds: 200, player: 2 }, next: { funds: 500, player: 1 }, round: 2, rotatePlayers: null, supply: null, miss: null }"
  `);
  expect(snapshotEncodedActionResponse(gameActionResponse)).toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      CreateBuilding (5,4) { building: House { id: 2, health: 100, player: 0 }, free: false }
      CompleteUnit (1,1)
      CreateBuilding (4,5) { building: House { id: 2, health: 100, player: 0 }, free: false }
      EndTurn { current: { funds: 200, player: 2 }, next: { funds: 500, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }"
    `);

  const initialState = await captureOne(
    map.copy({ config: map.config.copy({ fog: Fog.None }) }),
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

  const [gameState, gameActionResponse] = await executeGameActions(newMap, [
    EndTurnAction(),
    AttackBuildingAction(from, to),
    EndTurnAction(),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponse)).toMatchInlineSnapshot(`
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

test('destroying a hidden building also tracks unit losses on that field', () => {
  const to = vec(4, 5);
  const newMap = map.copy({
    buildings: map.buildings.set(to, House.create(2).setHealth(1)),
    units: map.units.set(to, Pioneer.create(2)),
  });

  const resultMap = applyActionResponse(newMap, newMap.createVisionObject(player1), {
    building: undefined,
    chargeB: 50,
    chargeC: 75,
    direction: UpAttackDirection,
    hasCounterAttack: false,
    playerC: 2,
    to,
    type: 'HiddenSourceAttackBuilding',
    unitC: undefined,
  });

  expect(resultMap.buildings.has(to)).toBe(false);
  expect(resultMap.units.has(to)).toBe(false);
  expect(resultMap.getPlayer(2).stats.lostBuildings).toBe(1);
  expect(resultMap.getPlayer(2).stats.lostUnits).toBe(1);
  expect(resultMap.getPlayer(2).charge).toBe(75);
});

test('target-only sabotage response does not crash without a local target unit', () => {
  const to = vec(3, 3);
  const newMap = map.copy({
    units: map.units.delete(to),
  });

  expect(
    applyActionResponse(newMap, newMap.createVisionObject(player1), {
      to,
      type: 'Sabotage',
    }),
  ).toBe(newMap);
});

test('target-only rescue response does not crash without a local target unit', () => {
  const to = vec(3, 3);
  const newMap = map.copy({
    units: map.units.delete(to),
  });

  expect(
    applyActionResponse(newMap, newMap.createVisionObject(player1), {
      player: 1,
      to,
      type: 'Rescue',
    }),
  ).toBe(newMap);
});

test('fully hidden teleporter swap does not reveal unit payloads', () => {
  const source = vec(5, 5);
  const target = vec(5, 4);
  const sourceUnit = Pioneer.create(2);
  const targetUnit = SmallTank.create(2);
  const previousMap = map.copy({
    currentPlayer: 2,
    units: map.units.set(source, sourceUnit).set(target, targetUnit),
  });
  const actionResponse = {
    source,
    sourceUnit,
    target,
    targetUnit,
    type: 'Swap',
  } as const;
  const vision = previousMap.createVisionObject(player1);

  expect(vision.isVisible(previousMap, source)).toBe(false);
  expect(vision.isVisible(previousMap, target)).toBe(false);
  expect(
    computeVisibleActions(previousMap, vision, [
      [
        actionResponse,
        applyActionResponse(previousMap, previousMap.createVisionObject(2), actionResponse),
      ],
    ]),
  ).toEqual([]);
});

test('teleporter swap into a visible target does not reveal the target unit at a hidden source', () => {
  const source = vec(5, 5);
  const target = vec(2, 2);
  const sourceUnit = Pioneer.create(2);
  const targetUnit = SmallTank.create(2);
  const previousMap = map.copy({
    currentPlayer: 2,
    units: map.units.set(source, sourceUnit).set(target, targetUnit),
  });
  const actionResponse = {
    source,
    sourceUnit,
    target,
    targetUnit,
    type: 'Swap',
  } as const;
  const vision = previousMap.createVisionObject(player1);

  expect(vision.isVisible(previousMap, source)).toBe(false);
  expect(vision.isVisible(previousMap, target)).toBe(true);
  expect(
    computeVisibleActions(previousMap, vision, [
      [
        actionResponse,
        applyActionResponse(previousMap, previousMap.createVisionObject(2), actionResponse),
      ],
    ]).at(0)?.[0],
  ).toEqual({
    source,
    sourceUnit,
    target,
    type: 'Swap',
  });
});

test('do not attempt attacking a building via long-range', async () => {
  const from = vec(4, 4);
  const to = vec(2, 3);
  const map = MapData.createMap({
    config: {
      biome: Biome.Swamp,
      fog: true,
    },
    map: [4, 4, 4, 4, 4, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 2, 1, 2, 1, 2, 1, 1, 2, 1, 1],
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
      units: map.units.set(from, HeavyArtillery.create(2)).set(vec(1, 1), Pioneer.create(1)),
    }),
  );

  expect(() => {
    executeGameAction(
      newMap,
      newMap.createVisionObject(player1),
      new Map(),
      EndTurnAction(),
      AIRegistry,
    );
  }).not.toThrow();
});
