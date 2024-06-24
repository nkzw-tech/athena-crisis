import {
  CreateBuildingAction,
  EndTurnAction,
} from '@deities/apollo/action-mutators/ActionMutators.tsx';
import { Factory, House } from '@deities/athena/info/Building.tsx';
import { StormCloud } from '@deities/athena/info/Tile.tsx';
import { Infantry, Pioneer } from '@deities/athena/info/Unit.tsx';
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
    config: {
      fog: true,
    },
    map: [
      8,
      1,
      3,
      [1, StormCloud.id],
      1,
      1,
      1,
      1,
      3,
      [1, StormCloud.id],
      1,
      3,
      1,
      1,
      1,
      3,
      1,
      3,
      1,
      1,
      2,
      2,
      2,
      8,
      8,
    ],
    size: { height: 5, width: 5 },
    teams: [
      { id: 1, name: '', players: [{ funds: 500, id: 1, userId: '1' }] },
      { id: 2, name: '', players: [{ funds: 500, id: 2, userId: '2' }] },
    ],
    units: [
      [1, 1, Pioneer.create(1).toJSON()],
      [5, 1, Infantry.create(1).toJSON()],
      [5, 5, Pioneer.create(2).toJSON()],
      [4, 5, Pioneer.create(2).toJSON()],
    ],
  }),
);
const player1 = HumanPlayer.from(map.getPlayer(1), '1');

test('buildings appear properly when they are created in fog', async () => {
  const [, gameActionResponse] = executeGameActions(map, [
    CreateBuildingAction(vec(1, 1), House.id),
    EndTurnAction(),
    CreateBuildingAction(vec(5, 5), Factory.id),
    CreateBuildingAction(vec(4, 5), House.id),
    EndTurnAction(),
  ]);
  const screenshot = await captureGameActionResponse(
    map,
    gameActionResponse,
    player1.userId,
  );
  printGameState('Last State', screenshot);
  expect(screenshot).toMatchImageSnapshot();
});
