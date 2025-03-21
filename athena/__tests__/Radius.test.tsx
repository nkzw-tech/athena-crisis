import isPresent from '@nkzw/core/isPresent.js';
import { expect, test } from 'vitest';
import startMap from '../../hermes/map-fixtures/they-are-close-to-home.tsx';
import { Skill } from '../info/Skill.tsx';
import { Path, Space } from '../info/Tile.tsx';
import {
  Battleship,
  Flamethrower,
  Humvee,
  Jetpack,
  PatrolShip,
  XFighter,
} from '../info/Unit.tsx';
import updatePlayer from '../lib/updatePlayer.tsx';
import MapData, { SizeVector } from '../MapData.tsx';
import { attackable, moveable } from '../Radius.tsx';
import vec from './../map/vec.tsx';

const radiusTestMap = MapData.createMap({
  buildings: [
    [
      1,
      1,
      {
        h: 100,
        i: 1,
        p: 1,
      },
    ],
    [
      2,
      1,
      {
        h: 100,
        i: 1,
        p: 2,
      },
    ],
  ],
  map: [
    1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 1, 1,
  ],
  size: {
    height: 5,
    width: 5,
  },
  teams: [
    {
      id: 1,
      name: '',
      players: [
        {
          funds: 500,
          id: 1,
        },
      ],
    },
    {
      id: 2,
      name: '',
      players: [
        {
          funds: 500,
          id: 2,
        },
      ],
    },
  ],
  units: [
    [
      1,
      1,
      {
        a: [[1, 7]],
        g: 30,
        h: 100,
        i: 5,
        p: 2,
      },
    ],
    [
      1,
      2,
      {
        g: 50,
        h: 100,
        i: 2,
        p: 2,
      },
    ],
    [
      3,
      1,
      {
        a: [[1, 7]],
        g: 30,
        h: 100,
        i: 5,
        p: 1,
      },
    ],
    [
      1,
      3,
      {
        a: [[1, 4]],
        g: 15,
        h: 100,
        i: 12,
        p: 2,
      },
    ],
    [
      2,
      3,
      {
        a: [[1, 4]],
        g: 40,
        h: 100,
        i: 3,
        p: 2,
      },
    ],
    [
      4,
      2,
      {
        a: [[1, 7]],
        g: 30,
        h: 100,
        i: 5,
        p: 1,
      },
    ],
    [
      3,
      3,
      {
        a: [[1, 4]],
        g: 40,
        h: 100,
        i: 3,
        p: 1,
      },
    ],
    [
      2,
      4,
      {
        a: [[1, 4]],
        g: 15,
        h: 100,
        i: 12,
        p: 2,
      },
    ],
    [
      4,
      3,
      {
        g: 50,
        h: 100,
        i: 2,
        p: 1,
      },
    ],
    [
      5,
      3,
      {
        a: [[1, 7]],
        g: 30,
        h: 100,
        i: 5,
        p: 1,
      },
    ],
    [
      4,
      4,
      {
        g: 50,
        h: 100,
        i: 2,
        p: 1,
      },
    ],
    [
      3,
      5,
      {
        g: 40,
        h: 100,
        i: 1,
        p: 1,
      },
    ],
  ],
});

const spaceMap = MapData.createMap({
  config: {
    biome: 4,
  },
  map: [
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    29,
    1,
    1,
    1,
    29,
    29,
    29,
    29,
    30,
    1,
    30,
    29,
    29,
    29,
    29,
    [29, 33],
    29,
    [29, 33],
    29,
    29,
    29,
    29,
    [29, 33],
    29,
    [29, 33],
    29,
    29,
    29,
    31,
    [29, 33],
    31,
    [29, 33],
    31,
    29,
    29,
    1,
    1,
    1,
    1,
    1,
    29,
    29,
    1,
    1,
    1,
    1,
    1,
    1,
  ],
  size: {
    height: 8,
    width: 7,
  },
  units: [
    [
      6,
      8,
      {
        a: [
          [1, 5],
          [2, 3],
        ],
        g: 30,
        h: 100,
        i: 20,
        p: 1,
      },
    ],
    [
      2,
      8,
      {
        a: [
          [1, 5],
          [2, 3],
        ],
        g: 30,
        h: 100,
        i: 20,
        p: 1,
      },
    ],
    [
      6,
      4,
      {
        a: [
          [1, 5],
          [2, 3],
        ],
        g: 30,
        h: 100,
        i: 20,
        p: 1,
      },
    ],
    [
      1,
      4,
      {
        a: [
          [1, 5],
          [2, 3],
        ],
        g: 30,
        h: 100,
        i: 20,
        p: 1,
      },
    ],
    [
      3,
      2,
      {
        a: [
          [1, 5],
          [2, 3],
        ],
        g: 30,
        h: 100,
        i: 20,
        p: 1,
      },
    ],
    [
      5,
      2,
      {
        a: [
          [1, 5],
          [2, 3],
        ],
        g: 30,
        h: 100,
        i: 20,
        p: 1,
      },
    ],
    [
      7,
      8,
      {
        g: 40,
        h: 100,
        i: 1,
        p: 2,
      },
    ],
  ],
});

