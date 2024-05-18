import type { SoundName } from '@deities/athena/info/Music.tsx';
import type { AnimationConfig } from '@deities/athena/map/Configuration.tsx';
import type Vector from '@deities/athena/map/Vector.tsx';
import AudioPlayer from '@deities/ui/AudioPlayer.tsx';
import { css } from '@emotion/css';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import React, { useEffect } from 'react';
import type { ClearTimerFunction, TimerFunction } from '../Types.tsx';
import Flyout from './Flyout.tsx';

export default function FlashFlyout({
  align,
  animationConfig,
  clearTimer,
  items,
  mini,
  onComplete,
  position,
  rate,
  scheduleTimer,
  sound,
  tileSize,
  width,
  zIndex,
}: {
  align?: 'top' | 'top-lower';
  animationConfig: AnimationConfig;
  clearTimer?: ClearTimerFunction;
  items: ReactNode | ReadonlyArray<ReactNode | null>;
  mini?: boolean;
  onComplete?: () => void;
  position: Vector;
  rate?: number;
  scheduleTimer?: TimerFunction;
  sound?: SoundName;
  tileSize: number;
  width: number;
  zIndex: number;
}) {
  useEffect(() => {
    if (sound && !animationConfig.Instant) {
      AudioPlayer.playSound(sound, rate);
    }

    if (onComplete) {
      if (!scheduleTimer || !clearTimer) {
        throw new Error(
          `FlashFlyout: 'scheduleTimer' and 'clearTimer' are required for FlashFlyout at position '${position}'.`,
        );
      }

      const timer = scheduleTimer(
        onComplete,
        animationConfig.AnimationDuration * 2,
      );
      return () => clearTimer(timer);
    }
  }, [
    animationConfig.AnimationDuration,
    animationConfig.Instant,
    clearTimer,
    onComplete,
    position,
    rate,
    scheduleTimer,
    sound,
  ]);

  if (onComplete && animationConfig.Instant) {
    return null;
  }

  return (
    <motion.div
      animate={{
        opacity: 1,
        transform: 'translate3d(0px, 0px, 0px)',
      }}
      className={flashStyle}
      exit={{
        opacity: 0,
        transform: 'translate3d(0px, 4px, 0px)',
      }}
      initial={{
        opacity: 0,
        transform: 'translate3d(0px, -4px, 0px)',
      }}
      key={`flyout${position.toString()}`}
      style={{ zIndex }}
      transition={{
        duration: animationConfig.AnimationDuration / 2 / 1000,
      }}
    >
      <Flyout
        align={align}
        items={items}
        key={String(position)}
        mini={mini}
        position={position}
        resetPosition={() => void 0}
        tileSize={tileSize}
        width={width}
      />
    </motion.div>
  );
}

const flashStyle = css`
  pointer-events: none;
  position: absolute;
`;
