import { execute } from '@deities/apollo/Action.tsx';
import { Plain } from '@deities/athena/info/Tile.tsx';
import { Infantry, Jeep } from '@deities/athena/info/Unit.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { RadiusItem } from '@deities/athena/Radius.tsx';
import Input from '@deities/ui/controls/Input.tsx';
import useInput from '@deities/ui/controls/useInput.tsx';
import ImmutableMap from '@nkzw/immutable-map';
import { afterEach, expect, test, vi } from 'vitest';
import { RadiusType } from '../../Radius.tsx';
import type { Actions, State } from '../../Types.tsx';
import DropUnit from '../DropUnit.tsx';

vi.mock('@deities/ui/controls/useInput.tsx', () => ({ default: vi.fn() }));
vi.mock('../../Radius.tsx', () => ({ RadiusType: { Move: 11 } }));
vi.mock('../../Tick.tsx', () => ({ default: () => null }));
vi.mock('../../TransportedUnitTile.tsx', () => ({ default: () => null }));
vi.mock('../../ui/Flyout.tsx', () => ({
  default: () => null,
  FlyoutItemWithHighlight: () => null,
}));
vi.mock('../swap/TeleportIndicator.tsx', () => ({ default: () => null }));
vi.mock('react', async () => ({
  ...(await vi.importActual('react')),
  useCallback: (callback: unknown) => callback,
  useState: (value: unknown) => [value, vi.fn()],
}));

const cleanups: Array<() => void> = [];

afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup());
  vi.clearAllMocks();
});

const setup = (dropUnit: number | null = 0, validPosition = true) => {
  const from = vec(2, 2);
  const to = vec(3, 2);
  const map = MapData.createMap({
    map: Array(9).fill(Plain.id),
    size: { height: 3, width: 3 },
    teams: [
      { id: 1, name: '', players: [{ funds: 0, id: 1, userId: '1' }] },
      { id: 2, name: '', players: [{ funds: 0, id: 2, userId: '2' }] },
    ],
    units: [
      [from.x, from.y, Jeep.create(1).load(Infantry.create(1).transport()).toJSON()],
      [1, 1, Infantry.create(2).toJSON()],
    ],
  });
  const behavior = new DropUnit(dropUnit);
  let state = {
    animations: ImmutableMap(),
    behavior,
    map,
    position: validPosition ? to : vec(1, 1),
    radius: {
      fields: new Map([[to, RadiusItem(to)]]),
      path: [to],
      type: RadiusType.Move,
    },
    selectedPosition: from,
    selectedUnit: map.units.get(from)!,
    vision: map.createVisionObject(1),
  } as unknown as State;
  const action = vi.fn<Actions['action']>((state, action) => {
    const result = execute(state.map, state.vision, action);
    if (!result) {
      throw new Error('Expected a valid unload action.');
    }
    const [response, map] = result;
    return [new Promise(() => {}), map, response];
  });
  const actions = {
    action,
    update: async (change) => {
      state = { ...state, ...(typeof change === 'function' ? change(state) : change) };
      return state;
    },
  } satisfies Partial<Actions> as unknown as Actions;

  vi.mocked(useInput).mockImplementation((type, callback, layer) => {
    cleanups.push(Input.register(type, callback, layer));
  });
  behavior.component({ actions, state });

  return { action, getState: () => state };
};

test.each(['gamepad:tertiary', 'tertiary'] as const)(
  '%s unloading does not reach the global shortcut during the animation',
  (type) => {
    const { action, getState } = setup();
    const globalShortcut = vi.fn();
    cleanups.push(Input.register(type, globalShortcut));

    Input.fire(type);

    expect(action).toHaveBeenCalledOnce();
    expect(getState().animations.size).toBe(1);
    expect(getState().behavior?.type).toBe('null');
    expect(globalShortcut).not.toHaveBeenCalled();
  },
);

test.each([
  [null, true],
  [0, false],
] as const)(
  'keeps the global shortcut when unloading cannot handle it (%s, %s)',
  (index, valid) => {
    const { action } = setup(index, valid);
    const globalShortcut = vi.fn();
    cleanups.push(Input.register('gamepad:tertiary', globalShortcut));

    Input.fire('gamepad:tertiary');

    expect(action).not.toHaveBeenCalled();
    expect(globalShortcut).toHaveBeenCalledOnce();
  },
);
