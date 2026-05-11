import { expect, test } from 'vitest';
import { DeepSea, Plain, StormCloud } from '../../info/Tile.tsx';
import { Pioneer } from '../../info/Unit.tsx';
import vec from '../../map/vec.tsx';
import MapData from '../../MapData.tsx';
import validateMap from '../validateMap.tsx';
import withModifiers from '../withModifiers.tsx';

const AIRegistry = { has: () => false };

test('validates every layer of layered map tiles', () => {
  const map = withModifiers(
    MapData.createMap({
      map: [
        Plain.id,
        Plain.id,
        Plain.id,
        Plain.id,
        [DeepSea.id, StormCloud.id],
        Plain.id,
        Plain.id,
        Plain.id,
        Plain.id,
      ],
      size: { height: 3, width: 3 },
    }),
  );
  const mapWithUnits = map.copy({
    units: map.units.set(vec(1, 1), Pioneer.create(1)).set(vec(3, 3), Pioneer.create(2)),
  });

  expect(validateMap(mapWithUnits, AIRegistry)).toEqual([null, 'invalid-tiles']);
});

test('rejects layered map tiles with more than two layers', () => {
  const map = MapData.createMap({
    map: [[DeepSea.id, StormCloud.id, StormCloud.id] as unknown as [number, number]],
    size: { height: 1, width: 1 },
  });

  expect(validateMap(map, AIRegistry)).toEqual([null, 'invalid-tiles']);
});

test('rejects layered map modifiers with more than two layers', () => {
  const map = MapData.createMap({
    map: [[DeepSea.id, StormCloud.id]],
    modifiers: [[0, 0, 0] as unknown as [number, number]],
    size: { height: 1, width: 1 },
  });

  expect(validateMap(map, AIRegistry)).toEqual([null, 'invalid-tiles']);
});
