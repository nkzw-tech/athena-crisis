import CharacterMessage from '@deities/apollo/CharacterMessage.tsx';
import { EffectList, EffectTrigger } from '@deities/apollo/Effects.tsx';
import { MapMetadata } from '@deities/apollo/MapMetadata.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import MapData from '@deities/athena/MapData.tsx';

export const metadata: MapMetadata = {
  effects: new Map<EffectTrigger, EffectList>([
    [
      'GameEnd',
      new Set([
        {
          actions: [
            CharacterMessage(1, 'Phew, that was a close call.', 'self'),
            CharacterMessage(
              5,
              "All troops retreat. We'll be back soon enough!",
              'opponent',
              2,
            ),
            CharacterMessage(
              1,
              'Wait, who are you?? Why are you doing this?',
              'self',
              1,
            ),
            CharacterMessage(2, 'They are gone kid…', 'self'),
            CharacterMessage(
              15,
              "We need to find {14.name}. She'll know what's up.",
              'self',
            ),
          ],
          conditions: [{ type: 'GameEnd', value: 'win' }],
        },
      ]),
    ],
    [
      'Start',
      new Set([
        {
          actions: [
            CharacterMessage(
              1,
              'Finally back to HQ. How is it possible that we are being overrun by enemies from all sides?',
              'self',
              1,
            ),
            CharacterMessage(
              2,
              "Something's up. Battle first, talk later.",
              'self',
            ),
            CharacterMessage(
              5,
              'All your base are belong to us!',
              'opponent',
              1,
            ),
            CharacterMessage(
              2,
              "I wouldn't be so sure of that. {15.name}, a little help?",
              'self',
              2,
            ),
            CharacterMessage(
              15,
              "They invaded us close to our base. We have to protect our buildings or we won't be able to hire reinforcements.",
              'self',
            ),
          ],
        },
      ]),
    ],
  ]),
  name: 'They are Close to Home',
  tags: ['hard', '2', 'campaign'],
  teamPlay: false,
};

