import { Plain } from '@deities/athena/info/Tile.tsx';
import { Infantry, SmallTank } from '@deities/athena/info/Unit.tsx';
import { InstantAnimationConfig } from '@deities/athena/map/Configuration.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { expect, test, vi } from 'vitest';
import { Actions, State } from '../../../Types.tsx';
import clientAttackAction from '../clientAttackAction.tsx';

vi.mock('../../../animations/attackActionAnimation.tsx', () => ({
  default: vi.fn(async (_actions, state) => state),
}));

test('settles after an invalid counterattack response', async () => {
  const from = vec(1, 1);
  const to = vec(2, 1);
  const map = MapData.createMap({
    currentPlayer: 1,
    map: [Plain.id, Plain.id],
    size: { height: 1, width: 2 },
    teams: [
      { id: 1, name: 'One', players: [{ funds: 0, id: 1, userId: '1' }] },
      { id: 2, name: 'Two', players: [{ funds: 0, id: 2, userId: '2' }] },
    ],
    units: [
      [from.x, from.y, SmallTank.create(1).toJSON()],
      [to.x, to.y, Infantry.create(2).toJSON()],
    ],
  });
  const state = {
    animationConfig: InstantAnimationConfig,
    map,
    vision: map.createVisionObject(1),
  } as State;
  const throwError = vi.fn();
  const update = vi.fn(async () => state);
  const actions = {
    scheduleTimer: vi.fn((fn: () => void) => {
      fn();
      return Promise.resolve(1);
    }),
    throwError,
    update,
  } as unknown as Actions;

  const result = clientAttackAction(
    actions,
    Promise.resolve({ self: null }),
    map,
    {
      from,
      hasCounterAttack: true,
      playerA: 1,
      playerB: 2,
      to,
      type: 'AttackUnit',
    },
    from,
    map.units.get(from)!,
    to,
    map.units.get(to)!,
    state,
  );

  await expect(
    Promise.race([
      result,
      new Promise<'timeout'>((resolve) => setTimeout(() => resolve('timeout'), 100)),
    ]),
  ).resolves.toBe(state);
  expect(throwError).toHaveBeenCalledOnce();
  expect(throwError.mock.calls[0]?.[0]).toHaveProperty(
    'message',
    expect.stringContaining("Expected self action response 'AttackUnit', received 'none'"),
  );
});
