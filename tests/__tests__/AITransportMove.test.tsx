import { EndTurnAction } from '@deities/apollo/action-mutators/ActionMutators.tsx';
import executeGameAction from '@deities/apollo/actions/executeGameAction.tsx';
import { Beach, Sea } from '@deities/athena/info/Tile.tsx';
import {
  Bomber,
  HeavyTank,
  Hovercraft,
  SmallTank,
} from '@deities/athena/info/Unit.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import { HumanPlayer } from '@deities/athena/map/Player.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import AIRegistry from '@deities/dionysus/AIRegistry.tsx';
import { expect, test } from 'vitest';
import executeGameActions from '../executeGameActions.tsx';
import { printGameState } from '../printGameState.tsx';
import { captureOne } from '../screenshot.tsx';
import snapshotEncodedActionResponse from '../snapshotEncodedActionResponse.tsx';
import snapshotGameState from '../snapshotGameState.tsx';

const map = withModifiers(
  withModifiers(
    MapData.createMap({
      buildings: [
        [
          1,
          4,
          {
            h: 100,
            i: 2,
            p: 1,
          },
        ],
      ],
      map: [
        1, 10, 6, 6, 6, 6, 6, 1, 1, 6, 6, 6, 6, 6, 1, 1, 6, 6, 6, 6, 6, 8, 1, 6,
        6, 6, 10, 1, 1, 1, 6, 6, 6, 6, 1, 1, 1, 6, 6, 6, 6, 6,
      ],
      size: {
        height: 6,
        width: 7,
      },
      teams: [
        { id: 1, name: '', players: [{ funds: 0, id: 1, userId: '1' }] },
        { id: 2, name: '', players: [{ funds: 0, id: 2, name: 'Bot' }] },
      ],
      units: [
        [
          6,
          4,
          {
            g: 60,
            h: 100,
            i: 30,
            p: 2,
          },
        ],
        [
          1,
          6,
          {
            g: 40,
            h: 100,
            i: 1,
            n: -15,
            p: 1,
          },
        ],
        [
          6,
          1,
          {
            a: [[1, 5]],
            g: 30,
            h: 100,
            i: 33,
            p: 1,
          },
        ],
        [
          7,
          4,
          {
            g: 50,
            h: 100,
            i: 2,
            p: 2,
          },
        ],
      ],
    }),
  ),
);
const player1 = HumanPlayer.from(map.getPlayer(1), '1');

