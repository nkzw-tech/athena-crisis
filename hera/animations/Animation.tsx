import { SoundName } from '@deities/athena/info/Music.tsx';
import { SpriteVariant } from '@deities/athena/info/SpriteVariants.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import AudioPlayer from '@deities/ui/AudioPlayer.tsx';
import { Rumble, rumbleEffect } from '@deities/ui/controls/setupGamePad.tsx';
import { CSSProperties, useCallback, useEffect } from 'react';
import sprite from '../lib/sprite.tsx';
import { RequestFrameFunction, TimerFunction } from '../Types.tsx';

export type AnimationDirection = 'left' | 'right' | 'up' | 'down';

export type AnimationProps = Readonly<{
  delay: number | Array<number>;
  direction?: AnimationDirection;
  initialDelay?: number;
  onComplete?: () => void;
  onStep?: (step: number) => void;
  rate: number;
  requestFrame: RequestFrameFunction;
  scheduleTimer: TimerFunction;
  size: number;
  sound: SoundName | null;
  trailingDelay?: number;
  variant?: number;
  zIndex: number;
}>;

export default function Animation({
  cell = 0,
  delay,
  direction = 'left',
  frames,
  initialDelay: _initialDelay,
  onComplete,
  onStep,
  position,
  rate,
  repeat = 1,
  requestFrame,
  rumble,
  rumbleDuration,
  scheduleTimer,
  size,
  sound,
  trailingDelay,
  variant,
  zIndex,
  ...props
}: AnimationProps &
  Readonly<{
    cell?: number;
    frames: ReadonlyArray<CSSProperties>;
    position: Vector;
    repeat?: number;
    rumble?: Rumble;
    rumbleDuration?: number;
  }> &
  ({ sprite?: SpriteVariant } | { source?: string })) {
  const shouldHide = _initialDelay !== 0;
  const delayIsArray = Array.isArray(delay);
  const initialDelay = _initialDelay || (delayIsArray ? delay[0] : delay);

  useEffect(() => {
    if (sound || rumble) {
      const timer = setTimeout(() => {
        if (sound) {
          AudioPlayer.playSound(sound, rate);
        }

        if (rumble && rumbleDuration != null && rumbleDuration > 0) {
          rumbleEffect(rumble, rumbleDuration - initialDelay);
        }
      }, initialDelay);
      return () => clearTimeout(timer);
    }
  }, [initialDelay, rate, rumble, rumbleDuration, sound]);

  const setRef = useCallback(
    async (element: HTMLDivElement) => {
      if (!element) {
        return;
      }
      const { style } = element;
      let frame = shouldHide ? -1 : 0;
      let repeats = 1;

      const next = async () => {
        style.display = 'block';
        if (frame < frames.length - 1) {
          onStep?.(frame + 1);
          Object.assign(style, frames[++frame]);
          await scheduleTimer(next, delayIsArray ? delay[frame] : delay);
        } else if (repeats < repeat) {
          repeats++;
          frame = 0;
          Object.assign(style, frames[frame]);
          await scheduleTimer(next, delayIsArray ? delay[frame] : delay);
        } else {
          style.display = 'none';
          if (onComplete) {
            if (trailingDelay) {
              scheduleTimer(onComplete, trailingDelay);
            } else {
              requestFrame(onComplete);
            }
          }
        }
      };
      await scheduleTimer(next, initialDelay);
    },
    [
      delay,
      delayIsArray,
      frames,
      initialDelay,
      onComplete,
      onStep,
      repeat,
      requestFrame,
      scheduleTimer,
      shouldHide,
      trailingDelay,
    ],
  );

  return (
    <div
      className={
        'sprite' in props && props.sprite
          ? sprite(props.sprite, variant)
          : undefined
      }
      ref={setRef}
      style={{
        ...('source' in props && props.source
          ? { backgroundImage: `url('${props.source}')` }
          : null),
        backgroundPosition: `${-cell * size}px 0`,
        backgroundRepeat: 'no-repeat',
        display: shouldHide ? 'none' : 'block',
        height: size,
        imageRendering: 'pixelated',
        left: position.x,
        pointerEvents: 'none',
        position: 'absolute',
        top: position.y,
        transform: directions[direction],
        width: size,
        zIndex,
        ...frames[0],
      }}
    />
  );
}

const directions = {
  down: `rotate(90deg)`,
  left: `scale(1, 1)`,
  right: `scale(-1, 1)`,
  up: `rotate(-90deg)`,
};
