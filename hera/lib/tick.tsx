import {
  TileAnimation,
  WaterfallAnimation,
  WaterfallModifiers,
} from '@deities/athena/info/Tile.tsx';
import { AnimationSpeed } from '@deities/athena/map/Configuration.tsx';

type TickFunction = (tick: number) => void;

const listeners = new Set<TickFunction>();
setInterval(() => {
  if (listeners.size) {
    const tick = getTick();
    for (const fn of listeners) {
      fn(tick);
    }
  }
}, AnimationSpeed);

export function getTick() {
  return Math.floor(performance.now() / AnimationSpeed + 1);
}

export function getFrame(
  info: { animation?: TileAnimation | null },
  modifier: number | null,
  tick: number,
) {
  const animation =
    modifier != null && WaterfallModifiers.has(modifier) ? WaterfallAnimation : info.animation;
  if (modifier != null && animation?.modifiers && !animation.modifiers.has(modifier)) {
    return null;
  }

  return animation
    ? (Math.floor(tick / animation.ticks) % animation.frames) * animation.offset
    : null;
}

export default function tick(fn: TickFunction) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
