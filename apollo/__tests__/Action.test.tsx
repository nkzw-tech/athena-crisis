import { Factory } from '@deities/athena/info/Building.tsx';
import { APU, Jeep, SmallTank } from '@deities/athena/info/Unit.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { expect, test } from 'vitest';
import {
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