test('calculate the moveable radius', () => {
  const vecA = vec(15, 7);
  const testMap = startMap.copy({
    units: startMap.units.delete(vec(15, 8)),
  });
  const unitA = testMap.units.get(vecA);

  if (!unitA) {
    throw new Error(`Radius.test: 'unitA' not found at position ${vecA}.`);
  }

  expect(
    [...moveable(testMap, unitA, vecA, 1).values()].map(({ vector }) => vector),
  ).toEqual([vec(15, 6), vec(15, 8), vec(14, 7)]);

  expect(
    [...moveable(testMap, unitA, vecA, 2).values()]
      .map(({ vector }) => vector)
      .sort(),
  ).toEqual(
    [
      vec(13, 7),
      vec(15, 5),
      vec(14, 6),
      vec(15, 6),
      vec(14, 7),
      vec(14, 8),
      vec(15, 8),
      vec(15, 9),
      vec(16, 8),
    ].sort(),
  );

  expect(Array.from(attackable(testMap, unitA, vecA, 'cost').keys()).sort())
    .toMatchInlineSnapshot(`
      [
        [
          12,
          8,
        ],
        [
          13,
          5,
        ],
        [
          13,
          6,
        ],
        [
          13,
          7,
        ],
        [
          13,
          8,
        ],
        [
          13,
          9,
        ],
        [
          14,
          10,
        ],
        [
          14,
          4,
        ],
        [
          14,
          5,
        ],
        [
          14,
          6,
        ],
        [
          14,
          7,
        ],
        [
          14,
          8,
        ],
        [
          14,
          9,
        ],
        [
          15,
          10,
        ],
        [
          15,
          3,
        ],
        [
          15,
          4,
        ],
        [
          15,
          5,
        ],
        [
          15,
          6,
        ],
        [
          15,
          7,
        ],
        [
          15,
          8,
        ],
        [
          15,
          9,
        ],
        [
          16,
          10,
        ],
        [
          16,
          4,
        ],
        [
          16,
          5,
        ],
        [
          16,
          6,
        ],
        [
          16,
          7,
        ],
        [
          16,
          8,
        ],
        [
          16,
          9,
        ],
        [
          17,
          5,
        ],
        [
          17,
          6,
        ],
        [
          17,
          7,
        ],
        [
          17,
          8,
        ],
        [
          17,
          9,
        ],
        [
          18,
          8,
        ],
      ]
    `);
});

