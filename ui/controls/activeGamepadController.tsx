import {
  createController,
  isJustPressed,
  type Controller,
  type ControllerOptions,
  type Joymap,
  type RawGamepad,
} from '@nkzw/joymap';

const stickActivationThreshold = 0.35;
const stickReleaseThreshold = 0.25;

type ControllerFactory = (options?: ControllerOptions) => Controller;
type ControllerRegistry = Pick<Joymap, 'addController' | 'removeController'>;

export type ActiveGamepadControllerSelection = Readonly<{
  changed: boolean;
  controller: Controller | null;
}>;

export default function createActiveGamepadControllerManager(
  joymap: ControllerRegistry,
  controllerFactory: ControllerFactory = createController,
) {
  const controllers = new Map<number, Controller>();
  const activeSticks = new Map<Controller, Map<string, boolean>>();
  let activeController: Controller | null = null;

  const hasDeliberateInput = (controller: Controller) => {
    let hasInput = Object.values(controller.getAllButtons()).some(isJustPressed);
    let stickStates = activeSticks.get(controller);
    if (!stickStates) {
      stickStates = new Map();
      activeSticks.set(controller, stickStates);
    }

    for (const [name, stick] of Object.entries(controller.getAllSticks())) {
      if (!stick) {
        continue;
      }

      let squaredMagnitude = 0;
      for (const value of stick.value) {
        squaredMagnitude += value ** 2;
      }

      const wasActive = stickStates.get(name) ?? false;
      const isActive = wasActive
        ? squaredMagnitude > stickReleaseThreshold ** 2
        : squaredMagnitude >= stickActivationThreshold ** 2;
      stickStates.set(name, isActive);
      if (!wasActive && isActive) {
        hasInput = true;
      }
    }

    return hasInput;
  };

  return {
    getActiveController: () => activeController,

    update: (gamepads: ReadonlyArray<RawGamepad>): ActiveGamepadControllerSelection => {
      const previousActiveController = activeController;
      const connectedIndexes = new Set(gamepads.map(({ index }) => index));

      for (const [index, controller] of controllers) {
        if (!connectedIndexes.has(index)) {
          controllers.delete(index);
          activeSticks.delete(controller);
          joymap.removeController(controller);
          if (activeController === controller) {
            activeController = null;
          }
        }
      }

      for (const { index } of gamepads) {
        if (!controllers.has(index)) {
          const controller = controllerFactory({ gamepadIndex: index });
          controllers.set(index, controller);
          joymap.addController(controller);
        }
      }

      let activeHasInput = false;
      let firstConnectedController: Controller | null = null;
      let nextActiveController: Controller | null = null;
      for (const controller of controllers.values()) {
        if (!controller.isConnected()) {
          continue;
        }

        firstConnectedController ??= controller;
        const hasInput = hasDeliberateInput(controller);
        if (controller === activeController) {
          activeHasInput = hasInput;
        } else if (hasInput && !nextActiveController) {
          nextActiveController = controller;
        }
      }

      if (!activeHasInput && nextActiveController) {
        activeController = nextActiveController;
      } else if (!activeController?.isConnected()) {
        activeController = firstConnectedController;
      }

      return {
        changed: activeController !== previousActiveController,
        controller: activeController,
      };
    },
  };
}
