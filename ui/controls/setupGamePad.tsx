import {
  createJoymap,
  isJustPressed,
  type ButtonResult,
  type Controller,
  type Joymap,
} from '@nkzw/joymap';
import { getCurrentScrollContainer } from '../ScrollContainer.tsx';
import createActiveGamepadControllerManager from './activeGamepadController.tsx';
import dynamicThrottle from './dynamicThrottle.tsx';
import Input, { NavigationDirection } from './Input.tsx';
import throttle from './throttle.tsx';

const pressed = (button?: ButtonResult) => !!button?.pressed;

let activeController: Controller | null = null;
let useSecondaryNavigation = false;
let joymap: Joymap | null = null;

export function hasGamepad() {
  return !!joymap && joymap.getGamepads().length > 0;
}

export type GamepadType = 'playstation' | 'switch' | 'generic';

const isPlayStation = (name: string | null) => {
  if (!name) {
    return false;
  }

  name = name.toLowerCase();
  return (
    name.includes('sony interactive entertainment') ||
    name.includes('playstation') ||
    name.includes('dualshock') ||
    name.includes('dualsense')
  );
};

const isSwitch = (() => {
  const cache = new Map<string, boolean>();
  return (name: string | null) => {
    if (!name) {
      return false;
    }

    if (cache.has(name)) {
      return cache.get(name)!;
    }

    name = name.toLowerCase();
    const result =
      name.includes('joy-con') || name.includes('nintendo') || name.includes('pro controller');
    cache.set(name, result);
    return result;
  };
})();

export function getGamepadType(): GamepadType | null {
  const name = activeController?.getGamepad()?.id ?? null;
  return name
    ? isPlayStation(name)
      ? 'playstation'
      : isSwitch(name)
        ? 'switch'
        : 'generic'
    : null;
}

