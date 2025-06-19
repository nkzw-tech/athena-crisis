import vec from '@deities/athena/map/vec.tsx';
import { SizeVector } from '@deities/athena/MapData.tsx';
import { expect, test } from 'vitest';
import getSymmetricPositions from '../getSymmetricPositions.tsx';

test('`getSymmetricPositions` regular', () => {
  expect(
    getSymmetricPositions(vec(4, 4), 'regular', new SizeVector(10, 10)),
  ).toMatchInlineSnapshot(`Set {}`);
});

test('`getSymmetricPositions` horizontal', () => {
  expect(getSymmetricPositions(vec(4, 4), 'horizontal', new SizeVector(10, 10)))
    .toMatchInlineSnapshot(`
      Set {
        [
          7,
          4,
        ],
      }
    `);
  expect(getSymmetricPositions(vec(8, 8), 'horizontal', new SizeVector(10, 10)))
    .toMatchInlineSnapshot(`
      Set {
        [
          3,
          8,
        ],
      }
    `);
});

test('`getSymmetricPositions` vertical', () => {
  expect(getSymmetricPositions(vec(4, 4), 'vertical', new SizeVector(10, 10)))
    .toMatchInlineSnapshot(`
      Set {
        [
          4,
          7,
        ],
      }
    `);
  expect(getSymmetricPositions(vec(8, 8), 'vertical', new SizeVector(10, 10)))
    .toMatchInlineSnapshot(`
      Set {
        [
          8,
          3,
        ],
      }
    `);
});

test('`getSymmetricPositions` diagonal', () => {
  expect(getSymmetricPositions(vec(4, 4), 'diagonal', new SizeVector(10, 10)))
    .toMatchInlineSnapshot(`
      Set {
        [
          7,
          7,
        ],
      }
    `);
  expect(getSymmetricPositions(vec(8, 8), 'diagonal', new SizeVector(10, 10)))
    .toMatchInlineSnapshot(`
      Set {
        [
          3,
          3,
        ],
      }
    `);
});

test('`getSymmetricPositions` horizontal-vertical', () => {
  expect(
    getSymmetricPositions(
      vec(4, 4),
      'horizontal-vertical',
      new SizeVector(10, 10),
    ),
  ).toMatchInlineSnapshot(`
    Set {
      [
        7,
        4,
      ],
      [
        4,
        7,
      ],
      [
        7,
        7,
      ],
    }
  `);
  expect(
    getSymmetricPositions(
      vec(8, 8),
      'horizontal-vertical',
      new SizeVector(10, 10),
    ),
  ).toMatchInlineSnapshot(`
    Set {
      [
        3,
        8,
      ],
      [
        8,
        3,
      ],
      [
        3,
        3,
      ],
    }
  `);
});

test('`getSymmetricPositions` does not include vector itself', () => {
  expect(
    getSymmetricPositions(vec(3, 2), 'horizontal', new SizeVector(5, 5)),
  ).toMatchInlineSnapshot(`Set {}`);
  expect(
    getSymmetricPositions(vec(2, 3), 'vertical', new SizeVector(5, 5)),
  ).toMatchInlineSnapshot(`Set {}`);
  expect(
    getSymmetricPositions(vec(3, 3), 'diagonal', new SizeVector(5, 5)),
  ).toMatchInlineSnapshot(`Set {}`);
  expect(
    getSymmetricPositions(
      vec(3, 3),
      'horizontal-vertical',
      new SizeVector(5, 5),
    ),
  ).toMatchInlineSnapshot(`Set {}`);
});