export default withModifiers(
  MapData.createMap({
    buildings: [
      [
        15,
        8,
        {
          h: 100,
          i: 1,
          p: 1,
        },
      ],
      [
        12,
        3,
        {
          h: 100,
          i: 3,
          p: 2,
        },
      ],
      [
        14,
        5,
        {
          h: 100,
          i: 3,
          p: 1,
        },
      ],
      [
        15,
        1,
        {
          h: 100,
          i: 1,
          p: 2,
        },
      ],
      [
        11,
        2,
        {
          h: 100,
          i: 2,
          p: 2,
        },
      ],
      [
        10,
        9,
        {
          h: 100,
          i: 2,
          p: 1,
        },
      ],
    ],
    config: {
      biome: 0,
      blocklistedBuildings: [10, 11, 16, 17],
      blocklistedSkills: [],
      blocklistedUnits: [
        4, 8, 11, 12, 14, 16, 26, 27, 28, 29, 30, 31, 32, 33, 37,
      ],
      fog: false,
      multiplier: 1,
      objectives: [[0, [0, 0, null]]],
      performance: [3, 5, [0, 2]],
      seedCapital: 1000,
    },
    decorators: [
      [34, 15, 61],
      [66, 15, 98],
      [36, 16, 52],
      [63, 16, 70],
      [7, 26, 141],
      [22, 27, 92],
      [22, 28, 90],
      [9, 29, 143],
      [7, 31, 166],
      [9, 32, 144],
      [7, 33, 140],
      [22, 33, 84],
      [8, 35, 143],
      [26, 36, 84],
      [29, 39, 84],
      [49, 40, 47],
    ],
    map: [
      6,
      6,
      6,
      6,
      6,
      6,
      [6, 14],
      2,
      3,
      5,
      3,
      3,
      1,
      3,
      1,
      1,
      3,
      6,
      6,
      21,
      21,
      21,
      6,
      6,
      6,
      [6, 36],
      6,
      6,
      6,
      10,
      2,
      5,
      8,
      1,
      3,
      3,
      3,
      1,
      2,
      1,
      6,
      6,
      [6, 36],
      21,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      2,
      5,
      2,
      8,
      2,
      3,
      3,
      2,
      3,
      2,
      1,
      6,
      6,
      21,
      6,
      [6, 36],
      6,
      6,
      3,
      2,
      3,
      1,
      2,
      5,
      2,
      1,
      4,
      4,
      4,
      2,
      1,
      3,
      3,
      6,
      6,
      21,
      6,
      6,
      6,
      10,
      4,
      4,
      4,
      4,
      4,
      [5, 16],
      4,
      4,
      4,
      8,
      4,
      4,
      4,
      4,
      4,
      6,
      6,
      21,
      6,
      6,
      6,
      10,
      12,
      12,
      12,
      2,
      1,
      5,
      1,
      2,
      3,
      4,
      4,
      3,
      1,
      2,
      10,
      6,
      21,
      21,
      6,
      6,
      6,
      10,
      1,
      1,
      12,
      1,
      3,
      5,
      5,
      3,
      1,
      4,
      1,
      6,
      6,
      6,
      6,
      6,
      21,
      21,
      10,
      6,
      6,
      10,
      12,
      1,
      12,
      3,
      2,
      1,
      5,
      5,
      1,
      4,
      1,
      10,
      10,
      10,
      6,
      6,
      21,
      21,
      12,
      10,
      6,
      6,
      12,
      1,
      1,
      3,
      3,
      8,
      2,
      5,
      1,
      4,
      2,
      1,
      1,
      3,
      6,
      21,
      21,
      21,
      12,
      12,
      10,
      6,
      12,
      12,
      12,
      1,
      2,
      2,
      4,
      [5, 16],
      4,
      4,
      10,
      10,
      10,
      10,
      6,
      21,
      21,
      21,
    ],
    size: {
      height: 10,
      width: 22,
    },
    teams: [
      {
        id: 1,
        name: '',
        players: [
          {
            funds: 0,
            id: 1,
            skills: [],
          },
        ],
      },
      {
        id: 2,
        name: '',
        players: [
          {
            funds: 0,
            id: 2,
            skills: [2],
          },
        ],
      },
    ],
    units: [
      [
        17,
        9,
        {
          g: 60,
          h: 100,
          i: 6,
          p: 1,
        },
      ],
      [
        8,
        6,
        {
          a: [[1, 7]],
          g: 40,
          h: 100,
          i: 7,
          p: 1,
          u: 1,
        },
      ],
      [
        11,
        4,
        {
          a: [[1, 7]],
          g: 40,
          h: 100,
          i: 7,
          p: 2,
        },
      ],
      [
        11,
        5,
        {
          a: [[1, 6]],
          g: 40,
          h: 100,
          i: 4,
          p: 2,
        },
      ],
      [
        11,
        6,
        {
          a: [[1, 7]],
          g: 30,
          h: 100,
          i: 5,
          p: 2,
        },
      ],
      [
        7,
        4,
        {
          a: [[1, 4]],
          g: 40,
          h: 100,
          i: 3,
          p: 1,
        },
      ],
      [
        10,
        9,
        {
          a: [[1, 4]],
          g: 40,
          h: 100,
          i: 3,
          p: 1,
        },
      ],
      [
        9,
        5,
        {
          a: [[1, 7]],
          g: 30,
          h: 100,
          i: 5,
          p: 2,
        },
      ],
      [
        9,
        6,
        {
          a: [[1, 4]],
          g: 30,
          h: 100,
          i: 15,
          p: 1,
        },
      ],
      [
        13,
        5,
        {
          a: [[1, 4]],
          g: 40,
          h: 100,
          i: 3,
          p: 2,
        },
      ],
      [
        15,
        7,
        {
          g: 50,
          h: 100,
          i: 2,
          p: 2,
        },
      ],
      [
        15,
        8,
        {
          g: 50,
          h: 100,
          i: 2,
          p: 1,
        },
      ],
      [
        17,
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
        12,
        3,
        {
          g: 50,
          h: 100,
          i: 2,
          p: 2,
        },
      ],
      [
        13,
        7,
        {
          a: [[1, 7]],
          g: 40,
          h: 100,
          i: 7,
          p: 2,
        },
      ],
      [
        8,
        1,
        {
          g: 40,
          h: 100,
          i: 1,
          p: 1,
        },
      ],
      [
        12,
        5,
        {
          a: [[1, 7]],
          g: 30,
          h: 100,
          i: 5,
          p: 1,
        },
      ],
    ],
  }),
);
