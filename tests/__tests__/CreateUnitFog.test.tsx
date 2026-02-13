import {
  CreateUnitAction,
  EndTurnAction,
} from '@deities/apollo/action-mutators/ActionMutators.tsx';
import { Barracks, HQ } from '@deities/athena/info/Building.tsx';
import { Pioneer } from '@deities/athena/info/Unit.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import { HumanPlayer } from '@deities/athena/map/Player.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { expect, test } from 'vitest';
import executeGameActions from '../executeGameActions.tsx';
import { printGameState } from '../printGameState.tsx';
import { captureGameActionResponse } from '../screenshot.tsx';

const map = withModifiers(
  MapData.createMap({
    buildings: [
      [2, 4, Barracks.create(2).toJSON()],
      [1, 1, HQ.create(1).toJSON()],
      [5, 5, HQ.create(2).toJSON()],
    ],
    config: {
      fog: true,
    },
    map: [
      1,
      1,
      3,
      1,
      3,
      1,
      1,
      1,
      3,
      1,
      [1, 13],
      [3, 13],
      [1, 13],
      1,
      1,
      [3, 13],
      1,
      [3, 13],
      1,
      1,
      2,
      2,
      2,
      1,
      1,
    ],
    size: { height: 5, width: 5 },
    teams: [
      { id: 1, name: '', players: [{ funds: 500, id: 1, userId: '1' }] },
      { id: 2, name: '', players: [{ funds: 500, id: 2, userId: '2' }] },
    ],
    units: [
      [2, 4, { a: [[1, 4]], g: 15, h: 100, i: 12, p: 2 }],
      [2, 1, { g: 40, h: 100, i: 1, p: 1 }],
      [
        4,
        4,
        {
          a: [
            [1, 7],
            [2, 5],
          ],
          g: 50,
          h: 100,
          i: 10,
          p: 1,
        },
      ],
      [
        4,
        1,
        {
          a: [
            [1, 7],
            [2, 5],
          ],
          g: 50,
          h: 100,
          i: 10,
          p: 2,
        },
      ],
    ],
  }),
);
const player1 = HumanPlayer.from(map.getPlayer(1), '1');

test('units on a factory do not disappear when a unit is created and moved into fog', async () => {
  const from = vec(2, 4);
  const to = vec(2, 5);
  const [, gameActionResponse] = await executeGameActions(map, [
    EndTurnAction(),
    CreateUnitAction(from, Pioneer.id, to),
    EndTurnAction(),
  ]);
  const screenshot = await captureGameActionResponse(map, gameActionResponse, player1.userId);
  printGameState('Last State', screenshot);
  expect(screenshot).toMatchImageSnapshot();
});
