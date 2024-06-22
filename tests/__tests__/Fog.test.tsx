import {
  AttackUnitAction,
  CaptureAction,
  EndTurnAction,
  MoveAction,
} from '@deities/apollo/action-mutators/ActionMutators.tsx';
import { House, HQ } from '@deities/athena/info/Building.tsx';
import {
  APU,
  Helicopter,
  Pioneer,
  Sniper,
  TransportHelicopter,
} from '@deities/athena/info/Unit.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import { HumanPlayer } from '@deities/athena/map/Player.tsx';
import Team from '@deities/athena/map/Team.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import ImmutableMap from '@nkzw/immutable-map';
import { expect, test } from 'vitest';
import executeGameActions from '../executeGameActions.tsx';
import { printGameState } from '../printGameState.tsx';
import { captureGameActionResponse } from '../screenshot.tsx';
import snapshotEncodedActionResponse from '../snapshotEncodedActionResponse.tsx';

const map = withModifiers(
  MapData.createMap({
    buildings: [
      [1, 1, { h: 100, i: 1, p: 1 }],
      [5, 5, { h: 100, i: 1, p: 2 }],
    ],
    config: {
      fog: true,
    },
    map: [
      1, 1, 1, 3, 2, 1, 1, 1, 3, 1, 1, 2, 3, 1, 3, 1, 1, 1, 1, 1, 1, 2, 3, 1, 1,
    ],
    size: { height: 5, width: 5 },
    teams: [
      {
        id: 1,
        name: '',
        players: [{ funds: 500, id: 1, userId: '1' }],
      },
      {
        id: 2,
        name: '',
        players: [{ funds: 500, id: 2, userId: '2' }],
      },
    ],
  }),
);
const player1 = HumanPlayer.from(map.getPlayer(1), '1');
const player2 = map.getPlayer(2);