test('verifies that the attackable radius is always correct', () => {
  const map = radiusTestMap;
  const player1 = map.getPlayer(1);
  const vectors = [vec(3, 3), vec(4, 2), vec(4, 3), vec(4, 4)];
  const units = vectors
    .map((vector) => map.units.get(vector))
    .filter(isPresent);

  const getAttackable = (id: number) =>
    Array.from(attackable(map, units[id], vectors[id], 'cost').values())
      .filter(({ vector }) => {
        const unit = map.units.get(vector);
        return unit && map.isOpponent(unit, player1);
      })
      .map(({ parent, vector }) => ({ parent, vector }))
      .sort(({ vector: vecA }, { vector: vecB }) =>
        String(vecA).localeCompare(String(vecB)),
      );

  expect(getAttackable(0)).toMatchInlineSnapshot(`
    [
      {
        "parent": [
          2,
          1,
        ],
        "vector": [
          1,
          1,
        ],
      },
      {
        "parent": [
          2,
          2,
        ],
        "vector": [
          1,
          2,
        ],
      },
      {
        "parent": [
          3,
          3,
        ],
        "vector": [
          2,
          3,
        ],
      },
      {
        "parent": [
          3,
          4,
        ],
        "vector": [
          2,
          4,
        ],
      },
    ]
  `);

  expect(getAttackable(1)).toMatchInlineSnapshot(`
    [
      {
        "parent": [
          2,
          1,
        ],
        "vector": [
          1,
          1,
        ],
      },
      {
        "parent": [
          2,
          2,
        ],
        "vector": [
          1,
          2,
        ],
      },
      {
        "parent": [
          2,
          2,
        ],
        "vector": [
          2,
          3,
        ],
      },
      {
        "parent": [
          3,
          4,
        ],
        "vector": [
          2,
          4,
        ],
      },
    ]
  `);

  expect(getAttackable(2)).toMatchInlineSnapshot(`
    [
      {
        "parent": [
          2,
          2,
        ],
        "vector": [
          1,
          2,
        ],
      },
      {
        "parent": [
          2,
          2,
        ],
        "vector": [
          2,
          3,
        ],
      },
      {
        "parent": [
          3,
          4,
        ],
        "vector": [
          2,
          4,
        ],
      },
    ]
  `);

  expect(getAttackable(3)).toMatchInlineSnapshot(`
    [
      {
        "parent": [
          3,
          4,
        ],
        "vector": [
          2,
          4,
        ],
      },
    ]
  `);
});

test('Trenches give a movement bonus to infantry units', () => {
  const vecA = vec(2, 3);
  const vecB = vec(8, 3);
  const map = MapData.createMap({
    map: [
      19, 19, 19, 19, 1, 1, 1, 1, 6, 6, 1, 19, 1, 1, 1, 1, 6, 19, 19, 19, 19,
      19, 19, 1, 6, 1, 1, 19, 1, 1, 1, 1, 6, 19, 19, 19, 1, 1, 1, 1,
    ],
    size: {
      height: 5,
      width: 8,
    },
    teams: [
      {
        id: 1,
        name: '',
        players: [
          {
            funds: 500,
            id: 1,
          },
        ],
      },
      {
        id: 2,
        name: '',
        players: [
          {
            funds: 500,
            id: 2,
          },
        ],
      },
    ],
    units: [
      [
        8,
        3,
        {
          a: [[1, 4]],
          g: 30,
          h: 100,
          i: 15,
          p: 2,
        },
      ],
      [
        2,
        3,
        {
          g: 40,
          h: 100,
          i: 1,
          p: 1,
        },
      ],
    ],
  });

  const unitA = map.units.get(vecA)!;
  const unitB = map.units.get(vecB)!;
  const moveableA = moveable(map, unitA, vecA);
  const moveableB = moveable(map, unitB, vecB);
  expect(Array.from(moveableA.keys()).sort()).toMatchInlineSnapshot(`
    [
      [
        2,
        1,
      ],
      [
        2,
        4,
      ],
      [
        2,
        5,
      ],
      [
        3,
        1,
      ],
      [
        3,
        2,
      ],
      [
        3,
        3,
      ],
      [
        3,
        4,
      ],
      [
        3,
        5,
      ],
      [
        4,
        1,
      ],
      [
        4,
        2,
      ],
      [
        4,
        3,
      ],
      [
        4,
        4,
      ],
      [
        4,
        5,
      ],
      [
        5,
        2,
      ],
      [
        5,
        3,
      ],
      [
        5,
        4,
      ],
      [
        6,
        3,
      ],
      [
        7,
        3,
      ],
    ]
  `);

  expect(Array.from(moveableB.keys()).sort()).toMatchInlineSnapshot(`
    [
      [
        3,
        1,
      ],
      [
        3,
        3,
      ],
      [
        3,
        5,
      ],
      [
        4,
        1,
      ],
      [
        4,
        2,
      ],
      [
        4,
        3,
      ],
      [
        4,
        4,
      ],
      [
        4,
        5,
      ],
      [
        5,
        2,
      ],
      [
        5,
        3,
      ],
      [
        5,
        4,
      ],
      [
        6,
        1,
      ],
      [
        6,
        2,
      ],
      [
        6,
        3,
      ],
      [
        6,
        4,
      ],
      [
        6,
        5,
      ],
      [
        7,
        1,
      ],
      [
        7,
        2,
      ],
      [
        7,
        3,
      ],
      [
        7,
        4,
      ],
      [
        7,
        5,
      ],
      [
        8,
        1,
      ],
      [
        8,
        2,
      ],
      [
        8,
        4,
      ],
      [
        8,
        5,
      ],
    ]
  `);

  expect(moveableA.get(vec(2, 1))!.cost).toBe(3);
  expect(moveableA.get(vec(3, 1))!.cost).toBe(2.5);
  expect(moveableA.get(vec(3, 2))!.cost).toBe(2);
  expect(moveableB.get(vec(6, 2))!.cost).toBe(3);
  expect(moveableB.get(vec(6, 3))!.cost).toBe(1.5);
});

