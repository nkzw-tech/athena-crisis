import { stripVTControlCharacters } from 'node:util';
import { ToggleLightningAction } from '@deities/apollo/action-mutators/ActionMutators.tsx';
import { RadarStation } from '@deities/athena/info/Building.tsx';
import { Lightning, StormCloud } from '@deities/athena/info/Tile.tsx';
import { Helicopter, Pioneer } from '@deities/athena/info/Unit.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import { Charge } from '@deities/athena/map/Configuration.tsx';
import { HumanPlayer } from '@deities/athena/map/Player.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { expect, test } from 'vitest';
import executeGameActions from '../executeGameActions.tsx';
import { printGameState } from '../printGameState.tsx';
import { captureGameState, captureOne } from '../screenshot.tsx';
import snapshotEncodedActionResponse from '../snapshotEncodedActionResponse.tsx';

const toError = (error: Error) =>
  new Error(stripVTControlCharacters(error.message));

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

  const errorA = await executeGameActions(initialMap, [
    ToggleLightningAction(fromA, toB),
  ]).catch(toError);

  expect(errorA instanceof Error ? errorA.message : '').toMatchInlineSnapshot(
    `"executeGameActions: Failed to execute action \`ToggleLightning (1,1 → 2,3)\`."`,
  );

  const [gameState, gameActionResponse] = await executeGameActions(initialMap, [
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
      ToggleLightning (1,1 → 4,3) { player: null, unit: Helicopter { id: 9, health: 100, player: 2, fuel: 40, ammo: [ [ 1, 8 ] ] } }
      AttackUnitGameOver { fromPlayer: 2, toPlayer: 1 }
      GameEnd { objective: null, objectiveId: null, toPlayer: 1, chaosStars: null }"
    `);

  expect(initialMap.getPlayer(player1.id).charge).toBeGreaterThan(
    gameState.at(-1)![1].getPlayer(player1.id).charge,
  );
});

test('cannot turn lightning barriers on when self or team units are on the field', async () => {
  const from = vec(1, 1);
  const to = vec(2, 3);
  const teamA = map.getTeam(1);
  const mapA: MapData | null = map.copy({
    buildings: map.buildings.set(from, RadarStation.create(1)),
    units: map.units.set(to, Pioneer.create(1)),
  });

  const errorA = await executeGameActions(mapA, [
    ToggleLightningAction(from, to),
  ]).catch(toError);

  expect(errorA instanceof Error ? errorA.message : '').toMatchInlineSnapshot(
    `"executeGameActions: Failed to execute action \`ToggleLightning (1,1 → 2,3)\`."`,
  );

  const mapB: MapData | null = mapA.copy({
    teams: mapA.teams.set(
      1,
      teamA.copy({
        players: teamA.players.set(
          3,
          new HumanPlayer(
            3,
            '3',
            1,
            300,
            undefined,
            new Set(),
            new Set(),
            0,
            null,
            0,
            null,
            null,
          ),
        ),
      }),
    ),
    units: mapA.units.set(to, Pioneer.create(3)),
  });

  const errorB = await executeGameActions(mapB, [
    ToggleLightningAction(from, to),
  ]).catch(toError);

  expect(errorB instanceof Error ? errorB.message : '').toMatchInlineSnapshot(
    `"executeGameActions: Failed to execute action \`ToggleLightning (1,1 → 2,3)\`."`,
  );
});
