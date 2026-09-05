import { describe, test } from 'vitest';
import startMap from '../../hermes/map-fixtures/they-are-close-to-home.tsx';
import { getAllUnits } from '../info/Unit.tsx';
import vec from '../map/vec.tsx';
import { moveable } from '../Radius.tsx';

describe('movement radius', () => {
  test('base case', async ({ bench }) => {
    await bench('base case', () => {
      for (const [vector, unit] of startMap.units) {
        moveable(startMap, unit, vector, 7);
      }
    }).run();
  });
});

describe('movement radius for each unit', () => {
  const vector = vec(Math.floor(startMap.size.width / 2), Math.floor(startMap.size.height / 2));
  test('base case', async ({ bench }) => {
    await bench('base case', () => {
      for (const unit of getAllUnits()) {
        moveable(startMap, unit.create(1), vector);
      }
    }).run();
  });
});
