import { execute } from '@deities/apollo/Action.tsx';
import { Factory } from '@deities/athena/info/Building.tsx';
import { Infantry, SmallTank } from '@deities/athena/info/Unit.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { RadiusItem } from '@deities/athena/Radius.tsx';
import Input from '@deities/ui/controls/Input.tsx';
import useInput from '@deities/ui/controls/useInput.tsx';
import ImmutableMap from '@nkzw/immutable-map';
import { afterEach, expect, test, vi } from 'vitest';
import { RadiusType } from '../../Radius.tsx';
import type { Actions, State } from '../../Types.tsx';
import Attack from '../Attack.tsx';
import CreateUnit from '../CreateUnit.tsx';

vi.mock('@deities/ui/controls/useInput.tsx', () => ({ default: vi.fn() }));
vi.mock('@deities/ui/AudioPlayer.tsx', () => ({ default: { playSound: vi.fn() } }));
vi.mock('react', async () => ({
  ...(await vi.importActual('react')),
  useCallback: (callback: unknown) => callback,
}));
vi.mock('../attack/AttackSelector.tsx', () => ({ default: () => null }));
vi.mock('../confirm/ConfirmAction.tsx', () => ({ default: () => null }));
vi.mock('../swap/TeleportIndicator.tsx', () => ({ default: () => null }));
vi.mock('../../Unit.tsx', () => ({ default: () => null }));
vi.mock('../../Medal.tsx', () => ({ default: () => null }));
vi.mock('../../ui/ActionWheel.tsx', () => ({
  ActionWheelFunds: () => null,
  actionWheelInfoIconStyle: '',
  default: () => null,
  LargeActionButton: () => null,
}));

const cleanups: Array<() => void> = [];

afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup());
  vi.clearAllMocks();
});

const setup = (type: 'attack' | 'createUnit', hasPosition = true) => {
  const from = type === 'attack' ? vec(1, 1) : vec(1, 2);
  const to = type === 'attack' ? vec(2, 1) : from;
  const map = MapData.createMap({
    buildings: [
      [1, 2, Factory.create(1).toJSON()],
      [2, 1, Factory.create(2).toJSON()],
    ],
    map: Array(9).fill(1),
    size: { height: 3, width: 3 },
    teams: [
      { id: 1, name: '', players: [{ funds: 10_000, id: 1, userId: '1' }] },
      { id: 2, name: '', players: [{ funds: 10_000, id: 2, userId: '2' }] },
    ],
    units: [
      [1, 1, SmallTank.create(1).toJSON()],
      [2, 1, Infantry.create(2).toJSON()],
    ],
  });
  const behavior = type === 'attack' ? new Attack() : new CreateUnit(SmallTank);
  const fields = new Map([[to, RadiusItem(to)]]);
  let state = {
    animations: ImmutableMap(),
    attackable: fields,
    behavior,
    currentViewer: 1,
    map,
    position: hasPosition ? to : null,
    radius: {
      fields,
      path: null,
      type: type === 'attack' ? RadiusType.Attackable : RadiusType.Move,
    },
    selectedBuilding: map.buildings.get(from),
    selectedPosition: from,
    selectedUnit: map.units.get(from),
    vision: map.createVisionObject(1),
  } as unknown as State;
  const frames: Array<FrameRequestCallback> = [];
  const action = vi.fn<Actions['action']>((state, action) => {
    const result = execute(state.map, state.vision, action);
    if (!result) {
      throw new Error('Expected a valid action.');
    }
    const [response, map] = result;
    return [new Promise(() => {}), map, response];
  });
  const actions = {
    action,
    requestFrame: (callback) => frames.push(callback),
    update: async (change) => {
      state = { ...state, ...(typeof change === 'function' ? change(state) : change) };
      return state;
    },
  } satisfies Partial<Actions> as unknown as Actions;

  vi.mocked(useInput).mockImplementation((type, callback, layer) => {
    cleanups.push(Input.register(type, callback, layer));
  });
  behavior.component({ actions, state });

  return { action, frames, getState: () => state, to };
};

test.each(['gamepad:tertiary', 'tertiary'] as const)(
  '%s attacking a unit on an enemy building keeps the target picker open',
  (type) => {
    const { action, getState, to } = setup('attack');
    const globalShortcut = vi.fn();
    cleanups.push(Input.register(type, globalShortcut));

    Input.fire(type);

    expect(getState().selectedAttackable).toBe(to);
    expect(getState().behavior?.type).toBe('attack');
    expect(action).not.toHaveBeenCalled();
    expect(globalShortcut).not.toHaveBeenCalled();
  },
);

test.each(['gamepad:tertiary', 'tertiary'] as const)(
  '%s deployment does not reach the global shortcut before its animation starts',
  (type) => {
    const { action, frames, getState } = setup('createUnit');
    const globalShortcut = vi.fn();
    cleanups.push(Input.register(type, globalShortcut));

    Input.fire(type);

    expect(frames).toHaveLength(1);
    frames.splice(0).forEach((callback) => callback(0));
    expect(action).toHaveBeenCalledOnce();
    expect(getState().animations.size).toBe(1);
    expect(getState().behavior?.type).toBe('null');
    expect(globalShortcut).not.toHaveBeenCalled();
  },
);

test.each(['attack', 'createUnit'] as const)(
  '%s keeps the global shortcut available when there is no cursor position',
  (behavior) => {
    const { action, frames } = setup(behavior, false);
    const globalShortcut = vi.fn();
    cleanups.push(Input.register('gamepad:tertiary', globalShortcut));

    Input.fire('gamepad:tertiary');

    expect(action).not.toHaveBeenCalled();
    expect(frames).toHaveLength(0);
    expect(globalShortcut).toHaveBeenCalledOnce();
  },
);
