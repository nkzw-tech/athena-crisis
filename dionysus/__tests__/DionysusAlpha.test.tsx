import { Plain } from '@deities/athena/info/Tile.tsx';
import { Infantry } from '@deities/athena/info/Unit.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { expect, test } from 'vitest';
import snapshotGameState from '../../tests/snapshotGameState.tsx';
import DionysusAlpha from '../DionysusAlpha.tsx';

type PrivateDionysusAlphaAttack = {
  attack: (map: MapData) => MapData | null;
};

test('DionysusAlpha skips stale attack candidates when another unit occupies the planned move tile', () => {
  const baseMap = MapData.createMap({
    map: Array(5 * 3).fill(Plain.id),
    size: { height: 3, width: 5 },
    teams: [
      {
        id: 1,
        name: '',
        players: [{ funds: 0, id: 1, userId: 'User-1' }],
      },
      {
        id: 2,
        name: '',
        players: [{ ai: 0, funds: 0, id: 2, name: 'DionysusAlpha' }],
      },
    ],
  });
  const map = withModifiers(
    baseMap.copy({
      currentPlayer: 2,
      units: baseMap.units
        .set(vec(1, 1), Infantry.create(2))
        .set(vec(5, 1), Infantry.create(2))
        .set(vec(2, 2), Infantry.create(1))
        .set(vec(4, 2), Infantry.create(1)),
    }),
  );
  const ai = new DionysusAlpha(new Map());
  const attack = (ai as unknown as PrivateDionysusAlphaAttack).attack.bind(ai);

  expect(attack(map)).not.toBe(null);

  expect(snapshotGameState(ai.retrieveGameState())).toMatchInlineSnapshot(`
    "Move (5,1 → 3,2) { fuel: 47, completed: null, path: [4,1 → 3,1 → 3,2], movementExhausted: null }
    AttackUnit (3,2 → 2,2) { hasCounterAttack: true, playerA: 2, playerB: 1, unitA: DryUnit { health: 75 }, unitB: DryUnit { health: 44 }, chargeA: 86, chargeB: 112 }
    Move (1,1 → 2,1) { fuel: 49, completed: null, path: [2,1], movementExhausted: null }
    AttackUnit (2,1 → 2,2) { hasCounterAttack: false, playerA: 2, playerB: 1, unitA: DryUnit { health: 100 }, unitB: null, chargeA: 115, chargeB: 200 }"
  `);
});
