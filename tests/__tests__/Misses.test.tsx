import {
  AttackUnitAction,
  EndTurnAction,
} from '@deities/apollo/action-mutators/ActionMutators.tsx';
import timeoutActionResponseMutator from '@deities/apollo/lib/timeoutActionResponseMutator.tsx';
import { Pioneer, SmallTank } from '@deities/athena/info/Unit.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import { HumanPlayer } from '@deities/athena/map/Player.tsx';
import Team from '@deities/athena/map/Team.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import ImmutableMap from '@nkzw/immutable-map';
import { expect, test } from 'vitest';
import executeGameActions from '../executeGameActions.tsx';
import snapshotEncodedActionResponse from '../snapshotEncodedActionResponse.tsx';

const map = withModifiers(
  MapData.createMap({
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
        players: [{ funds: 500, id: 2, userId: '4' }],
      },
    ],
  }),
);
const player1 = HumanPlayer.from(map.getPlayer(1), '1');

test('lose the game when missing two turns in a row', async () => {
  const vecA = vec(1, 1);
  const vecB = vec(2, 1);
  const initialMap = map.copy({
    units: map.units
      .set(vecA, SmallTank.create(player1))
      .set(vecB, Pioneer.create(2)),
  });

  const [, gameActionResponse] = executeGameActions(
    initialMap,
    [EndTurnAction(), EndTurnAction(), EndTurnAction()],
    undefined,
    timeoutActionResponseMutator,
  );

  expect(snapshotEncodedActionResponse(gameActionResponse))
    .toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: true }
      EndTurn { current: { funds: 500, player: 2 }, next: { funds: 500, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: true }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 2, rotatePlayers: false, supply: null, miss: true }
      PreviousTurnGameOver { fromPlayer: 1 }
      GameEnd { objective: null, objectiveId: null, toPlayer: 2 }"
    `);
});

test('misses reset when taking any action', async () => {
  const vecA = vec(1, 1);
  const vecB = vec(2, 1);
  const initialMap = map.copy({
    units: map.units
      .set(vecA, SmallTank.create(player1))
      .set(vecB, Pioneer.create(2)),
  });

  const [, gameActionResponse] = executeGameActions(
    initialMap,
    [
      EndTurnAction(),
      EndTurnAction(),
      AttackUnitAction(vecA, vecB),
      EndTurnAction(),
      EndTurnAction(),
    ],
    undefined,
    timeoutActionResponseMutator,
  );

  expect(snapshotEncodedActionResponse(gameActionResponse))
    .toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: true }
      EndTurn { current: { funds: 500, player: 2 }, next: { funds: 500, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: true }
      AttackUnit (1,1 → 2,1) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 6 ] ] }, unitB: DryUnit { health: 45 }, chargeA: 18, chargeB: 55 }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 2, rotatePlayers: false, supply: null, miss: true }
      EndTurn { current: { funds: 500, player: 2 }, next: { funds: 500, player: 1 }, round: 3, rotatePlayers: false, supply: null, miss: true }
      PreviousTurnGameOver { fromPlayer: 2 }
      GameEnd { objective: null, objectiveId: null, toPlayer: 1 }"
    `);
});

test('lose the game, but continue when missing two turns in a row with multiple players', async () => {
  const vecA = vec(1, 1);
  const vecB = vec(2, 1);
  const vecC = vec(3, 3);
  const initialMap = map.copy({
    active: [...map.active, 3],
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
              '3',
              3,
              300,
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
      .set(vecA, SmallTank.create(player1))
      .set(vecB, Pioneer.create(2))
      .set(vecC, Pioneer.create(3)),
  });

  const [, gameActionResponse] = executeGameActions(
    initialMap,
    [
      EndTurnAction(),
      EndTurnAction(),
      EndTurnAction(),
      EndTurnAction(),
      EndTurnAction(),
    ],
    undefined,
    timeoutActionResponseMutator,
  );

  expect(snapshotEncodedActionResponse(gameActionResponse))
    .toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: true }
      EndTurn { current: { funds: 500, player: 2 }, next: { funds: 300, player: 3 }, round: 1, rotatePlayers: false, supply: null, miss: true }
      EndTurn { current: { funds: 300, player: 3 }, next: { funds: 500, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: true }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 2, rotatePlayers: false, supply: null, miss: true }
      PreviousTurnGameOver { fromPlayer: 1 }
      EndTurn { current: { funds: 500, player: 2 }, next: { funds: 300, player: 3 }, round: 2, rotatePlayers: false, supply: null, miss: true }
      PreviousTurnGameOver { fromPlayer: 2 }
      GameEnd { objective: null, objectiveId: null, toPlayer: 3 }"
    `);
});
