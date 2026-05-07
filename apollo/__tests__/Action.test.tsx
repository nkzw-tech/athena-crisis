import { Factory, House, RadarStation } from '@deities/athena/info/Building.tsx';
import { ConstructionSite, Lightning, Plain, StormCloud } from '@deities/athena/info/Tile.tsx';
import {
  APU,
  Flamethrower,
  Infantry,
  Jeep,
  Pioneer,
  SmallTank,
} from '@deities/athena/info/Unit.tsx';
import updatePlayer from '@deities/athena/lib/updatePlayer.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import { Charge } from '@deities/athena/map/Configuration.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { expect, test } from 'vitest';
import {
  CreateBuildingAction,
  CreateUnitAction,
  EndTurnAction,
  MoveAction,
  SupplyAction,
  ToggleLightningAction,
} from '../action-mutators/ActionMutators.tsx';
import { execute, executeEffect } from '../Action.tsx';
import executeGameAction, { AIRegistryT } from '../actions/executeGameAction.tsx';
import { Effects, validateEffects } from '../Effects.tsx';
import { formatActionResponse } from '../FormatActions.tsx';

const initialMap = withModifiers(
  MapData.createMap({
    map: [1, 1, 1, 1, 1, 1, 1, 1, 1],
    size: { height: 3, width: 3 },
    teams: [
      {
        id: 1,
        name: '',
        players: [{ funds: 1000, id: 1, userId: '1' }],
      },
      {
        id: 2,
        name: '',
        players: [{ funds: 1000, id: 2, userId: '4' }],
      },
    ],
  }),
);
const player1 = initialMap.getPlayer(1);
const vision = initialMap.createVisionObject(player1);

test('moving into a hidden unit only subtracts fuel for the actual path', () => {
  const from = vec(1, 1);
  const to = vec(5, 1);
  const expectedTo = vec(3, 1);
  const map = withModifiers(
    MapData.createMap({
      config: {
        fog: true,
      },
      map: Array(6).fill(1),
      size: { height: 1, width: 6 },
      teams: [
        {
          id: 1,
          name: '',
          players: [{ funds: 0, id: 1, userId: '1' }],
        },
        {
          id: 2,
          name: '',
          players: [{ funds: 0, id: 2, userId: '2' }],
        },
      ],
      units: [
        [1, 1, SmallTank.create(1).toJSON()],
        [4, 1, Infantry.create(2).toJSON()],
      ],
    }),
  );
  const path = [vec(2, 1), expectedTo, vec(4, 1), to];
  const [response, newMap] = execute(
    map,
    map.createVisionObject(player1),
    MoveAction(from, to, path),
  )!;

  expect(response).toMatchObject({
    completed: true,
    fuel: SmallTank.configuration.fuel - 2,
    path: [vec(2, 1), expectedTo],
    to: expectedTo,
    type: 'Move',
  });
  expect(newMap.units.get(expectedTo)?.fuel).toBe(SmallTank.configuration.fuel - 2);
});

test('does not invoke AI after onEndTurn ends the game', async () => {
  let aiCalls = 0;
  class TestAI {
    constructor(private readonly effects: Effects) {}

    act() {
      aiCalls++;
      return null;
    }

    retrieveEffects() {
      return this.effects;
    }

    retrieveGameState() {
      return [];
    }
  }

  const map = MapData.createMap({
    teams: [
      {
        id: 1,
        name: '',
        players: [{ funds: 0, id: 1, userId: '1' }],
      },
      {
        id: 2,
        name: '',
        players: [{ ai: 0, funds: 0, id: 2, name: 'Bot' }],
      },
    ],
  });
  const AIRegistry: AIRegistryT = new Map([
    [
      0,
      {
        class: TestAI,
        name: 'TestAI',
        published: true,
      },
    ],
  ]);
  const [, , gameState] = await executeGameAction(
    map,
    map.createVisionObject(player1),
    new Map(),
    EndTurnAction(),
    AIRegistry,
    undefined,
    async (map) => [[{ type: 'GameEnd' }, map]],
  );

  expect(aiCalls).toBe(0);
  expect(gameState?.at(-1)?.[0].type).toBe('GameEnd');
});

