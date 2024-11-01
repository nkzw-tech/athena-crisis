import {
  Factory,
  House,
  RadarStation,
} from '@deities/athena/info/Building.tsx';
import {
  ConstructionSite,
  Lightning,
  Plain,
  StormCloud,
} from '@deities/athena/info/Tile.tsx';
import {
  APU,
  Flamethrower,
  Jeep,
  Pioneer,
  SmallTank,
} from '@deities/athena/info/Unit.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { expect, test } from 'vitest';
import {
  CreateBuildingAction,
  CreateUnitAction,
  SupplyAction,
} from '../action-mutators/ActionMutators.tsx';
import { execute } from '../Action.tsx';
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

test('supplying surrounding units', () => {
  const from = vec(2, 2);
  const to = vec(3, 2);
  const map = initialMap.copy({
    units: initialMap.units
      .set(from, Jeep.create(1))
      .set(to, SmallTank.create(1).setFuel(1)),
  });
  const [response, newMap] = execute(map, vision, SupplyAction(from))!;

  expect(
    formatActionResponse(response, { colors: false }),
  ).toMatchInlineSnapshot('"Supply (2,2) { player: 1 }"');

  const newUnit = newMap.units.get(to)!;
  expect(newUnit).not.toEqual(map.units.get(to));
  expect(newUnit.fuel).toEqual(newUnit.info.configuration.fuel);
});

test('creating units', () => {
  const to = vec(2, 2);
  const map = initialMap.copy({
    buildings: initialMap.buildings.set(to, Factory.create(1)),
  });
  const [response, newMap] = execute(
    map,
    vision,
    CreateUnitAction(to, APU.id, to),
  )!;

  expect(
    formatActionResponse(response, { colors: false }),
  ).toMatchInlineSnapshot(
    '"CreateUnit (2,2 → 2,2) { unit: APU { id: 4, health: 100, player: 1, fuel: 40, ammo: [ [ 1, 6 ] ], moved: true, name: \'Nora\', completed: true }, free: false, skipBehaviorRotation: false }"',
  );

  const unit = APU.create(player1).complete();
  expect(newMap.units.get(to)!.withName(null)).toEqual(unit);
  expect(newMap.getPlayer(1).funds < map.getPlayer(1).funds).toBe(true);

  const secondMap = map.copy({
    units: initialMap.units.set(to, APU.create(2)),
  });

  expect(
    execute(secondMap, vision, CreateUnitAction(to, APU.id, to.left())),
  ).toBe(null);
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
  const [response] = execute(
    map,
    vision,
    CreateUnitAction(to, APU.id, to.left()),
  )!;

  expect(
    formatActionResponse(response, { colors: false }),
  ).toMatchInlineSnapshot(
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

  const [responseA] = execute(
    map,
    vision,
    CreateBuildingAction(vecA, Factory.id),
  )!;

  expect(
    formatActionResponse(responseA, { colors: false }),
  ).toMatchInlineSnapshot(
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

  expect(
    formatActionResponse(responseB, { colors: false }),
  ).toMatchInlineSnapshot(
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
  const [responseC] = execute(
    mapA,
    vision,
    CreateBuildingAction(vecA, RadarStation.id),
  )!;

  expect(
    formatActionResponse(responseC, { colors: false }),
  ).toMatchInlineSnapshot(
    `"CreateBuilding (1,1) { building: Radar Station { id: 10, health: 100, player: 1, completed: true }, free: null }"`,
  );

  expect(
    execute(map, vision, CreateBuildingAction(vecA, RadarStation.id)),
  ).toBe(null);

  const tilesB = tilesA.slice();
  tilesB[5] = [Plain.id, Lightning.id];
  const mapB = map.copy({
    map: tilesA,
  });
  const [responseD] = execute(
    mapB,
    vision,
    CreateBuildingAction(vecA, RadarStation.id),
  )!;

  expect(
    formatActionResponse(responseD, { colors: false }),
  ).toMatchInlineSnapshot(
    `"CreateBuilding (1,1) { building: Radar Station { id: 10, health: 100, player: 1, completed: true }, free: null }"`,
  );

  const [responseE] = execute(
    mapA.copy({
      buildings: mapA.buildings.set(vec(3, 2), Factory.create(1)),
    }),
    vision,
    CreateBuildingAction(vecA, RadarStation.id),
  )!;

  expect(
    formatActionResponse(responseE, { colors: false }),
  ).toMatchInlineSnapshot(
    `"CreateBuilding (1,1) { building: Radar Station { id: 10, health: 100, player: 1, completed: true }, free: null }"`,
  );
});