export default function setupGamePad() {
  if (joymap) {
    return;
  }

  const navigate = dynamicThrottle(
    (direction: { x: -1 | 0 | 1; y: -1 | 0 | 1 }) => {
      Input.fireWithPointerLock(
        useSecondaryNavigation ? 'navigateSecondary' : 'navigate',
        direction,
      );
    },
    [200, 140, 80, 40],
  );

  const next = throttle(() => Input.fireWithPointerLock('next'), 250);
  const previous = throttle(() => Input.fireWithPointerLock('previous'), 250);
  let needsThrottleReset = false;
  let detailPressed = false;
  let acceptPressed = false;

  const resetInputState = () => {
    navigate.reset();
    needsThrottleReset = false;
    useSecondaryNavigation = false;
    if (acceptPressed) {
      acceptPressed = false;
      Input.fire('accept:released');
    }
    if (detailPressed) {
      detailPressed = false;
      Input.fire('detail:released');
    }
  };

  const handleInputs = (controller: Controller) => {
    const stickLeft = controller.getStick('L');
    const buttons = controller.getAllButtons();
    const {
      dpadDown,
      dpadLeft,
      dpadRight,
      dpadUp,
      home,
      L1,
      L2,
      L3,
      R1,
      R2,
      R3,
      select,
      start,
      X,
      Y,
    } = buttons;

    const { A, B } = isSwitch(controller.getGamepad()?.id ?? null)
      ? { A: buttons.B, B: buttons.A }
      : buttons;

    if (needsThrottleReset) {
      if (
        stickLeft &&
        !stickLeft.pressed &&
        dpadUp &&
        !dpadUp.pressed &&
        dpadRight &&
        !dpadRight.pressed &&
        dpadDown &&
        !dpadDown.pressed &&
        dpadLeft &&
        !dpadLeft.pressed
      ) {
        needsThrottleReset = false;
        navigate.reset();
      }
    }

    const direction: NavigationDirection = { x: 0, y: 0 };
    if (stickLeft?.type === 'stick' && stickLeft.pressed) {
      const [x, y] = stickLeft.value;
      const deltaX = Math.abs(x);
      const deltaY = Math.abs(y);
      direction.x = deltaX > 0.4 ? (Math.sign(x) as 1 | -1) : 0;
      direction.y = deltaY > 0.4 ? (Math.sign(y) as 1 | -1) : 0;
      if (direction.x && !direction.y && deltaX < 0.75 && deltaY > 0.25) {
        direction.y = Math.sign(y) as 1 | -1;
      } else if (direction.y && !direction.x && deltaY < 0.75 && deltaX > 0.25) {
        direction.x = Math.sign(x) as 1 | -1;
      }
    } else {
      if (dpadUp?.pressed) {
        direction.y -= 1;
      }
      if (dpadRight?.pressed) {
        direction.x += 1;
      }
      if (dpadDown?.pressed) {
        direction.y += 1;
      }
      if (dpadLeft?.pressed) {
        direction.x -= 1;
      }
    }

    if (direction.x !== 0 || direction.y !== 0) {
      needsThrottleReset = true;
      navigate(direction);
    }

    const stickRight = controller.getStick('R');
    if (stickRight?.type === 'stick' && stickRight.pressed) {
      getCurrentScrollContainer().scrollBy(stickRight.value[0] * 16, stickRight.value[1] * 16);
      Input.fireWithPointerLock('point');
    }

    if (isJustPressed(start) || isJustPressed(home)) {
      Input.fireWithPointerLock('menu');
    }

    if (isJustPressed(A)) {
      acceptPressed = true;
      navigate.reset();
      Input.fireWithPointerLock('accept');
    }

    if (acceptPressed && !A?.pressed) {
      acceptPressed = false;
      Input.fire('accept:released');
    }

    if (isJustPressed(select)) {
      Input.fireWithPointerLock('select', { modifier: !!A?.pressed });
    }

    if (isJustPressed(B)) {
      navigate.reset();
      Input.fireWithPointerLock('cancel', null);
    }

    if (isJustPressed(X)) {
      Input.fireWithPointerLock('secondary');
    }

    if (isJustPressed(Y)) {
      Input.fireWithPointerLock('gamepad:tertiary');
    }

    const l1Pressed = pressed(L1);
    const r1Pressed = pressed(R1);
    if (l1Pressed) {
      previous();
    }

    if (r1Pressed) {
      next();
    }

    const l2pressed = pressed(L2);
    const r2pressed = pressed(R2);
    if (l2pressed && r2pressed) {
      useSecondaryNavigation = true;
    } else {
      useSecondaryNavigation = false;
      if (isJustPressed(L2)) {
        Input.fireWithPointerLock('info');
      }

      if (isJustPressed(R2)) {
        detailPressed = true;
        Input.fireWithPointerLock('detail');
      }

      if (detailPressed && !r2pressed) {
        detailPressed = false;
        Input.fire('detail:released');
      }
    }

    if (isJustPressed(R3)) {
      Input.fireWithPointerLock('zoom');
    }

    if (isJustPressed(L3)) {
      Input.fireWithPointerLock('undo');
    }

    if (pressed(B) && pressed(A) && l1Pressed && r1Pressed) {
      Input.fireWithPointerLock('reset');
    }
  };

  const currentJoymap = createJoymap({
    onPoll: () => {
      const selection = controllerManager.update(currentJoymap.getGamepads());
      if (selection.changed) {
        resetInputState();
      }
      activeController = selection.controller;

      if (document.visibilityState !== 'visible' || !document.hasFocus()) {
        return;
      }

      if (activeController) {
        handleInputs(activeController);
      }
    },
  });
  const controllerManager = createActiveGamepadControllerManager(currentJoymap);
  joymap = currentJoymap;

  joymap.start();

  if (import.meta.hot) {
    import.meta.hot.accept(() => {
      location.reload();
    });
  }
}

export type Rumble = 'explosion' | 'menu' | 'accept';

export function rumbleEffect(type: Rumble, duration?: number) {
  const effect =
    type === 'explosion'
      ? {
          duration: duration || 200,
          strongMagnitude: 1,
          weakMagnitude: 1,
        }
      : type === 'accept'
        ? {
            duration: duration || 35,
            strongMagnitude: 0.15,
            weakMagnitude: 0.15,
          }
        : {
            duration: duration || 50,
            strongMagnitude: 0.3,
            weakMagnitude: 0.3,
          };

  activeController?.addRumble(effect, type);
}
