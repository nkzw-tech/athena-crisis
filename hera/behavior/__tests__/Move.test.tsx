import { Plain } from '@deities/athena/info/Tile.tsx';
import { Infantry, SmallTank } from '@deities/athena/info/Unit.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { expect, test, vi } from 'vitest';
import { RadiusType } from '../../Radius.tsx';
import { Actions, State } from '../../Types.tsx';
import Move from '../Move.tsx';
import getMoveableFields from '../move/getMoveableFields.tsx';

vi.mock('@deities/ui/controls/useInput.tsx', () => ({ default: vi.fn() }));
vi.mock('../attack/attackAction.tsx', () => ({ default: vi.fn() }));
vi.mock('../attack/AttackSelector.tsx', () => ({ default: () => null }));
vi.mock('../confirm/ConfirmAction.tsx', () => ({ default: () => null }));
vi.mock('../Menu.tsx', () => ({
  default: class Menu {
    type = 'menu' as const;
  },
}));
vi.mock('../move/moveAction.tsx', () => ({ default: vi.fn() }));
vi.mock('../move/syncMoveAction.tsx', () => ({ default: vi.fn() }));
vi.mock('../swap/TeleportIndicator.tsx', () => ({ default: () => null }));
vi.mock('../Transport.tsx', () => ({ default: class Transport {} }));
vi.mock('../../Radius.tsx', () => ({ RadiusType: { Move: 11 } }));

test('selecting an attack target in Move behavior keeps the Dark Athena unit selected', () => {
  const attackerPosition = vec(2, 2);
  const targetPosition = vec(4, 2);
  const map = MapData.createMap({
    active: [8, 1],
    currentPlayer: 8,
    map: Array(6 * 6).fill(Plain.id),
    size: { height: 6, width: 6 },
    teams: [
      { id: 8, name: 'Dark Athena', players: [{ funds: 0, id: 8, userId: 'User-2' }] },
      { id: 1, name: 'Opposition', players: [{ funds: 0, id: 1, name: 'Bot' }] },
    ],
    units: [
      [attackerPosition.x, attackerPosition.y, SmallTank.create(8).toJSON()],
      [targetPosition.x, targetPosition.y, Infantry.create(1).toJSON()],
    ],
  });
  const attacker = map.units.get(attackerPosition)!;
  const vision = map.createVisionObject(8);
  const radius = {
    fields: getMoveableFields(map, vision, attacker, attackerPosition),
    path: null,
    type: RadiusType.Move,
  } as const;
  const move = new Move();
  const baseState = {
    currentViewer: 8,
    map,
    radius,
    selectedPosition: attackerPosition,
    selectedUnit: attacker,
    vision,
  } as unknown as State;
  const state = {
    ...baseState,
    ...move.activate(baseState),
  } as State;
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn(() => 1),
  );

  expect(state.attackable?.has(targetPosition)).toBe(true);
  expect(move.select(targetPosition, state, {} as Actions, undefined, undefined, false)).toEqual({
    confirmAction: null,
  });
});
