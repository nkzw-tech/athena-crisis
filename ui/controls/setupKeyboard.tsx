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
  const { code: key } = event;
  const isMeta = event.metaKey || event.ctrlKey;

  if (isMeta) {
    if (key === 'KeyE') {
      event.preventDefault();
      Input.fire('secondary');
      return;
    } else if (key === 'KeyS') {
      event.preventDefault();
      Input.fire('save');
      return;
    }
  }

  if (isControlElement()) {
    return;
  }

  if (
    key === 'ArrowDown' ||
    key === 'ArrowLeft' ||
    key === 'ArrowRight' ||
    key === 'ArrowUp' ||
    key === 'Space' ||
    key === 'KeyA'
  ) {
    event.preventDefault();
  }

  if (key in pressed) {
    pressed[key as PressedKey] = true;
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

  if (isMeta && key === 'AltLeft') {
    event.preventDefault();
    Input.fire('slow');
  } else if (key === 'Tab') {
    event.preventDefault();
    if (event.shiftKey) {
      previous();
    } else {
      next();
    }
  } else if (key === 'ShiftLeft') {
    Input.fire('tertiary');
  } else if (key === 'KeyA') {
    Input.fire('quaternary');
  } else if (key === 'Enter' || key === 'Space') {
    event.preventDefault();
    Input.fire('accept');
  } else if (key === 'Escape') {
    Input.fire('cancel', { isEscape: true });
  } else if (key === 'KeyP') {
    if (isMeta) {
      event.preventDefault();
    }
    Input.fire('select', { modifier: isMeta });
  } else if (!isMeta) {
    if (key === 'KeyM') {
      Input.fire('menu');
    } else if (key === 'KeyQ') {
      Input.fire('info');
    } else if (key === 'KeyE') {
      Input.fire('detail');
    }
  }
};

const keyupListener = (event: KeyboardEvent) => {
  if (isControlElement()) {
    return;
  }

  const { code: key } = event;
  if (key in pressed) {
    pressed[key as PressedKey] = false;
  }

  if (key === 'AltLeft') {
    Input.fire('slow:released');
  } else if (key === 'ShiftLeft') {
    Input.fire('tertiary:released');
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
