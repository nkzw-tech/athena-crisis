import { expect, test } from 'vitest';
import vec from '../../map/vec.tsx';
import { SizeVector } from '../../MapData.tsx';
import calculateClusters from '../calculateClusters.tsx';

test('calculateClusters` removes nearby clusters when there is a low cluster count', () => {
  expect(
    [
      ...calculateClusters(new SizeVector(10, 10), [vec(1, 1), vec(2, 2)]),
    ].sort(),
  ).toMatchInlineSnapshot(`
    [
      [
        1,
        1,
      ],
    ]
  `);

  expect(
    [
      ...calculateClusters(new SizeVector(400, 400), [
        vec(1, 1),
        vec(2, 2),
        vec(2, 3),
        vec(1, 3),
        vec(6, 6),
        vec(5, 5),
        vec(6, 6),
        vec(10, 10),
        vec(8, 10),
      ]),
    ].sort(),
  ).toMatchInlineSnapshot(`
    [
      [
        1,
        1,
      ],
      [
        10,
        10,
      ],
      [
        6,
        6,
      ],
    ]
  `);
});