test('economy effects require safe integer values', () => {
  const effects = validateEffects(
    initialMap,
    new Map([
      [
        'Start',
        new Set([
          {
            actions: [
              { funds: 0.5, player: 1, type: 'IncreaseFundsEffect' } as const,
              {
                funds: Number.MAX_SAFE_INTEGER + 1,
                player: 1,
                type: 'IncreaseFundsEffect',
              } as const,
              { charges: 0.5, player: 1, type: 'IncreaseChargeEffect' } as const,
              { charges: 1, player: 1, type: 'IncreaseChargeEffect' } as const,
              {
                funds: Number.MAX_SAFE_INTEGER,
                player: 1,
                type: 'IncreaseFundsEffect',
              } as const,
            ],
          },
        ]),
      ],
    ]),
  );

  expect([...effects.get('Start')!][0].actions).toEqual([
    { charges: 1, player: 1, type: 'IncreaseChargeEffect' },
    {
      funds: Number.MAX_SAFE_INTEGER,
      player: 1,
      type: 'IncreaseFundsEffect',
    },
  ]);

  expect(
    executeEffect(initialMap, vision, {
      funds: 0.5,
      player: 1,
      type: 'IncreaseFundsEffect',
    }),
  ).toBe(null);
  expect(
    executeEffect(initialMap, vision, {
      charges: 0.5,
      player: 1,
      type: 'IncreaseChargeEffect',
    }),
  ).toBe(null);
});

test('fund increases are capped at the maximum safe integer', () => {
  const map = initialMap.copy({
    teams: updatePlayer(
      initialMap.teams,
      initialMap.getPlayer(1).setFunds(Number.MAX_SAFE_INTEGER - 5),
    ),
  });
  const [, newMap] = executeEffect(map, map.createVisionObject(player1), {
    funds: 10,
    player: 1,
    type: 'IncreaseFundsEffect',
  })!;

  expect(newMap.getPlayer(1).funds).toBe(Number.MAX_SAFE_INTEGER);
});

test('supplying surrounding units', () => {
  const from = vec(2, 2);
  const to = vec(3, 2);
  const map = initialMap.copy({
    units: initialMap.units.set(from, Jeep.create(1)).set(to, SmallTank.create(1).setFuel(1)),
  });
  const [response, newMap] = execute(map, vision, SupplyAction(from))!;

  expect(formatActionResponse(response, { colors: false })).toMatchInlineSnapshot(
    '"Supply (2,2) { player: 1 }"',
  );

  const newUnit = newMap.units.get(to)!;
  expect(newUnit).not.toEqual(map.units.get(to));
  expect(newUnit.fuel).toEqual(newUnit.info.configuration.fuel);
});

test('creating units', () => {
  const to = vec(2, 2);
  const map = initialMap.copy({
    buildings: initialMap.buildings.set(to, Factory.create(1)),
  });
  const [response, newMap] = execute(map, vision, CreateUnitAction(to, APU.id, to))!;

  expect(formatActionResponse(response, { colors: false })).toMatchInlineSnapshot(
    '"CreateUnit (2,2 → 2,2) { unit: APU { id: 4, health: 100, player: 1, fuel: 40, ammo: [ [ 1, 6 ] ], moved: true, name: \'Nora\', completed: true }, free: false, skipBehaviorRotation: false }"',
  );

  const unit = APU.create(player1).complete();
  expect(newMap.units.get(to)!.withName(null)).toEqual(unit);
  expect(newMap.getPlayer(1).funds < map.getPlayer(1).funds).toBe(true);

  const secondMap = map.copy({
    units: initialMap.units.set(to, APU.create(2)),
  });

  expect(execute(secondMap, vision, CreateUnitAction(to, APU.id, to.left()))).toBe(null);
});

test('creating units with a friendly player on the building', () => {
  const to = vec(2, 2);
  const map = MapData.fromObject({
    ...initialMap.toJSON(),
    teams: [
      {
        id: 1,
        name: '',
        players: [
          { funds: 1000, id: 1, userId: '1' },
          { funds: 1000, id: 3, userId: '5' },
        ],
      },
      {
        id: 2,
        name: '',
        players: [{ funds: 1000, id: 2, userId: '4' }],
      },
    ],
  }).copy({
    buildings: initialMap.buildings.set(to, Factory.create(1)),
    units: initialMap.units.set(to, APU.create(3)),
  });
  const [response] = execute(map, vision, CreateUnitAction(to, APU.id, to.left()))!;

  expect(formatActionResponse(response, { colors: false })).toMatchInlineSnapshot(
    '"CreateUnit (2,2 → 1,2) { unit: APU { id: 4, health: 100, player: 1, fuel: 40, ammo: [ [ 1, 6 ] ], moved: true, name: \'Nora\', completed: true }, free: false, skipBehaviorRotation: false }"',
  );
});

