import { Skill } from '@deities/athena/info/Skill.tsx';
import { Charge } from '@deities/athena/map/Configuration.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { expect, test, vi } from 'vitest';
import { Actions, State } from '../../../Types.tsx';
import activateAction, { canActivate } from '../activateAction.tsx';

const createState = (map: MapData) =>
  ({
    currentViewer: 1,
    map,
  }) as State;

test('does not activate a stale power action when the live player no longer has enough charge', async () => {
  const map = MapData.createMap({
    map: [1],
    size: { height: 1, width: 1 },
    teams: [
      {
        id: 1,
        name: '',
        players: [
          {
            charge: 0,
            funds: 0,
            id: 1,
            skills: [Skill.AttackIncreaseMinor],
            userId: '1',
          },
        ],
      },
    ],
  });
  const actions = {
    action: vi.fn(() => {
      throw new Error('Action should not be executed.');
    }),
    update: vi.fn(),
  } as unknown as Actions;

  await expect(
    activateAction(
      actions,
      createState(map),
      { skill: Skill.AttackIncreaseMinor, type: 'Skill' },
      null,
    ),
  ).resolves.toBeUndefined();

  expect(actions.action).not.toHaveBeenCalled();
});

test('does not activate a target power without a live target', async () => {
  const map = MapData.createMap({
    map: [1],
    size: { height: 1, width: 1 },
    teams: [
      {
        id: 1,
        name: '',
        players: [
          {
            charge: 5 * Charge,
            funds: 0,
            id: 1,
            skills: [Skill.BuyUnitDinosaur],
            userId: '1',
          },
        ],
      },
    ],
  });
  const actions = {
    action: vi.fn(() => {
      throw new Error('Action should not be executed.');
    }),
    update: vi.fn(),
  } as unknown as Actions;

  await expect(
    activateAction(
      actions,
      createState(map),
      { skill: Skill.BuyUnitDinosaur, type: 'Skill' },
      null,
    ),
  ).resolves.toBeUndefined();

  expect(actions.action).not.toHaveBeenCalled();
});

test('allows checking whether a target power can enter target selection', () => {
  const map = MapData.createMap({
    map: [1],
    size: { height: 1, width: 1 },
    teams: [
      {
        id: 1,
        name: '',
        players: [
          {
            charge: 5 * Charge,
            funds: 0,
            id: 1,
            skills: [Skill.BuyUnitDinosaur],
            userId: '1',
          },
        ],
      },
    ],
  });

  expect(
    canActivate(createState(map), { skill: Skill.BuyUnitDinosaur, type: 'Skill' }, null, {
      allowMissingTarget: true,
    }),
  ).toBe(true);
});
