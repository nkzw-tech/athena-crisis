import { SoundName } from '@deities/athena/info/Music.tsx';
import { AnimationConfig } from '@deities/athena/map/Configuration.tsx';
import { PlayerID } from '@deities/athena/map/Player.tsx';
import AudioPlayer from '@deities/ui/AudioPlayer.tsx';
import Breakpoints from '@deities/ui/Breakpoints.tsx';
import { isSafari } from '@deities/ui/Browser.tsx';
import { CSSVariables } from '@deities/ui/cssVar.tsx';
import { BaseColor } from '@deities/ui/getColor.tsx';
import gradient from '@deities/ui/gradient.tsx';
import Portal from '@deities/ui/Portal.tsx';
import { css, cx, keyframes } from '@emotion/css';
import { Sprites } from 'athena-crisis:images';
import { motion, Variants } from 'framer-motion';
import { useEffect } from 'react';
import { ClearTimerFunction, TimerFunction } from '../Types.tsx';
import useSkipAnimation from './lib/useSkipAnimation.tsx';

const multiplier = process.env.NODE_ENV === 'development' ? 3 : 1.5;
const transition = {
  damping: 14 * multiplier,
  stiffness: 250 * multiplier,
  type: 'spring',
};

export default function Banner(props: {
  animationConfig: AnimationConfig;
  clearTimer: ClearTimerFunction;
  color?: BaseColor | ReadonlyArray<BaseColor>;
  length: 'short' | 'medium' | 'long';
  onComplete: () => void;
  player: PlayerID;
  rate: number;
  scheduleTimer: TimerFunction;
  sound: SoundName | null;
  style?: 'regular' | 'flashy';
  text: string;
  zIndex: number;
}) {
  const {
    animationConfig,
    clearTimer,
    color,
    length,
    onComplete,
    player,
    rate,
    scheduleTimer,
    sound,
    style,
    text,
    zIndex,
  } = props;

  const words = text.trim().split(' ');

  useEffect(() => {
    if (sound) {
      const timer = scheduleTimer(
        () => AudioPlayer.playSound(sound, rate),
        (rate * animationConfig.AnimationDuration) / 4,
      );
      return () => clearTimer(timer);
    }
  }, [
    animationConfig.AnimationDuration,
    clearTimer,
    rate,
    scheduleTimer,
    sound,
  ]);

  if (useSkipAnimation(props)) {
    return null;
  }

  const duration = animationConfig.AnimationDuration / 1000 / multiplier;
  const direction = player === 0 || player % 2 ? 1 : -1;
  const isFlashy = style === 'flashy';
  const child: Variants = {
    hidden: {
      opacity: 0,
      transition,
      x: isFlashy ? (direction === 1 ? '-100%' : '100%') : '',
      y: 20,
    },
    visible: {
      opacity: 1,
      transition,
      x: '0%',
      y: 0,
    },
  };

  return (
    <Portal>
      <motion.div
        className={containerStyle}
        exit={{
          opacity: 0,
        }}
        initial={{
          opacity: 1,
        }}
        style={{ zIndex }}
        transition={{
          duration,
        }}
      >
        <motion.div
          animate="visible"
          className={cx(innerStyle, isFlashy && flashyInnerStyle)}
          initial="hidden"
          variants={{
            hidden: {
              opacity: 0,
            },
            visible: {
              opacity: 1,
              transition: {
                delayChildren: duration / 1.5,
                duration,
                staggerChildren: duration / 10,
              },
            },
          }}
        >
          <div
            className={cx(
              backgroundStyle,
              isFlashy
                ? direction === 1
                  ? flashyRightStyle
                  : flashyLeftStyle
                : direction === 1
                  ? backgroundRightStyle
                  : backgroundLeftStyle,
            )}
            style={{
              background: gradient(color, 0.9),
            }}
          />
          {words.flatMap((word, wordIndex) => [
            ...(isSafari ? [word] : Array.from(word)).map((letter, index) => (
              <motion.span
                className={letterStyle}
                key={`${wordIndex}$${index}`}
                onAnimationComplete={
                  wordIndex === words.length - 1 &&
                  (isSafari || index === word.length - 1)
                    ? () => {
                        scheduleTimer(
                          onComplete,
                          animationConfig.AnimationDuration *
                            (length === 'short'
                              ? 1
                              : length === 'medium'
                                ? 3
                                : 5),
                        );
                      }
                    : undefined
                }
                variants={child}
              >
                {letter}
              </motion.span>
            )),
            ' ',
          ])}
        </motion.div>
      </motion.div>
    </Portal>
  );
}

const vars = new CSSVariables<'multiplier'>('ui-b');

const containerStyle = css`
  align-items: center;
  display: flex;
  image-rendering: pixelated;
  inset: 0;
  justify-content: center;
  pointer-events: none;
  position: fixed;
`;

const innerStyle = css`
  ${vars.set('multiplier', 2)}

  border-bottom: calc(${vars.apply('multiplier')} * 1.5px) solid #fff;
  border-top: calc(${vars.apply('multiplier')} * 1.5px) solid #fff;
  color: #fff;
  font-size: calc(${vars.apply('multiplier')} * 12px);
  line-height: calc(${vars.apply('multiplier')} * 18px);
  overflow: hidden;
  padding-bottom: 8px;
  padding: 8px 16px;
  position: relative;
  text-align: center;
  text-shadow: rgba(0, 0, 0, 0.8) calc(${vars.apply('multiplier')} * 1px)
    calc(${vars.apply('multiplier')} * 1px) 0;
  text-wrap: balance;
  width: 100%;
  word-break: break-word;
  white-space-collapse: break-spaces;

  ${Breakpoints.sm} {
    ${vars.set('multiplier', 4)}

    padding: 8px 16px 16px;
    line-height: calc(${vars.apply('multiplier')} * 14px);
  }
`;

const flashyInnerStyle = css`
  backdrop-filter: blur(4px);
  padding: 36px 16px 38px;
  text-transform: uppercase;

  ${Breakpoints.sm} {
    padding: 48px 16px 54px;
  }
`;

const noise = new Image();
noise.src = Sprites.Noise;

const backgroundStyle = css`
  inset: -720px;
  mask-image: url('${Sprites.Noise}'),
    linear-gradient(
      to bottom right,
      rgba(0, 0, 0, 0.7) 0%,
      rgba(0, 0, 0, 0.7) 50%
    );
  position: absolute;
`;

const backgroundLeftStyle = css`
  animation: ${keyframes`
    0% {
      transform: translate3d(0, 0, 0);
    }
    100% {
      transform: translate3d(-72px, 72px, 0);
    }
  `} 5s linear infinite;
`;

const backgroundRightStyle = css`
  animation: ${keyframes`
    0% {
      transform: translate3d(0, 0, 0);
    }
    100% {
      transform: translate3d(72px, 72px, 0);
    }
  `} 5s linear infinite;
`;

const flashyLeftStyle = css`
  animation: ${keyframes`
    0% {
      transform: translate3d(0, 0, 0);
    }
    100% {
      transform: translate3d(-360px, 0, 0);
    }
  `} 3s linear infinite;
`;

const flashyRightStyle = css`
  animation: ${keyframes`
    0% {
      transform: translate3d(0, 0, 0);
    }
    100% {
      transform: translate3d(360px, 0, 0);
    }
  `} 3s linear infinite;
`;

const letterStyle = css`
  display: inline-block;
  position: relative;
`;