test('verifies that the attackable radius is always correct for X-Fighters', () => {
  const vecA = vec(7, 7);
  const unitA = XFighter.create(1);
  const map = radiusTestMap.copy({
    map: Array(14 * 14).fill(1),
    size: new SizeVector(14, 14),
    units: radiusTestMap.units.set(vecA, unitA),
  });

  expect(Array.from(attackable(map, unitA, vecA, 'cost').keys()).sort())
    .toMatchInlineSnapshot(`
      [
        [
          1,
          6,
        ],
        [
          1,
          7,
        ],
        [
          1,
          8,
        ],
        [
          10,
          10,
        ],
        [
          10,
          11,
        ],
        [
          10,
          3,
        ],
        [
          10,
          4,
        ],
        [
          10,
          5,
        ],
        [
          10,
          6,
        ],
        [
          10,
          7,
        ],
        [
          10,
          8,
        ],
        [
          10,
          9,
        ],
        [
          11,
          10,
        ],
        [
          11,
          4,
        ],
        [
          11,
          5,
        ],
        [
          11,
          6,
        ],
        [
          11,
          7,
        ],
        [
          11,
          8,
        ],
        [
          11,
          9,
        ],
        [
          12,
          5,
        ],
        [
          12,
          6,
        ],
        [
          12,
          7,
        ],
        [
          12,
          8,
        ],
        [
          12,
          9,
        ],
        [
          13,
          6,
        ],
        [
          13,
          7,
        ],
        [
          13,
          8,
        ],
        [
          14,
          7,
        ],
        [
          2,
          5,
        ],
        [
          2,
          6,
        ],
        [
          2,
          7,
        ],
        [
          2,
          8,
        ],
        [
          2,
          9,
        ],
        [
          3,
          10,
        ],
        [
          3,
          4,
        ],
        [
          3,
          5,
        ],
        [
          3,
          6,
        ],
        [
          3,
          7,
        ],
        [
          3,
          8,
        ],
        [
          3,
          9,
        ],
        [
          4,
          10,
        ],
        [
          4,
          11,
        ],
        [
          4,
          3,
        ],
        [
          4,
          4,
        ],
        [
          4,
          5,
        ],
        [
          4,
          6,
        ],
        [
          4,
          7,
        ],
        [
          4,
          8,
        ],
        [
          4,
          9,
        ],
        [
          5,
          10,
        ],
        [
          5,
          11,
        ],
        [
          5,
          12,
        ],
        [
          5,
          2,
        ],
        [
          5,
          3,
        ],
        [
          5,
          4,
        ],
        [
          5,
          5,
        ],
        [
          5,
          6,
        ],
        [
          5,
          7,
        ],
        [
          5,
          8,
        ],
        [
          5,
          9,
        ],
        [
          6,
          1,
        ],
        [
          6,
          10,
        ],
        [
          6,
          11,
        ],
        [
          6,
          12,
        ],
        [
          6,
          13,
        ],
        [
          6,
          2,
        ],
        [
          6,
          3,
        ],
        [
          6,
          4,
        ],
        [
          6,
          5,
        ],
        [
          6,
          6,
        ],
        [
          6,
          7,
        ],
        [
          6,
          8,
        ],
        [
          6,
          9,
        ],
        [
          7,
          1,
        ],
        [
          7,
          10,
        ],
        [
          7,
          11,
        ],
        [
          7,
          12,
        ],
        [
          7,
          13,
        ],
        [
          7,
          14,
        ],
        [
          7,
          2,
        ],
        [
          7,
          3,
        ],
        [
          7,
          4,
        ],
        [
          7,
          5,
        ],
        [
          7,
          6,
        ],
        [
          7,
          7,
        ],
        [
          7,
          8,
        ],
        [
          7,
          9,
        ],
        [
          8,
          1,
        ],
        [
          8,
          10,
        ],
        [
          8,
          11,
        ],
        [
          8,
          12,
        ],
        [
          8,
          13,
        ],
        [
          8,
          2,
        ],
        [
          8,
          3,
        ],
        [
          8,
          4,
        ],
        [
          8,
          5,
        ],
        [
          8,
          6,
        ],
        [
          8,
          7,
        ],
        [
          8,
          8,
        ],
        [
          8,
          9,
        ],
        [
          9,
          10,
        ],
        [
          9,
          11,
        ],
        [
          9,
          12,
        ],
        [
          9,
          2,
        ],
        [
          9,
          3,
        ],
        [
          9,
          4,
        ],
        [
          9,
          5,
        ],
        [
          9,
          6,
        ],
        [
          9,
          7,
        ],
        [
          9,
          8,
        ],
        [
          9,
          9,
        ],
      ]
    `);
});

