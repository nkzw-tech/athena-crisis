import { House } from '@deities/athena/info/Building.tsx';
import { APU, HeavyTank, Pioneer } from '@deities/athena/info/Unit.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import { HumanPlayer } from '@deities/athena/map/Player.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { expect, test } from 'vitest';
import { AttackBuildingAction } from '../action-mutators/ActionMutators.tsx';
import { execute } from '../Action.tsx';

const map = withModifiers(
  MapData.createMap({
    buildings: [
      [1, 1, House.create(2).toJSON()],
      [5, 5, House.create(2).toJSON()],
    ],
    map: [8, 1, 3, 1, 3, 1, 1, 1, 3, 1, 1, 3, 1, 1, 1, 3, 1, 3, 1, 1, 2, 2, 2, 8, 8],
    size: { height: 5, width: 5 },
    teams: [
      { id: 1, name: '', players: [{ funds: 500, id: 1, userId: '1' }] },
      { id: 2, name: '', players: [{ funds: 500, id: 2, name: 'AI' }] },
    ],
    units: [
      [1, 1, Pioneer.create(2).toJSON()],
      [2, 1, HeavyTank.create(1).toJSON()],
      [1, 2, HeavyTank.create(1).toJSON()],
      [5, 5, APU.create(2).toJSON()],
      [4, 5, HeavyTank.create(1).toJSON()],
      [5, 4, HeavyTank.create(1).toJSON()],
    ],
  }),
);
const player1 = HumanPlayer.from(map.getPlayer(1), '1');

test('units do not disappear when a building is attacked and there is no counter attack', async () => {
  const to = vec(1, 1);
  const vision = map.createVisionObject(player1);
  const [, mapState1] = execute(map, vision, AttackBuildingAction(vec(2, 1), to))!;
  const [, mapState2] = execute(mapState1, vision, AttackBuildingAction(vec(1, 2), to))!;
  expect(mapState1.units.get(to)).toEqual(Pioneer.create(2));
  expect(mapState2.units.get(to)).toBeUndefined();

  const to2 = vec(5, 5);
  const [, mapState3] = execute(map, vision, AttackBuildingAction(vec(4, 5), to2))!;
  const [, mapState4] = execute(mapState3, vision, AttackBuildingAction(vec(5, 4), to2))!;
  expect(mapState3.units.get(to2)).toEqual(
    APU.create(2).subtractAmmo(APU.attack.weapons!.get(1)!, 1),
  );
  expect(mapState4.units.get(to2)).toBeUndefined();
});
