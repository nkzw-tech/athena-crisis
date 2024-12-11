import { Sniper } from '@deities/athena/info/Unit.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { expect, test } from 'vitest';
import estimateClosestTarget from '../estimateClosestTarget.tsx';

const map = withModifiers(
  MapData.createMap({
    map: [
      1, 1, 1, 3, 2, 1, 1, 1, 3, 1, 1, 2, 3, 1, 3, 1, 1, 1, 1, 1, 1, 2, 3, 1, 1,
    ],
    size: { height: 5, width: 5 },
  }),
);

test('estimateClosestTarget should not require a player to be present on the map', () => {
  const [target] = estimateClosestTarget(
    map,
    Sniper.create(3, { name: -1 }),
    vec(1, 1),
    [vec(5, 1), vec(1, 5)],
    true,
  );
  expect(target?.vector).toEqual(vec(1, 5));
});
