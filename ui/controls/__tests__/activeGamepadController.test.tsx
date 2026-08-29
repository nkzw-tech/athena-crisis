import type {
  ButtonResult,
  Controller,
  ControllerOptions,
  Joymap,
  RawGamepad,
  StickResult,
} from '@nkzw/joymap';
import { expect, test, vi } from 'vitest';
import createActiveGamepadControllerManager from '../activeGamepadController.tsx';

type ControllerState = {
  buttons: Record<string, ButtonResult>;
  connected: boolean;
  controller: Controller;
  sticks: Record<string, StickResult>;
};

const button = (pressed: boolean, justChanged = pressed): ButtonResult => ({
  justChanged,
  pressed,
  type: 'button',
  value: pressed ? 1 : 0,
});

const stick = (x: number, y = 0): StickResult => ({
  inverts: [false, false],
  justChanged: false,
  pressed: x !== 0 || y !== 0,
  type: 'stick',
  value: [x, y],
});

const gamepad = (index: number) => ({ index }) as RawGamepad;

const setup = (connected = true) => {
  const states = new Map<number, ControllerState>();
  const addController = vi.fn((controller: Controller) => controller);
  const removeController = vi.fn(() => true);
  const controllerFactory = vi.fn((options: ControllerOptions = {}) => {
    const state = {
      buttons: {},
      connected,
      sticks: {},
    } as ControllerState;
    state.controller = {
      getAllButtons: () => state.buttons,
      getAllSticks: () => state.sticks,
      isConnected: () => state.connected,
    } as Controller;
    states.set(options.gamepadIndex!, state);
    return state.controller;
  });
  const manager = createActiveGamepadControllerManager(
    { addController, removeController } as Pick<Joymap, 'addController' | 'removeController'>,
    controllerFactory,
  );

  return { addController, controllerFactory, manager, removeController, states };
};

test('tracks every connected gamepad and initially selects the first controller', () => {
  const { addController, manager, states } = setup();
  const selection = manager.update([gamepad(2), gamepad(7), gamepad(9)]);

  expect([...states.keys()]).toEqual([2, 7, 9]);
  expect(addController).toHaveBeenCalledTimes(3);
  expect(selection).toEqual({ changed: true, controller: states.get(2)!.controller });
});

test('waits until a newly registered controller has received its first poll', () => {
  const { manager, states } = setup(false);

  expect(manager.update([gamepad(3)])).toEqual({ changed: false, controller: null });
  states.get(3)!.connected = true;
  expect(manager.update([gamepad(3)])).toEqual({
    changed: true,
    controller: states.get(3)!.controller,
  });
});

test('switches to a controller after a deliberate button press', () => {
  const { manager, states } = setup();
  manager.update([gamepad(0), gamepad(1)]);

  states.get(1)!.buttons.A = button(true);
  expect(manager.update([gamepad(0), gamepad(1)])).toEqual({
    changed: true,
    controller: states.get(1)!.controller,
  });

  states.get(1)!.buttons.A = button(true, false);
  expect(manager.update([gamepad(0), gamepad(1)])).toEqual({
    changed: false,
    controller: states.get(1)!.controller,
  });
});

test('ignores stick drift and requires a new deliberate stick movement to switch', () => {
  const { manager, states } = setup();
  manager.update([gamepad(0), gamepad(1)]);

  states.get(1)!.sticks.L = stick(0.3);
  expect(manager.update([gamepad(0), gamepad(1)]).controller).toBe(states.get(0)!.controller);

  states.get(1)!.sticks.L = stick(0.36);
  expect(manager.update([gamepad(0), gamepad(1)])).toEqual({
    changed: true,
    controller: states.get(1)!.controller,
  });

  states.get(0)!.buttons.A = button(true);
  manager.update([gamepad(0), gamepad(1)]);
  states.get(0)!.buttons.A = button(true, false);
  expect(manager.update([gamepad(0), gamepad(1)]).controller).toBe(states.get(0)!.controller);

  states.get(1)!.sticks.L = stick(0.2);
  manager.update([gamepad(0), gamepad(1)]);
  states.get(1)!.sticks.L = stick(0.36);
  expect(manager.update([gamepad(0), gamepad(1)]).controller).toBe(states.get(1)!.controller);
});

test('keeps the active controller when both controllers act during the same poll', () => {
  const { manager, states } = setup();
  manager.update([gamepad(0), gamepad(1)]);

  states.get(0)!.buttons.A = button(true);
  states.get(1)!.buttons.A = button(true);
  expect(manager.update([gamepad(0), gamepad(1)])).toEqual({
    changed: false,
    controller: states.get(0)!.controller,
  });
});

test('removes disconnected controllers and falls back to another connected controller', () => {
  const { manager, removeController, states } = setup();
  manager.update([gamepad(0), gamepad(1)]);
  const controller0 = states.get(0)!.controller;

  expect(manager.update([gamepad(1)])).toEqual({
    changed: true,
    controller: states.get(1)!.controller,
  });
  expect(removeController).toHaveBeenCalledWith(controller0);

  expect(manager.update([])).toEqual({ changed: true, controller: null });
  expect(removeController).toHaveBeenCalledTimes(2);
});
