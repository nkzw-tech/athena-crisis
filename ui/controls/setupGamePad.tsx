import {
  ButtonResult,
  createJoymap,
  createQueryModule,
  Joymap,
  QueryModule,
} from '@nkzw/joymap';
import { getCurrentScrollContainer } from '../ScrollContainer.tsx';
import dynamicThrottle from './dynamicThrottle.tsx';
import Input, { NavigationDirection } from './Input.tsx';
import throttle from './throttle.tsx';

const singlePress = (button?: ButtonResult) =>
  !!(button?.pressed && button.justChanged);

const pressed = (button?: ButtonResult) => !!button?.pressed;
const controller1 = createQueryModule();
const controller2 = createQueryModule();
let useSecondaryNavigation = false;
let joymap: Joymap | null = null;

export function hasGamePad() {
  return joymap && joymap.getGamepads().length > 0;
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

  const handleInputs = (controller: QueryModule) => {
    const stickLeft = controller.getStick('L');
    const {
      A,
      B,
      L1,
      L2,
      L3,
      R1,
      R2,
      R3,
      X,
      Y,
      dpadDown,
      dpadLeft,
      dpadRight,
      dpadUp,
      home,
      select,
      start,
    } = controller.getAllButtons();
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
      } else if (
        direction.y &&
        !direction.x &&
        deltaY < 0.75 &&
        deltaX > 0.25
      ) {
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
      getCurrentScrollContainer().scrollBy(
        stickRight.value[0] * 16,
        stickRight.value[1] * 16,
      );
      Input.fireWithPointerLock('point');
    }

    if (singlePress(start) || singlePress(home)) {
      Input.fireWithPointerLock('menu');
    }

    if (singlePress(A)) {
      navigate.reset();
      Input.fireWithPointerLock('accept');
    }

    if (singlePress(select)) {
      Input.fireWithPointerLock('select', { modifier: A?.pressed });
    }

    if (singlePress(B)) {
      navigate.reset();
      Input.fireWithPointerLock('cancel', null);
    }

    if (singlePress(X)) {
      Input.fireWithPointerLock('secondary');
    }

    if (singlePress(Y)) {
      Input.fireWithPointerLock('tertiary');
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
      if (singlePress(L2)) {
        Input.fireWithPointerLock('info');
      }

      if (singlePress(R2)) {
        detailPressed = true;
        Input.fireWithPointerLock('detail');
      }

      if (detailPressed && !r2pressed) {
        detailPressed = false;
        Input.fireWithPointerLock('detail:released');
      }
    }

    if (singlePress(R3)) {
      Input.fireWithPointerLock('zoom');
    }

    if (singlePress(L3)) {
      Input.fireWithPointerLock('undo');
    }

    if (pressed(B) && pressed(A) && l1Pressed && r1Pressed) {
      Input.fireWithPointerLock('reset');
    }
  };

  joymap = createJoymap({
    autoConnect: true,
    onPoll: () => {
      if (document.visibilityState !== 'visible' || !document.hasFocus()) {
        return;
      }

      const gamepads = joymap?.getGamepads();
      if (!gamepads?.length) {
        return;
      }

      handleInputs(controller1);
      if (gamepads.length > 1) {
        handleInputs(controller2);
      }
    },
  });

  joymap.addModule(controller1);
  joymap.addModule(controller2);
  try {
    joymap.start();
  } catch {
    // This might throw in browsers that don't support gamepads, specifically when calling `navigator.getGamepads()`.
  }

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

  controller1.addRumble(effect, type);
  controller2.addRumble(effect, type);
}