test('calculate the moveable radius for multiple units in the same location', () => {
  const skills = new Set([Skill.MovementIncreaseGroundUnitDefenseDecrease]);
  const vecA = vec(11, 7);
  const testMap = startMap.copy({
    teams: updatePlayer(
      startMap.teams,
      startMap.getPlayer(2).copy({
        activeSkills: skills,
        skills,
      }),
    ),
    units: startMap.units.delete(vec(11, 8)).delete(vecA),
  });
  expect(Array.from(moveable(testMap, XFighter.create(1), vecA).keys()).sort())
    .toMatchInlineSnapshot(`
      [
        [
          10,
          10,
        ],
        [
          10,
          3,
        ],
        [
          10,
          4,
        ],
        [
          10,
          5,
        ],
        [
          10,
          6,
        ],
        [
          10,
          7,
        ],
        [
          10,
          8,
        ],
        [
          10,
          9,
        ],
        [
          11,
          10,
        ],
        [
          11,
          8,
        ],
        [
          11,
          9,
        ],
        [
          12,
          10,
        ],
        [
          12,
          4,
        ],
        [
          12,
          5,
        ],
        [
          12,
          6,
        ],
        [
          12,
          7,
        ],
        [
          12,
          8,
        ],
        [
          12,
          9,
        ],
        [
          13,
          10,
        ],
        [
          13,
          4,
        ],
        [
          13,
          6,
        ],
        [
          13,
          8,
        ],
        [
          13,
          9,
        ],
        [
          14,
          5,
        ],
        [
          14,
          6,
        ],
        [
          14,
          7,
        ],
        [
          14,
          8,
        ],
        [
          14,
          9,
        ],
        [
          15,
          6,
        ],
        [
          15,
          8,
        ],
        [
          6,
          7,
        ],
        [
          7,
          6,
        ],
        [
          7,
          7,
        ],
        [
          7,
          8,
        ],
        [
          8,
          5,
        ],
        [
          8,
          6,
        ],
        [
          8,
          7,
        ],
        [
          8,
          8,
        ],
        [
          8,
          9,
        ],
        [
          9,
          10,
        ],
        [
          9,
          4,
        ],
        [
          9,
          6,
        ],
        [
          9,
          7,
        ],
        [
          9,
          8,
        ],
        [
          9,
          9,
        ],
      ]
    `);

  expect(
    Array.from(moveable(testMap, Flamethrower.create(1), vecA).keys()).sort(),
  ).toMatchInlineSnapshot(`
    [
      [
        10,
        6,
      ],
      [
        10,
        7,
      ],
      [
        10,
        8,
      ],
      [
        10,
        9,
      ],
      [
        11,
        10,
      ],
      [
        11,
        8,
      ],
      [
        11,
        9,
      ],
      [
        12,
        5,
      ],
      [
        12,
        6,
      ],
      [
        12,
        7,
      ],
      [
        12,
        8,
      ],
      [
        9,
        7,
      ],
      [
        9,
        8,
      ],
    ]
  `);

  expect(
    Array.from(moveable(testMap, Humvee.create(1), vecA).keys()).sort(),
  ).toMatchInlineSnapshot(`[]`);

  expect(Array.from(moveable(testMap, Humvee.create(2), vecA).keys()).sort())
    .toMatchInlineSnapshot(`
      [
        [
          10,
          5,
        ],
        [
          11,
          2,
        ],
        [
          11,
          3,
        ],
        [
          11,
          4,
        ],
        [
          11,
          5,
        ],
        [
          11,
          6,
        ],
        [
          12,
          2,
        ],
        [
          12,
          3,
        ],
        [
          12,
          4,
        ],
        [
          12,
          6,
        ],
        [
          13,
          3,
        ],
        [
          13,
          4,
        ],
        [
          13,
          5,
        ],
        [
          14,
          4,
        ],
        [
          14,
          5,
        ],
        [
          14,
          6,
        ],
        [
          15,
          4,
        ],
        [
          15,
          5,
        ],
        [
          4,
          5,
        ],
        [
          5,
          5,
        ],
        [
          6,
          4,
        ],
        [
          6,
          5,
        ],
        [
          6,
          6,
        ],
        [
          7,
          5,
        ],
        [
          7,
          6,
        ],
        [
          8,
          4,
        ],
        [
          8,
          5,
        ],
        [
          9,
          3,
        ],
        [
          9,
          4,
        ],
        [
          9,
          5,
        ],
      ]
    `);
});

