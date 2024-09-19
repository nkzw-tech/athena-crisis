import dynamicThrottle from './dynamicThrottle.tsx';
import Input, { NavigationDirection } from './Input.tsx';
import isControlElement from './isControlElement.tsx';
import throttle from './throttle.tsx';

const next = throttle(() => Input.fire('next'), 50);
const previous = throttle(() => Input.fire('previous'), 50);

const navigate = dynamicThrottle(
  (direction: NavigationDirection) => {
    Input.fire('navigate', direction);
  },
  [100, 70, 40, 20],
);

const navigateSecondary = dynamicThrottle(
  (direction: NavigationDirection) => {
    Input.fire('navigateSecondary', direction);
  },
  [100, 70, 40, 20],
);

const pressed = {
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
  ArrowUp: false,
  KeyI: false,
  KeyJ: false,
  KeyK: false,
  KeyL: false,
};

type PressedKey = keyof typeof pressed;

const keydownListener = (event: KeyboardEvent) => {
  const { code } = event;
  const isMeta = event.metaKey || event.ctrlKey;

  if (isMeta) {
    if (code === 'KeyE') {
      event.preventDefault();
      Input.fire('secondary');
      return;
    } else if (code === 'KeyS') {
      event.preventDefault();
      Input.fire('save');
      return;
    }
  }

  if (isControlElement()) {
    return;
  }

  if (
    code === 'ArrowDown' ||
    code === 'ArrowLeft' ||
    code === 'ArrowRight' ||
    code === 'ArrowUp' ||
    code === 'Space' ||
    code === 'KeyA'
  ) {
    event.preventDefault();
  }

  if (code in pressed) {
    pressed[code as PressedKey] = true;
  }

  const direction: NavigationDirection = { x: 0, y: 0 };
  if (pressed.ArrowUp) {
    direction.y -= 1;
  }
  if (pressed.ArrowRight) {
    direction.x += 1;
  }
  if (pressed.ArrowDown) {
    direction.y += 1;
  }
  if (pressed.ArrowLeft) {
    direction.x -= 1;
  }

  const secondaryDirection: NavigationDirection = { x: 0, y: 0 };
  if (pressed.KeyI) {
    secondaryDirection.y -= 1;
  }
  if (pressed.KeyL) {
    secondaryDirection.x += 1;
  }
  if (pressed.KeyK) {
    secondaryDirection.y += 1;
  }
  if (pressed.KeyJ) {
    secondaryDirection.x -= 1;
  }

  if (direction.x !== 0 || direction.y !== 0) {
    navigate(direction);
  }

  if (secondaryDirection.x !== 0 || secondaryDirection.y !== 0) {
    navigateSecondary(secondaryDirection);
  }

  if (code === 'Tab') {
    event.preventDefault();
    if (event.shiftKey) {
      previous();
    } else {
      next();
    }
  } else if (code === 'ShiftLeft') {
    Input.fire('tertiary');
  } else if (code === 'Enter' || code === 'Space') {
    event.preventDefault();
    Input.fire('accept');
  } else if (code === 'Escape') {
    Input.fire('cancel', { isEscape: true });
  } else if (code === 'KeyI') {
    Input.fire('field-info');
  } else if (code === 'KeyP') {
    if (isMeta) {
      event.preventDefault();
    }
    Input.fire('select', { modifier: isMeta });
  } else if (!isMeta) {
    if (code === 'KeyM') {
      Input.fire('menu');
    } else if (code === 'KeyQ') {
      Input.fire('info');
    } else if (code === 'KeyE') {
      Input.fire('detail');
    } else if (code === 'KeyA') {
      Input.fire('keyboard:tertiary');
    }
  }
};

const keyupListener = (event: KeyboardEvent) => {
  if (isControlElement()) {
    return;
  }

  const { code } = event;
  if (code in pressed) {
    pressed[code as PressedKey] = false;
  }

  if (code === 'Enter' || code === 'Space') {
    Input.fire('accept:released');
  }
};

const preventDefault = (event: Event) => event.preventDefault();
let setup = false;

export default function setupKeyboard() {
  if (!setup) {
    setup = true;
    document.addEventListener('keydown', keydownListener);
    document.addEventListener('keyup', keyupListener);
    if (
      process.env.NODE_ENV !== 'development' &&
      !process.env.IS_LANDING_PAGE
    ) {
      document.addEventListener('contextmenu', preventDefault);
    }
  }

  return () => {
    document.removeEventListener('keydown', keydownListener);
    document.removeEventListener('keyup', keyupListener);
    document.removeEventListener('contextmenu', preventDefault);
  };
}
