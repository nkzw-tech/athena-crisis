import vec from '@deities/athena/map/vec.tsx';
import { RadiusItem } from '@deities/athena/Radius.tsx';
import { expect, test, vi } from 'vitest';
import { RadiusType } from '../../Radius.tsx';
import type { State } from '../../Types.tsx';
import Attack from '../Attack.tsx';

vi.mock('@deities/ui/controls/useInput.tsx', () => ({ default: vi.fn() }));
vi.mock('../attack/AttackSelector.tsx', () => ({ default: () => null }));
vi.mock('../confirm/ConfirmAction.tsx', () => ({ default: () => null }));

test('selects the first attack target without creating a movement path', () => {
  const first = vec(2, 3);
  const second = vec(1, 2);
  const attackable = new Map([
    [first, RadiusItem(first)],
    [second, RadiusItem(second)],
  ]);

  expect(new Attack().activate({ attackable } as unknown as State)).toEqual({
    confirmAction: null,
    position: first,
    radius: {
      fields: attackable,
      locked: false,
      path: null,
      type: RadiusType.Attackable,
    },
  });
});
