import { expect, test } from 'vitest';
import { Sea } from '../../info/Tile.tsx';
import {
  Flamethrower,
  Hovercraft,
  Jeep,
  Jetpack,
  Pioneer,
  RocketLauncher,
  Sniper,
  Truck,
} from '../../info/Unit.tsx';
import Unit, { TransportedUnit } from '../../map/Unit.tsx';
import vec from '../../map/vec.tsx';
import MapData from '../../MapData.tsx';
import assignUnitNames from '../assignUnitNames.tsx';
import withModifiers from '../withModifiers.tsx';

test('assignUnitNames` assigns unit names to all units', () => {
  let map = withModifiers(
    MapData.createMap({
      map: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, Sea.id],
      size: { height: 5, width: 5 },
      teams: [
        {
          id: 1,
          name: '',
          players: [{ funds: 0, id: 1, userId: '1' }],
        },
        {
          id: 2,
          name: '',
          players: [{ funds: 0, id: 2, name: 'AI' }],
        },
      ],
    }),
  );

  map = assignUnitNames(
    map.copy({
      units: map.units
        .set(vec(1, 1), Pioneer.create(1))
        .set(vec(2, 1), Pioneer.create(2))
        .set(vec(3, 1), Pioneer.create(1))
        .set(vec(4, 1), Flamethrower.create(1))
        .set(vec(1, 2), Pioneer.create(2))
        .set(vec(2, 2), Pioneer.create(1))
        .set(vec(3, 2), Pioneer.create(2))
        .set(
          vec(4, 2),
          Jeep.create(2).copy({
            transports: [Flamethrower.create(2).transport()],
          }),
        )
        .set(vec(1, 3), Sniper.create(2).withName(-1))
        .set(vec(2, 3), Sniper.create(1))
        .set(vec(3, 3), Sniper.create(1).withName(-1))
        .set(vec(4, 3), Flamethrower.create(2))
        .set(
          vec(5, 5),
          Hovercraft.create(2).copy({
            transports: [
              Truck.create(2)
                .copy({
                  transports: [Jetpack.create(2).transport(), RocketLauncher.create(2).transport()],
                })
                .transport(),
            ],
          }),
        ),
    }),
  );

  expect(map.units.filter((unit) => unit.info === Pioneer && unit.isLeader()).size).toBe(2);

  const flatten = <T extends Unit | TransportedUnit>(
    unit: T,
  ): ReadonlyArray<Unit | TransportedUnit> => {
    if (!unit.transports) {
      return [unit];
    }
    return unit.transports?.length ? [unit, ...unit.transports.flatMap(flatten)] : [unit];
  };

  expect([...map.units.values()].flatMap(flatten).filter((unit) => unit.isLeader()).length).toBe(
    11,
  );

  expect(map.units.get(vec(1, 3))?.isLeader()).toBe(true);
  expect(map.units.get(vec(3, 3))?.isLeader()).toBe(true);

  expect(map.units.map((unit) => unit.getName(1)).filter((name) => !!name).size).toEqual(
    map.units.size,
  );
  expect(map.units.map((unit) => unit.getName(2)).filter((name) => !!name).size).toEqual(
    map.units.size,
  );
});