test('creating buildings', () => {
  const vecA = vec(1, 1);
  const vecB = vec(3, 3);
  const map = initialMap.copy({
    map: [ConstructionSite.id, 1, 1, 1, 1, 1, 1, 1, 1],
    units: initialMap.units.set(vecA, Pioneer.create(1)),
  });

  const [responseA] = execute(map, vision, CreateBuildingAction(vecA, Factory.id))!;

  expect(formatActionResponse(responseA, { colors: false })).toMatchInlineSnapshot(
    `"CreateBuilding (1,1) { building: Factory { id: 3, health: 100, player: 1, completed: true }, free: null }"`,
  );

  expect(execute(map, vision, CreateBuildingAction(vecA, House.id))).toBe(null);

  const [responseB] = execute(
    map.copy({
      units: map.units.set(vecB, Flamethrower.create(1)),
    }),
    vision,
    CreateBuildingAction(vecA, House.id),
  )!;

  expect(formatActionResponse(responseB, { colors: false })).toMatchInlineSnapshot(
    `"CreateBuilding (1,1) { building: House { id: 2, health: 100, player: 1, completed: true }, free: null }"`,
  );

  expect(
    execute(
      map.copy({
        units: map.units.set(vecB, Jeep.create(1)),
      }),
      vision,
      CreateBuildingAction(vecA, House.id),
    ),
  ).toBe(null);
});

test('Radar Stations are only available if Lightning can be placed', () => {
  const vecA = vec(1, 1);
  const vecB = vec(1, 3);
  const map = initialMap.copy({
    buildings: initialMap.buildings.set(vecB, Factory.create(1)),
    map: [ConstructionSite.id, 1, 1, 1, 1, 1, 1, 1, 1],
    units: initialMap.units.set(vecA, Pioneer.create(1)),
  });

  const tilesA = map.map.slice();
  tilesA[2] = [Plain.id, StormCloud.id];
  tilesA[8] = [Plain.id, StormCloud.id];
  const mapA = map.copy({
    map: tilesA,
  });
  const [responseC] = execute(mapA, vision, CreateBuildingAction(vecA, RadarStation.id))!;

  expect(formatActionResponse(responseC, { colors: false })).toMatchInlineSnapshot(
    `"CreateBuilding (1,1) { building: Radar Station { id: 10, health: 100, player: 1, completed: true }, free: null }"`,
  );

  expect(execute(map, vision, CreateBuildingAction(vecA, RadarStation.id))).toBe(null);

  const tilesB = tilesA.slice();
  tilesB[5] = [Plain.id, Lightning.id];
  const mapB = map.copy({
    map: tilesA,
  });
  const [responseD] = execute(mapB, vision, CreateBuildingAction(vecA, RadarStation.id))!;

  expect(formatActionResponse(responseD, { colors: false })).toMatchInlineSnapshot(
    `"CreateBuilding (1,1) { building: Radar Station { id: 10, health: 100, player: 1, completed: true }, free: null }"`,
  );

  const [responseE] = execute(
    mapA.copy({
      buildings: mapA.buildings.set(vec(3, 2), Factory.create(1)),
    }),
    vision,
    CreateBuildingAction(vecA, RadarStation.id),
  )!;

  expect(formatActionResponse(responseE, { colors: false })).toMatchInlineSnapshot(
    `"CreateBuilding (1,1) { building: Radar Station { id: 10, health: 100, player: 1, completed: true }, free: null }"`,
  );
});

test('lightning cannot be toggled outside of the map', () => {
  const from = vec(2, 2);
  const map = initialMap.copy({
    buildings: initialMap.buildings.set(from, RadarStation.create(1)),
    teams: updatePlayer(initialMap.teams, player1.setCharge(Charge)),
  });

  expect(execute(map, vision, ToggleLightningAction(from, vec(4, 2)))).toBe(null);
});
