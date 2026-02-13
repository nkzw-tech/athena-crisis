import { hidePointer } from './setupHidePointer.tsx';

type Direction = -1 | 0 | 1;

export type NavigationDirection = {
  previousX?: Direction;
  previousY?: Direction;
  x: Direction;
  y: Direction;
};

export type Events = Readonly<{
  accept: undefined;
  'accept:released': undefined;
  cancel: { isEscape: boolean } | null;
  detail: undefined;
  'detail:released': undefined;
  'field-info': undefined;
  'gamepad:tertiary': undefined;
  info: undefined;
  'keyboard:tertiary': undefined;
  menu: undefined;
  navigate: NavigationDirection;
  navigateSecondary: NavigationDirection;
  next: undefined;
  point: undefined;
  previous: undefined;
  reset: undefined;
  save: undefined;
  secondary: undefined;
  select: { modifier: boolean };
  tertiary: undefined;
  undo: undefined;
  zoom: undefined;
}>;

export type EventName = keyof Events;

export type InputLayer = 'base' | 'menu' | 'dialog' | 'top';

class Input {
  private _block: InputLayer | null = null;
  private readonly base = new EventTarget();
  private readonly menu = new EventTarget();
  private readonly dialog = new EventTarget();
  private readonly top = new EventTarget();

  fire<T extends EventName>(
    ...args: Events[T] extends undefined ? [type: T] : [type: T, detail: Events[T]]
  ) {
    const [type, detail] = args;
    const event = new CustomEvent(type, {
      cancelable: true,
      detail,
    });

    this.top.dispatchEvent(event);
    if (event.defaultPrevented || this._block === 'top') {
      return;
    }

    this.dialog.dispatchEvent(event);
    if (event.defaultPrevented || this._block === 'dialog') {
      return;
    }

    this.menu.dispatchEvent(event);
    if (event.defaultPrevented || this._block === 'menu') {
      return;
    }

    this.base.dispatchEvent(event);
  }

  fireWithPointerLock<T extends EventName>(
    ...args: Events[T] extends undefined ? [type: T] : [type: T, detail: Events[T]]
  ) {
    hidePointer();
    // @ts-expect-error
    this.fire(...args);
  }

  block(layer: InputLayer) {
    this._block = layer;
    return this.unblock;
  }

  unblock = () => {
    this._block = null;
  };

  register<T extends EventName>(
    type: T,
    fn: (event: CustomEvent<Events[T]>) => void,
    layer: InputLayer = 'base',
  ) {
    this[layer].addEventListener(type, fn as EventListener);
    return () => this[layer].removeEventListener(type, fn as EventListener);
  }
}

export default new Input();
