import { expect, test } from 'vitest';
import { Flamethrower, Jeep, Pioneer, SmallTank } from '../../info/Unit.tsx';
import withModifiers from '../../lib/withModifiers.tsx';
import Unit from '../../map/Unit.tsx';
import vec from '../../map/vec.tsx';
import MapData from '../../MapData.tsx';
import { getDeterministicUnitName } from '../UnitNames.tsx';

test('assignUnitNames` assigns unit names to all units', () => {
  let map = withModifiers(
    MapData.createMap({
      map: [1, 1, 1, 1, 1, 1, 1, 1, 1],
      size: { height: 3, width: 3 },
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

  map = map.copy({
    units: map.units
      .set(vec(1, 1), Pioneer.create(1))
      .set(vec(2, 1), SmallTank.create(2))
      .set(vec(3, 1), Pioneer.create(1))
      .set(vec(1, 2), Flamethrower.create(2))
      .set(vec(2, 2), Pioneer.create(1))
      .set(vec(3, 2), Jeep.create(2)),
  });

  const vector = vec(1, 1);
  expect(getDeterministicUnitName(map, vector, 1, Pioneer)).toEqual(
    getDeterministicUnitName(map, vector, 1, Pioneer),
  );
  expect(getDeterministicUnitName(map, vector, 2, Pioneer)).toEqual(
    getDeterministicUnitName(map, vector, 2, Pioneer),
  );

  expect(getDeterministicUnitName(map, vector, 1, Pioneer)).not.toEqual(
    getDeterministicUnitName(map, vec(2, 1), 1, Pioneer),
  );

  const map2 = map.copy({
    units: map.units.set(vec(1, 1), Flamethrower.create(1)),
  });
  expect(getDeterministicUnitName(map, vector, 1, Pioneer)).not.toEqual(
    getDeterministicUnitName(map2, vector, 1, Pioneer),
  );
  expect(getDeterministicUnitName(map2, vector, 2, Pioneer)).toEqual(
    getDeterministicUnitName(map2, vector, 2, Pioneer),
  );

  expect(getDeterministicUnitName(map, vector, 1, Pioneer)).not.toEqual(
    getDeterministicUnitName(map, vector, 1, Pioneer, 1),
  );

  const mapWithOddFuel = map.copy({
    units: map.units.set(vec(1, 1), Flamethrower.create(1).setFuel(20.5)),
  });
  expect(
    Math.round(getDeterministicUnitName(mapWithOddFuel, vector, 1, Pioneer)),
  ).toEqual(getDeterministicUnitName(mapWithOddFuel, vector, 1, Pioneer));
});

test('does not lose unit names when encoding and decoding them', () => {
  const pioneer = Pioneer.create(1, { name: 0 });
  const jeepA = Jeep.create(1, { name: 1 }).load(pioneer.transport());
  const jeepB = Unit.fromJSON(jeepA.toJSON());

  expect(Unit.fromJSON(pioneer.toJSON()).getName()).toEqual(pioneer.getName());
  expect(Unit.fromJSON(pioneer.toJSON()).getName()).toEqual(pioneer.getName());
  expect(jeepA.getName()).toEqual(jeepB.getName());
  expect(jeepB.transports?.[0].getName()).toEqual(pioneer.getName());
});
