import { ToggleLightningAction } from '@deities/apollo/action-mutators/ActionMutators.tsx';
import { RadarStation } from '@deities/athena/info/Building.tsx';
import { Lightning, StormCloud } from '@deities/athena/info/Tile.tsx';
import { Helicopter, Pioneer } from '@deities/athena/info/Unit.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import { Charge } from '@deities/athena/map/Configuration.tsx';
import { HumanPlayer } from '@deities/athena/map/Player.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import stripAnsi from 'strip-ansi';
import { expect, test } from 'vitest';
import executeGameActions from '../executeGameActions.tsx';
import { printGameState } from '../printGameState.tsx';
import { captureGameState, captureOne } from '../screenshot.tsx';
import snapshotEncodedActionResponse from '../snapshotEncodedActionResponse.tsx';

const map = withModifiers(
  MapData.createMap({
    config: {
      fog: true,
    },
    map: [
      1,
      1,
      [1, StormCloud.id],
      1,
      1,
      1,
      1,
      [1, Lightning.id],
      1,
      1,
      [1, StormCloud.id],
      1,
      [1, StormCloud.id],
      1,
      [1, StormCloud.id],
      1,
      1,
      [1, Lightning.id],
      1,
      1,
      1,
      1,
      [1, StormCloud.id],
      1,
      1,
    ],
    size: { height: 5, width: 5 },
    teams: [
      {
        id: 1,
        name: '',
        players: [{ charge: Charge * 4, funds: 500, id: 1, userId: '1' }],
      },
      {
        id: 2,
        name: '',
        players: [{ funds: 500, id: 2, name: 'AI' }],
      },
    ],
  }),
);
const player1 = HumanPlayer.from(map.getPlayer(1), '1');
const player2 = map.getPlayer(2);

test('can turn lightning barriers on and off', async () => {
  const fromA = vec(1, 1);
  const fromB = vec(1, 2);
  const toA = vec(3, 2);
  const toB = vec(2, 3);
  const toC = vec(4, 3);
  const initialMap: MapData | null = map.copy({
    buildings: map.buildings
      .set(fromA, RadarStation.create(player1))
      .set(fromB, RadarStation.create(player1)),
    units: map.units
      .set(toB, Pioneer.create(player1))
      .set(toC, Helicopter.create(player2)),
  });

  expect(() => {
    try {
      executeGameActions(initialMap, [ToggleLightningAction(fromA, toB)]);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(stripAnsi(error.message));
      }
    }
  }).toThrowErrorMatchingInlineSnapshot(
    `[Error: executeGameActions: Failed to execute action \`ToggleLightning (1,1 → 2,3)\`.]`,
  );

  const [gameState, gameActionResponse] = executeGameActions(initialMap, [
    ToggleLightningAction(fromB, toA),
    ToggleLightningAction(fromA, toC),
  ]);

  const initialState = await captureOne(initialMap, player1.userId);
  printGameState('Base State', initialState);
  expect(initialState).toMatchImageSnapshot();

  for (const [actionResponse, , screenshot] of await captureGameState(
    gameState,
    player1.userId,
  )) {
    printGameState(actionResponse, screenshot);
    expect(screenshot).toMatchImageSnapshot();
  }

  expect(snapshotEncodedActionResponse(gameActionResponse))
    .toMatchInlineSnapshot(`
      "ToggleLightning (1,2 → 3,2)
      ToggleLightning (1,1 → 4,3)
      AttackUnitGameOver { fromPlayer: 2, toPlayer: 1 }
      GameEnd { objective: null, objectiveId: null, toPlayer: 1 }"
    `);

  expect(initialMap.getPlayer(player1.id).charge).toBeGreaterThan(
    gameState.at(-1)![1].getPlayer(player1.id).charge,
  );
});
