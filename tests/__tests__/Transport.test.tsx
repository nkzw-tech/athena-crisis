import {
  DropUnitAction,
  EndTurnAction,
  MoveAction,
} from '@deities/apollo/action-mutators/ActionMutators.tsx';
import { Flamethrower, Infantry, Jeep } from '@deities/athena/info/Unit.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { expect, test } from 'vitest';
import executeGameActions from '../executeGameActions.tsx';

const map = withModifiers(
  MapData.createMap({
    config: {
      fog: true,
    },
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
        players: [{ funds: 500, id: 2, name: 'AI' }],
      },
    ],
  }),
);

test('units can be acted on after dropping them after one turn', async () => {
  const fromA = vec(1, 1);
  const fromB = vec(2, 1);
  const toA = vec(3, 1);
  const toB = vec(3, 2);
  const initialMap: MapData | null = map.copy({
    units: map.units
      .set(fromA, Flamethrower.create(1))
      .set(fromB, Jeep.create(1))
      .set(toB, Infantry.create(2)),
  });

  const [gameStateA] = executeGameActions(initialMap, [
    MoveAction(fromA, fromB),
    DropUnitAction(fromB, 0, toA),
  ]);

  const lastMapA = gameStateA.at(-1)![1];
  expect(lastMapA.units.get(toA)!.canMove()).toBe(false);
  expect(lastMapA.units.get(toA)!.isCompleted()).toBe(true);

  const [gameStateB] = executeGameActions(lastMapA, [
    EndTurnAction(),
    EndTurnAction(),
  ]);

  const lastMapB = gameStateB.at(-1)![1];
  expect(lastMapB.units.get(toA)!.canMove()).toBe(true);
  expect(lastMapB.units.get(toA)!.isCompleted()).toBe(false);
});
