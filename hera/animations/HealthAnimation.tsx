import { AnimationConfig } from '@deities/athena/map/Configuration.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import { isIOS, isSafari } from '@deities/ui/Browser.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import getColor from '@deities/ui/getColor.tsx';
import pixelBorder from '@deities/ui/pixelBorder.tsx';
import { css } from '@emotion/css';
import { motion } from 'framer-motion';
import React, { useEffect } from 'react';
import getDamageColor from '../behavior/attack/getDamageColor.tsx';
import { ClearTimerFunction, TimerFunction } from '../Types.tsx';

export default function HealthAnimation({
  animationConfig,
  change,
  clearTimer,
  onComplete,
  position,
  previousHealth,
  scheduleTimer,
  tileSize,
  zIndex,
}: {
  animationConfig: AnimationConfig;
  change: number;
  clearTimer: ClearTimerFunction;
  onComplete?: () => void;
  position: Vector;
  previousHealth: number;
  scheduleTimer: TimerFunction;
  tileSize: number;
  zIndex: number;
}) {
  useEffect(() => {
    if (onComplete) {
      const timer = scheduleTimer(
        onComplete,
        animationConfig.AnimationDuration * 1.5,
      );
      return () => clearTimer(timer);
    }
  }, [
    animationConfig.AnimationDuration,
    clearTimer,
    onComplete,
    scheduleTimer,
  ]);

  if (onComplete && animationConfig.Instant) {
    return null;
  }

  const color =
    change == 0
      ? 'error'
      : change > 0
        ? 'green'
        : getDamageColor(Math.abs(change), previousHealth);
  return (
    <motion.div
      animate={{
        opacity: 1,
        transform: 'translate3d(-50%, 0px, 0)',
      }}
      className={style}
      exit={{
        opacity: 0,
        transform: 'translate3d(-50%, -6px, 0)',
      }}
      initial={{
        opacity: 0,
        transform: 'translate3d(-50%, 10px, 0)',
      }}
      key={`damage-${position}`}
      style={{
        color: color ? getColor(color === 'error' ? 'red' : color) : undefined,
        left: `${(position.x - 0.5) * tileSize}px`,
        padding: change == 0 ? '1px 2.5px 2.5px' : '0 1.5px 1.5px',
        textShadow: color ? '0.5px 0.5px 0 rgba(0, 0, 0, 0.4)' : undefined,
        top: `${(position.y - 1.6) * tileSize}px`,
        zIndex,
      }}
      transition={{
        duration: animationConfig.AnimationDuration / 2 / 1000,
      }}
    >
      {change == 0 ? (
        <fbt desc="No damage label">No damage!</fbt>
      ) : (
        `${change < 0 ? '-' : '+'}${Math.abs(change)}`
      )}
    </motion.div>
  );
}

const style = css`
  ${pixelBorder(applyVar('background-color-light'), 1)}
  align-items: center;
  backdrop-filter: blur(4px);
  background: ${applyVar('background-color-light')};
  display: flex;
  filter: drop-shadow(rgb(0, 0, 0, 0.2) 0 0 1px);
  font-size: ${isSafari && isIOS ? `0.9` : `0.45`}em;
  justify-content: center;
  pointer-events: none;
  position: absolute;
  white-space: nowrap;
`;
