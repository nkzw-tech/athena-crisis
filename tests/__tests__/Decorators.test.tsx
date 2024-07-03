import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import { HumanPlayer } from '@deities/athena/map/Player.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { expect, test } from 'vitest';
import { printGameState } from '../printGameState.tsx';
import { captureOne } from '../screenshot.tsx';

const map = withModifiers(
  MapData.createMap({
    config: {
      biome: 5,
      blocklistedBuildings: [],
      blocklistedUnits: [],
      fog: false,
      multiplier: 1,
      objectives: [[0, [0, 0]]],
      seedCapital: 500,
    },
    decorators: [
      [3, 3, 118],
      [10, 3, 25],
      [16, 3, 82],
      [7, 5, 132],
      [3, 7, 131],
      [18, 7, 122],
      [2, 11, 64],
      [11, 11, 21],
      [10, 13, 21],
      [4, 15, 112],
      [7, 15, 26],
      [18, 15, 133],
      [14, 16, 72],
      [3, 18, 121],
      [8, 19, 92],
      [17, 19, 92],
      [5, 20, 105],
      [8, 20, 90],
      [11, 20, 106],
      [17, 20, 87],
    ],
    map: [
      1, 1, 1, 1, 1, 1, 1, 6, 1, 1, 1, 6, 6, 6, 1, 1, 1, 6, 1, 1, 1, 1, 1, 1, 1,
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
            funds: 0,
            id: 1,
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
          },
        ],
      },
    ],
    units: [
      [
        5,
        3,
        {
          g: 40,
          h: 100,
          i: 1,
          p: 1,
        },
      ],
      [
        4,
        2,
        {
          g: 40,
          h: 100,
          i: 1,
          p: 2,
        },
      ],
    ],
  }),
);

test('correctly renders decorators', async () => {
  const screenshot = await captureOne(
    map,
    HumanPlayer.from(map.getPlayer(1), '1').userId,
  );
  printGameState('Decorators', screenshot);
  expect(screenshot).toMatchImageSnapshot();
});
