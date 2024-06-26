import {
  EndTurnAction,
  RescueAction,
} from '@deities/apollo/action-mutators/ActionMutators.tsx';
import { Pioneer } from '@deities/athena/info/Unit.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { expect, test } from 'vitest';
import executeGameActions from '../executeGameActions.tsx';
import snapshotEncodedActionResponse from '../snapshotEncodedActionResponse.tsx';

const map = withModifiers(
  MapData.createMap({
    map: [1, 1, 1, 1, 1, 1, 1, 1, 1],
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
        players: [{ funds: 500, id: 2, userId: '4' }],
      },
    ],
  }),
);

test('rescuing takes two units in one turn or one unit in two turns', async () => {
  const vecA = vec(1, 1);
  const vecB = vec(2, 1);
  const vecC = vec(3, 1);
  const initialMap = map.copy({
    units: map.units
      .set(vecA, Pioneer.create(1))
      .set(vecB, Pioneer.create(0))
      .set(vecC, Pioneer.create(1)),
  });

  const [gameStateA, gameActionResponseA] = executeGameActions(initialMap, [
    RescueAction(vecA, vecB),
    RescueAction(vecC, vecB),
  ]);

  expect(
    snapshotEncodedActionResponse(gameActionResponseA),
  ).toMatchInlineSnapshot(
    `
    "Rescue (1,1 → 2,1) { player: 1, name: null }
    Rescue (3,1 → 2,1) { player: 1, name: -11 }"
  `,
  );

  const lastMapA = gameStateA.at(-1)![1];
  expect(lastMapA.units.get(vecB)!.player).toBe(1);

  const [gameStateB, gameActionResponseB] = executeGameActions(initialMap, [
    RescueAction(vecA, vecB),
    EndTurnAction(),
    EndTurnAction(),
    RescueAction(vecA, vecB),
  ]);

  expect(
    snapshotEncodedActionResponse(gameActionResponseB),
  ).toMatchInlineSnapshot(
    `
    "Rescue (1,1 → 2,1) { player: 1, name: null }
    EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
    EndTurn { current: { funds: 500, player: 2 }, next: { funds: 500, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }
    Rescue (1,1 → 2,1) { player: 1, name: -11 }"
  `,
  );

  const lastMapB = gameStateB.at(-1)![1];
  expect(lastMapB.units.get(vecB)!.player).toBe(1);
});

test('in-progress rescues can be stolen by other players', () => {
  const vecA = vec(1, 1);
  const vecB = vec(2, 1);
  const vecC = vec(3, 1);
  const initialMap = map.copy({
    units: map.units
      .set(vecA, Pioneer.create(1))
      .set(vecB, Pioneer.create(0))
      .set(vecC, Pioneer.create(2)),
  });

  const [gameState, gameActionResponse] = executeGameActions(initialMap, [
    RescueAction(vecA, vecB),
    EndTurnAction(),
    RescueAction(vecC, vecB),
    EndTurnAction(),
    RescueAction(vecA, vecB),
  ]);

  expect(
    snapshotEncodedActionResponse(gameActionResponse),
  ).toMatchInlineSnapshot(
    `
    "Rescue (1,1 → 2,1) { player: 1, name: null }
    EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
    Rescue (3,1 → 2,1) { player: 2, name: null }
    EndTurn { current: { funds: 500, player: 2 }, next: { funds: 500, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }
    Rescue (1,1 → 2,1) { player: 1, name: null }"
  `,
  );

  const firstMap = gameState.at(1)![1];
  const middleMap = gameState.at(3)![1];
  const lastMap = gameState.at(-1)![1];
  expect(firstMap.units.get(vecB)!.isBeingRescuedBy(1)).toBe(true);
  expect(middleMap.units.get(vecB)!.isBeingRescuedBy(2)).toBe(true);
  expect(lastMap.units.get(vecB)!.isBeingRescuedBy(1)).toBe(true);
});
