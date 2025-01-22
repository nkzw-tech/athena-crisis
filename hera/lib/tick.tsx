import {
  TileAnimation,
  WaterfallAnimation,
  WaterfallModifiers,
} from '@deities/athena/info/Tile.tsx';
import { AnimationSpeed } from '@deities/athena/map/Configuration.tsx';
import useVisibilityState from '@deities/ui/hooks/useVisibilityState.tsx';
import { useEffect } from 'react';

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
    modifier != null && WaterfallModifiers.has(modifier)
      ? WaterfallAnimation
      : info.animation;
  if (
    modifier != null &&
    animation?.modifiers &&
    !animation.modifiers.has(modifier)
  ) {
    return null;
  }

  return animation
    ? (Math.floor(tick / animation.ticks) % animation.frames) * animation.offset
    : null;
}

export function getIdleFrame(
  info: { animation: TileAnimation | null },
  tick: number,
) {
  return getFrame(info, null, tick);
}

export default function tick(fn: TickFunction) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function useTick(paused: boolean | undefined, fn: TickFunction) {
  const isVisible = useVisibilityState();
  useEffect(() => {
    if (!paused && isVisible) {
      return tick(fn);
    }
  }, [fn, isVisible, paused]);
}
