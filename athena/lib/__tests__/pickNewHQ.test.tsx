import { expect, test } from 'vitest';
import { Barracks, HQ } from '../../info/Building.tsx';
import { SmallTank } from '../../info/Unit.tsx';
import vec from '../../map/vec.tsx';
import MapData from '../../MapData.tsx';
import hasHQ from '../hasHQ.tsx';
import pickNewHQ from '../pickNewHQ.tsx';
import withModifiers from '../withModifiers.tsx';

const size = 10;
const map = withModifiers(
  MapData.createMap({
    map: Array(size * size).fill(1),
    size: { height: size, width: size },
    teams: [
      { id: 1, name: '', players: [{ funds: 0, id: 1, userId: '1' }] },
      { id: 2, name: '', players: [{ funds: 0, id: 2, name: 'AI' }] },
    ],
  }),
);

test('picks a new HQ closer to friendly units', () => {
  const vecA = vec(1, 1);
  const vecB = vec(10, 10);
  const mapA = map.copy({
    buildings: map.buildings
      .set(vecA, Barracks.create(1))
      .set(vecB, Barracks.create(1)),
    units: map.units
      .set(vecA, SmallTank.create(1))
      .set(vecB.up(), SmallTank.create(2)),
  });

  expect(hasHQ(mapA, 1)).toBe(false);
  expect(
    hasHQ(
      mapA.copy({
        buildings: mapA.buildings.set(vecA, HQ.create(1)),
      }),
      1,
    ),
  ).toBe(true);
  expect(pickNewHQ(mapA, 1)).toBe(vecA);
});

test('does not pick a building occupied by an opponent', () => {
  const vecA = vec(1, 1);
  const vecB = vec(10, 10);
  const mapA = map.copy({
    buildings: map.buildings
      .set(vecA, Barracks.create(1))
      .set(vecB, Barracks.create(1)),
    units: map.units
      .set(vecA, SmallTank.create(2))
      .set(vecA.right(), SmallTank.create(1))
      .set(vecA.down(), SmallTank.create(1)),
  });

  expect(hasHQ(mapA, 1)).toBe(false);
  expect(pickNewHQ(mapA, 1)).toBe(vecB);

  const mapB = mapA.copy({
    units: mapA.units.set(vecB, SmallTank.create(2)),
  });
  expect(pickNewHQ(mapB, 1)).toBe(undefined);
});
