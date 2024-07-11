import { ResearchLab } from '@deities/athena/info/Building.tsx';
import { Commander, Infantry } from '@deities/athena/info/Unit.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import { HumanPlayer } from '@deities/athena/map/Player.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { expect, test } from 'vitest';
import { AttackUnitAction } from '../action-mutators/ActionMutators.tsx';
import { execute } from '../Action.tsx';

const map = withModifiers(
  MapData.createMap({
    buildings: [[1, 1, ResearchLab.create(0).toJSON()]],
    map: [1, 1, 1, 1, 1, 1, 1, 1, 1],
    size: { height: 3, width: 3 },
    teams: [
      { id: 1, name: '', players: [{ funds: 500, id: 1, userId: '1' }] },
      { id: 2, name: '', players: [{ funds: 500, id: 2, name: 'AI' }] },
    ],
    units: [
      [1, 1, Infantry.create(2).capture().toJSON()],
      [2, 1, Infantry.create(1).capture().toJSON()],
      [3, 1, Commander.create(1).toJSON()],
      [3, 2, Infantry.create(1).toJSON()],
      [3, 3, Commander.create(1).toJSON()],
      [2, 2, Infantry.create(2).toJSON()],
      [1, 3, Infantry.create(1).toJSON()],
      [2, 3, Infantry.create(2).toJSON()],
    ],
  }),
);
const player1 = HumanPlayer.from(map.getPlayer(1), '1');
const vision = map.createVisionObject(player1);

test('commander units improve morale of nearby units', async () => {
  const vecA = vec(2, 1);
  const vecB = vec(1, 1);
  const vecC = vec(3, 2);
  const vecD = vec(2, 2);
  const vecE = vec(1, 3);
  const vecF = vec(2, 3);
  const [, state1] = execute(map, vision, AttackUnitAction(vecA, vecB))!;
  const [, state2] = execute(map, vision, AttackUnitAction(vecC, vecD))!;
  const [, state3] = execute(map, vision, AttackUnitAction(vecE, vecF))!;

  const unitA1 = state1.units.get(vecB)!;
  const unitA2 = state2.units.get(vecD)!;
  const unitA3 = state3.units.get(vecF)!;

  // vecA is only next to one commander unit, but vecC is next to two commander units.
  expect(unitA1.health).toBeGreaterThan(unitA2.health);
  expect(unitA3.health).toBeGreaterThan(unitA1.health);
});
