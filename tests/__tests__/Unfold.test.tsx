import {
  AttackUnitAction,
  EndTurnAction,
  FoldAction,
  UnfoldAction,
} from '@deities/apollo/action-mutators/ActionMutators.tsx';
import { Helicopter, Sniper } from '@deities/athena/info/Unit.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import { HumanPlayer } from '@deities/athena/map/Player.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { expect, test } from 'vitest';
import executeGameActions from '../executeGameActions.tsx';
import { printGameState } from '../printGameState.tsx';
import { captureGameState, captureOne } from '../screenshot.tsx';
import snapshotEncodedActionResponse from '../snapshotEncodedActionResponse.tsx';

const map = withModifiers(
  MapData.createMap({
    buildings: [
      [1, 1, { h: 100, i: 1, p: 1 }],
      [2, 3, { h: 100, i: 1, p: 2 }],
    ],
    config: {
      fog: true,
    },
    map: [1, 1, 2, 1, 3, 1, 2, 1, 3],
    size: { height: 3, width: 3 },
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

test('unit can unfold and can change style', async () => {
  const from = vec(1, 1);
  const to = vec(3, 2);
  const initialMap: MapData | null = map.copy({
    units: map.units
      .set(from, Sniper.create(player1))
      .set(to, Helicopter.create(player2)),
  });

  expect(
    initialMap.units.get(from)?.canAttackAt(from.distance(to), player1),
  ).toBe(false);

  const [gameState, gameActionResponse] = await executeGameActions(initialMap, [
    UnfoldAction(from),
    EndTurnAction(),
    EndTurnAction(),
    AttackUnitAction(from, to),
    EndTurnAction(),
    EndTurnAction(),
    FoldAction(from),
  ]);

  const initialState = await captureOne(initialMap, player1.userId);
  printGameState('Base State', initialState);
  expect(initialState).toMatchImageSnapshot();

  // Ignore end turn actions.
  (
    await captureGameState(
      gameState.filter(([actionResponse]) => actionResponse.type !== 'EndTurn'),
      player1.userId,
    )
  ).forEach(([actionResponse, , screenshot]) => {
    printGameState(actionResponse, screenshot);
    expect(screenshot).toMatchImageSnapshot();
  });

  expect(snapshotEncodedActionResponse(gameActionResponse))
    .toMatchInlineSnapshot(`
      "Unfold (1,1)
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      EndTurn { current: { funds: 500, player: 2 }, next: { funds: 500, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }
      AttackUnit (1,1 → 3,2) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 100, ammo: [ [ 1, 6 ] ] }, unitB: DryUnit { health: 16, ammo: [ [ 1, 8 ] ] }, chargeA: 83, chargeB: 252 }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 2, rotatePlayers: false, supply: null, miss: false }
      EndTurn { current: { funds: 500, player: 2 }, next: { funds: 500, player: 1 }, round: 3, rotatePlayers: false, supply: null, miss: false }
      Fold (1,1)"
    `);
});