test('AI will hop between islands if necessary', async () => {
  const S = Sea.id;
  const B = Beach.id;
  const initialMap = MapData.createMap({
    config: {
      fog: true,
    },
    map: [
      1,
      B,
      S,
      B,
      1,
      1,
      B,
      S,
      B,
      1,
      1,
      B,
      S,
      B,
      1,
      1,
      B,
      S,
      B,
      1,
      1,
      B,
      S,
      B,
      1,
    ],
    size: {
      height: 5,
      width: 5,
    },
    teams: [
      {
        id: 1,
        name: '',
        players: [{ funds: 0, id: 1, userId: 'User-1' }],
      },
      {
        id: 2,
        name: '',
        players: [{ funds: 1000, id: 2, name: 'Bot' }],
      },
    ],
  });

  const vecA = vec(1, 1);
  const vecB = vec(4, 5);
  const vecC = vec(5, 5);
  const map = withModifiers(
    initialMap.copy({
      config: initialMap.config.copy({ fog: false }),
      units: initialMap.units
        .set(vecA, SmallTank.create(1))
        .set(vecB, Hovercraft.create(2))
        .set(vecC, HeavyTank.create(2)),
    }),
  );

  const execute = async (map: MapData) =>
    (
      await executeGameAction(
        map,
        map.createVisionObject(player1),
        new Map(),
        EndTurnAction(),
        AIRegistry,
      )
    )[2];

  const gameState = await execute(map);

  expect(snapshotGameState(gameState)).toMatchInlineSnapshot(`
    "Move (5,5 → 4,5) { fuel: 24, completed: null, path: [4,5] }
    Move (4,5 → 2,2) { fuel: 54, completed: null, path: [4,4 → 3,4 → 3,3 → 3,2 → 2,2] }
    DropUnit (2,2 → 2,1) { index: 0 }
    EndTurn { current: { funds: 1000, player: 2 }, next: { funds: 0, player: 1 }, round: 2, rotatePlayers: null, supply: null, miss: null }"
  `);

  const secondGameState = await execute(gameState!.at(-1)![1]);
  expect(snapshotGameState(secondGameState)).toMatchInlineSnapshot(`
    "AttackUnit (2,1 → 1,1) { hasCounterAttack: true, playerA: 2, playerB: 1, unitA: DryUnit { health: 95, ammo: [ [ 1, 9 ] ] }, unitB: DryUnit { health: 25, ammo: [ [ 1, 6 ] ] }, chargeA: 122, chargeB: 281 }
    CompleteUnit (2,2)
    EndTurn { current: { funds: 1000, player: 2 }, next: { funds: 0, player: 1 }, round: 3, rotatePlayers: null, supply: null, miss: null }"
  `);

  // Now try with fog:
  const fogGameState = await execute(
    map.copy({ config: map.config.copy({ fog: true }) }),
  );

  expect(snapshotGameState(fogGameState)).toMatchInlineSnapshot(`
    "Move (5,5 → 4,5) { fuel: 24, completed: null, path: [4,5] }
    Move (4,5 → 2,2) { fuel: 54, completed: null, path: [4,4 → 3,4 → 3,3 → 3,2 → 2,2] }
    DropUnit (2,2 → 2,1) { index: 0 }
    EndTurn { current: { funds: 1000, player: 2 }, next: { funds: 0, player: 1 }, round: 2, rotatePlayers: null, supply: null, miss: null }"
  `);

  const secondFogGameState = await execute(fogGameState!.at(-1)![1]);
  expect(snapshotGameState(secondFogGameState)).toMatchInlineSnapshot(`
    "AttackUnit (2,1 → 1,1) { hasCounterAttack: true, playerA: 2, playerB: 1, unitA: DryUnit { health: 95, ammo: [ [ 1, 9 ] ] }, unitB: DryUnit { health: 25, ammo: [ [ 1, 6 ] ] }, chargeA: 122, chargeB: 281 }
    CompleteUnit (2,2)
    EndTurn { current: { funds: 1000, player: 2 }, next: { funds: 0, player: 1 }, round: 3, rotatePlayers: null, supply: null, miss: null }"
  `);

  const screenshot = await captureOne(gameState!.at(-1)![1], 'User-1');
  printGameState('Last State', screenshot);
  expect(screenshot).toMatchImageSnapshot();
});

test('transporters do not stick to opposing naval units when loaded with other units', async () => {
  const [gameState, gameActionResponse] = await executeGameActions(map, [
    EndTurnAction(),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponse))
    .toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 0, player: 1 }, next: { funds: 0, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      Move (7,4 → 6,4) { fuel: 49, completed: false, path: [6,4] }
      Move (6,4 → 2,1) { fuel: 52, completed: false, path: [5,4 → 4,4 → 4,3 → 3,3 → 3,2 → 3,1 → 2,1] }
      DropUnit (2,1 → 2,2) { index: 0 }
      EndTurn { current: { funds: 0, player: 2 }, next: { funds: 100, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }"
    `);

  const screenshot = await captureOne(gameState.at(-1)![1], player1.userId);
  printGameState('Last State', screenshot);
  expect(screenshot).toMatchImageSnapshot();
});

test('transporters do not stick to opposing air units on sea when loaded with other units', async () => {
  const v1 = vec(4, 3);
  const v2 = vec(4, 4);
  const v3 = vec(4, 5);
  const mapA = map.copy({
    units: map.units
      .set(v1, Bomber.create(1))
      .set(v2, Bomber.create(1))
      .set(v3, Bomber.create(1)),
  });

  const [gameState, gameActionResponse] = await executeGameActions(mapA, [
    EndTurnAction(),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponse))
    .toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 0, player: 1 }, next: { funds: 0, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      Move (7,4 → 6,4) { fuel: 49, completed: false, path: [6,4] }
      Move (6,4 → 2,1) { fuel: 52, completed: false, path: [6,3 → 5,3 → 5,2 → 4,2 → 4,1 → 3,1 → 2,1] }
      DropUnit (2,1 → 2,2) { index: 0 }
      EndTurn { current: { funds: 0, player: 2 }, next: { funds: 100, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }"
    `);

  const screenshot = await captureOne(gameState.at(-1)![1], player1.userId);
  printGameState('Last State', screenshot);
  expect(screenshot).toMatchImageSnapshot();
});