test('units that will be supplied by a hidden adjacent supply unit are not destroyed on the client', async () => {
  const initialMap: MapData | null = map.copy({
    units: map.units
      .set(vec(2, 4), Pioneer.create(player1))
      .set(vec(4, 4), Helicopter.create(player2).setFuel(1))
      .set(vec(5, 4), TransportHelicopter.create(player2).setFuel(10)),
  });
  const [, gameActionResponse] = executeGameActions(initialMap, [
    EndTurnAction(),
    EndTurnAction(),
  ]);
  const screenshot = await captureGameActionResponse(
    initialMap,
    gameActionResponse,
    player1.userId,
  );
  printGameState('Last State', screenshot);
  expect(screenshot).toMatchImageSnapshot();

  expect(snapshotEncodedActionResponse(gameActionResponse))
    .toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: [4,4], miss: false }
      EndTurn { current: { funds: 500, player: 2 }, next: { funds: 500, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }"
    `);

  gameActionResponse[1]!.map(([, , units]) => expect(units).toBeUndefined());
});

test('capturing an opponent HQ will reveal nearby units and buildings', async () => {
  const helicopterVec = vec(1, 3);
  const initialMap = map.copy({
    active: [...map.active, 3],
    buildings: map.buildings
      .set(vec(1, 5), HQ.create(3))
      .set(vec(1, 4), House.create(2)),
    teams: map.teams.set(
      3,
      new Team(
        3,
        '',
        ImmutableMap([
          [
            3,
            new HumanPlayer(
              3,
              'User-6',
              3,
              500,
              undefined,
              new Set(),
              new Set(),
              0,
              null,
              0,
            ),
          ],
        ]),
      ),
    ),
    units: map.units
      .set(helicopterVec, Helicopter.create(3))
      .set(vec(5, 5), Pioneer.create(player1).capture())
      .set(vec(4, 4), Helicopter.create(player2)),
  });
  const [gameState, gameActionResponse] = executeGameActions(initialMap, [
    CaptureAction(vec(5, 5)),
    EndTurnAction(),
    EndTurnAction(),
  ]);
  const actionResponses = gameActionResponse[1]!;
  const screenshot = await captureGameActionResponse(
    initialMap,
    gameActionResponse,
    player1.userId,
  );
  printGameState('Last State', screenshot);
  expect(screenshot).toMatchImageSnapshot();

  expect(snapshotEncodedActionResponse(gameActionResponse))
    .toMatchInlineSnapshot(`
      "Capture (5,5) { building: Barracks { id: 12, health: 100, player: 1 }, player: 2 }
      CaptureGameOver { fromPlayer: 2, toPlayer: 1 }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 3 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      EndTurn { current: { funds: 500, player: 3 }, next: { funds: 600, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }"
    `);

  expect(actionResponses[0][1]).toBeUndefined();
  expect(actionResponses[0][2]).toBeUndefined();

  expect(actionResponses[1][1]).toMatchInlineSnapshot(`
    [
      [
        1,
        5,
        {
          "h": 100,
          "i": 1,
          "p": 3,
        },
      ],
      [
        1,
        4,
        {
          "h": 100,
          "i": 2,
          "p": 1,
        },
      ],
    ]
  `);
  expect(actionResponses[1][2]).toMatchInlineSnapshot(`
    [
      [
        1,
        3,
        {
          "a": [
            [
              1,
              8,
            ],
          ],
          "g": 40,
          "h": 100,
          "i": 9,
          "p": 3,
        },
      ],
    ]
  `);

  for (let i = 2; i < actionResponses.length; i++) {
    expect(actionResponses[i][1]).toBeUndefined();
    expect(actionResponses[i][2]).toBeUndefined();
  }

  expect(gameState.at(-1)![1].units.get(helicopterVec)!.fuel).toBeLessThan(
    initialMap.units.get(helicopterVec)!.fuel,
  );
});

test('neutralizes the opponent HQ when it is no longer visible', async () => {
  const from = vec(4, 5);
  const to = vec(5, 5);
  const initialMap = map.copy({
    units: map.units
      .set(vec(1, 1), Pioneer.create(player1))
      .set(from, Helicopter.create(player2))
      .set(to, Pioneer.create(player1).setHealth(1)),
  });

  const [, gameActionResponse] = executeGameActions(initialMap, [
    EndTurnAction(),
    AttackUnitAction(from, to),
    EndTurnAction(),
  ]);
  const screenshot = await captureGameActionResponse(
    initialMap,
    gameActionResponse,
    player1.userId,
  );
  printGameState('Last State', screenshot);
  expect(screenshot).toMatchImageSnapshot();

  expect(snapshotEncodedActionResponse(gameActionResponse))
    .toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      AttackUnit (4,5 → 5,5) { hasCounterAttack: false, playerA: 2, playerB: 1, unitA: DryUnit { health: 100, ammo: [ [ 1, 7 ] ] }, unitB: null, chargeA: 0, chargeB: 1 }
      EndTurn { current: { funds: 500, player: 2 }, next: { funds: 500, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }"
    `);
});

test('nearby tiles are always visible regardless of vision cost', () => {
  const initialMap: MapData | null = map.copy({
    units: map.units.set(vec(3, 1), Sniper.create(player1)),
  });

  const vision = initialMap.createVisionObject(player1);

  // The mountain next to the Sniper has a higher vision cost than the Sniper has vision.
  // This test verifies that the tile is visible regardless.
  expect(vision.isVisible(initialMap, vec(4, 1))).toBeTruthy();
});

test(`visible radius doesn't wrap around the map`, async () => {
  const initialMap: MapData | null = map.copy({
    units: map.units.set(vec(5, 2), APU.create(player1)),
  });

  const vision = initialMap.createVisionObject(player1);
  expect(vision.isVisible(initialMap, vec(1, 3))).not.toBeTruthy();
});

test(`a unit that gets blocked and issues a 'HiddenMove' action is marked as completed`, async () => {
  const from = vec(4, 4);
  const to = vec(2, 3);
  const initialMap: MapData | null = map.copy({
    units: map.units
      .set(to, Pioneer.create(player1))
      .set(from, Helicopter.create(player2)),
  });
  const [, gameActionResponse] = executeGameActions(initialMap, [
    EndTurnAction(),
    MoveAction(from, to),
  ]);
  const screenshot = await captureGameActionResponse(
    initialMap,
    gameActionResponse,
    player1.userId,
  );

  printGameState('Last State', screenshot);
  expect(screenshot).toMatchImageSnapshot();

  expect(snapshotEncodedActionResponse(gameActionResponse))
    .toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      HiddenMove { path: [4,4 → 3,4 → 2,4], completed: true, fuel: 37, unit: Helicopter { id: 9, health: 100, player: 2, fuel: 39, ammo: [ [ 1, 8 ] ] } }"
    `);
});