test('correctly cancels transition costs in the Space biome', () => {
  const vecA = vec(2, 8);
  const unitA = spaceMap.units.get(vecA);

  if (!unitA) {
    throw new Error(`Radius.test: 'unitA' not found at position ${vecA}.`);
  }

  expect(Array.from(moveable(spaceMap, unitA, vecA).keys()).sort())
    .toMatchInlineSnapshot(`
    [
      [
        2,
        7,
      ],
      [
        3,
        5,
      ],
      [
        3,
        6,
      ],
      [
        3,
        7,
      ],
      [
        3,
        8,
      ],
      [
        4,
        7,
      ],
      [
        4,
        8,
      ],
      [
        5,
        7,
      ],
      [
        5,
        8,
      ],
      [
        6,
        8,
      ],
    ]
  `);
});

test('cannot enter or exit a Spaceship without a bridge', () => {
  const vecA = vec(1, 2);
  const vecB = vec(1, 1);
  const unitA = Jetpack.create(1);
  const map = MapData.createMap({
    config: {
      biome: 4,
    },
    map: [
      Space.id,
      Space.id,
      Space.id,
      Path.id,
      Space.id,
      Space.id,
      Space.id,
      Space.id,
      Space.id,
    ],
    size: {
      height: 3,
      width: 3,
    },
  });

  expect(
    Array.from(moveable(map, unitA, vecA).keys()).sort(),
  ).toMatchInlineSnapshot(`[]`);

  expect(moveable(map, unitA, vecB).has(vecA)).toBeFalsy();
});

test('Naval units cannot access bridges unless they are below a Sea tile', () => {
  const map = radiusTestMap.copy({
    buildings: radiusTestMap.buildings.deleteAll(
      radiusTestMap.buildings.keys(),
    ),
    map: [
      6,
      6,
      [6, 16],
      6,
      6,
      6,
      6,
      [10, 16],
      6,
      6,
      6,
      6,
      4,
      [5, 16],
      4,
      6,
      6,
      6,
      5,
      6,
      6,
      6,
      6,
      6,
      6,
    ],
    size: new SizeVector(5, 5),
    units: radiusTestMap.units.deleteAll(radiusTestMap.units.keys()),
  });

  const vecA = vec(4, 2);
  expect(moveable(map, Battleship.create(1), vecA).has(vec(4, 3))).toBeFalsy();
  expect(moveable(map, PatrolShip.create(1), vecA).has(vec(4, 3))).toBeTruthy();
});
