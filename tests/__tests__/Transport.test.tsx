import {
  DropUnitAction,
  EndTurnAction,
  MoveAction,
} from '@deities/apollo/action-mutators/ActionMutators.tsx';
import { Flamethrower, Infantry, Jeep, RocketLauncher } from '@deities/athena/info/Unit.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { expect, test } from 'vitest';
import executeGameActions from '../executeGameActions.tsx';

const map = withModifiers(
  MapData.createMap({
    map: [1, 1, 1, 1, 1, 1, 1, 1, 1],
    size: { height: 3, width: 3 },
    teams: [
      { id: 1, name: '', players: [{ funds: 500, id: 1, userId: '1' }] },
      { id: 2, name: '', players: [{ funds: 500, id: 2, userId: '2' }] },
    ],
  }),
);

test('units can act after dropping them after one turn', async () => {
  const fromA = vec(1, 1);
  const fromB = vec(2, 1);
  const toA = vec(3, 1);
  const toB = vec(3, 2);
  const mapA: MapData | null = map.copy({
    units: map.units
      .set(fromA, Flamethrower.create(1))
      .set(fromB, Jeep.create(1))
      .set(toB, Infantry.create(2)),
  });

  const [gameStateA] = await executeGameActions(mapA, [
    MoveAction(fromA, fromB),
    DropUnitAction(fromB, 0, toA),
  ]);

  const lastMapA = gameStateA.at(-1)![1];
  const unitA = lastMapA.units.get(toA)!;
  expect(unitA.canMove()).toBe(false);
  expect(unitA.isCompleted()).toBe(true);

  const [gameStateB] = await executeGameActions(lastMapA, [EndTurnAction(), EndTurnAction()]);

  const lastMapB = gameStateB.at(-1)![1];
  const unitB = lastMapB.units.get(toA)!;
  expect(unitB.canMove()).toBe(true);
  expect(unitB.isCompleted()).toBe(false);
});

test('units with the HeavyEquipment ability cannot act after being dropped', async () => {
  const fromA = vec(1, 1);
  const fromB = vec(2, 1);
  const toA = vec(3, 1);
  const toB = vec(3, 2);
  const mapA: MapData | null = map.copy({
    units: map.units
      .set(fromA, RocketLauncher.create(1))
      .set(fromB, Jeep.create(1))
      .set(toB, Infantry.create(2)),
  });

  const [gameStateA] = await executeGameActions(mapA, [
    MoveAction(fromA, fromB),
    EndTurnAction(),
    EndTurnAction(),
    DropUnitAction(fromB, 0, toA),
  ]);

  const lastMapA = gameStateA.at(-1)![1];
  const unitA = lastMapA.units.get(toA)!;
  expect(unitA.canMove()).toBe(false);
  expect(unitA.isCompleted()).toBe(true);
});
