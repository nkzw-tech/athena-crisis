import { AnimationConfig } from '@deities/athena/map/Configuration.tsx';
import AudioPlayer from '@deities/ui/AudioPlayer.tsx';
import Breakpoints, { sm } from '@deities/ui/Breakpoints.tsx';
import { isSafari } from '@deities/ui/Browser.tsx';
import throttle from '@deities/ui/controls/throttle.tsx';
import { CSSVariables } from '@deities/ui/cssVar.tsx';
import gradient from '@deities/ui/gradient.tsx';
import Portal from '@deities/ui/Portal.tsx';
import { css, cx, keyframes } from '@emotion/css';
import { Sprites } from 'athena-crisis:images';
import { motion, Variants } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { BannerAnimation, BaseAnimationProps } from '../MapAnimations.tsx';
import measureText from './lib/measureText.tsx';
import useSkipAnimation from './lib/useSkipAnimation.tsx';

const multiplier = process.env.NODE_ENV === 'development' ? 3 : 1.5;
const transition = {
  damping: 14 * multiplier,
  stiffness: 250 * multiplier,
  type: 'spring',
};

const sizes = {
  fontSize: 12,
  letterSpacing: 1,
  padding: 16,
};

export default function Banner(
  props: Omit<BannerAnimation, 'onComplete'> & BaseAnimationProps,
) {
  const {
    clearTimer,
    color,
    component: Component,
    direction: initialDirection,
    length,
    onComplete,
    padding,
    player,
    rate,
    scheduleTimer,
    sound,
    style,
    text,
    zIndex,
  } = props;

  const [showComponent, setShowComponent] = useState(false);
  const [clientWidth, setClientWidth] = useState<number>(
    () => document.body.clientWidth,
  );
  const isLarge = clientWidth >= sm;
  const lines = useMemo(
    () =>
      measureText(
        text.toLocaleUpperCase(),
        (clientWidth - sizes.padding) / (isLarge ? 4 : 2),
        sizes,
      ),
    [text, clientWidth, isLarge],
  );

  useEffect(() => {
    const listener = throttle(
      () => setClientWidth(document.body.clientWidth),
      100,
    );
    window.addEventListener('resize', listener);
    return () => window.removeEventListener('resize', listener);
  }, [clientWidth]);

  useEffect(() => {
    if (sound) {
      const timer = scheduleTimer(
        () => AudioPlayer.playSound(sound, rate),
        (rate * AnimationConfig.AnimationDuration) / 4,
      );
      return () => clearTimer(timer);
    }
  }, [clearTimer, rate, scheduleTimer, sound]);

  if (useSkipAnimation(props)) {
    return null;
  }

  const duration = AnimationConfig.AnimationDuration / 1000 / multiplier;
  const direction =
    initialDirection || (player === 0 || player % 2 ? 'right' : 'left');
  const isFlashy = style === 'flashy';
  const child: Variants = {
    hidden: {
      opacity: 0,
      transition,
      x:
        isFlashy && direction !== 'up'
          ? direction === 'right'
            ? '-100%'
            : '100%'
          : '',
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
          className={cx(
            innerStyle,
            isFlashy && flashyInnerStyle,
            padding !== 'small' && largePaddingStyle,
          )}
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
              (isFlashy ? flashyBackgroundStyle : backgroundAnimationStyle)[
                direction
              ],
            )}
            style={{
              background: gradient(color, 0.9),
            }}
          />
          {lines.flatMap((line, lineIndex) => {
            const words = line.split(' ');
            return [
              ...words.flatMap((word, wordIndex) => [
                ...(isSafari ? [word] : Array.from(word)).map(
                  (letter, index) => (
                    <motion.span
                      className={letterStyle}
                      key={`${lineIndex}$${wordIndex}$${index}`}
                      onAnimationComplete={
                        lineIndex === lines.length - 1 &&
                        wordIndex === words.length - 1 &&
                        (isSafari || index === word.length - 1)
                          ? () => {
                              setShowComponent(true);
                              scheduleTimer(
                                onComplete,
                                AnimationConfig.AnimationDuration *
                                  (length === 'short'
                                    ? 1
                                    : length === 'medium'
                                      ? 3
                                      : 6) *
                                  (Component ? 4.5 : 1),
                              );
                            }
                          : undefined
                      }
                      variants={child}
                    >
                      {letter}
                    </motion.span>
                  ),
                ),
                ' ',
              ]),
              <br key={`br-${lineIndex}`} />,
            ];
          })}
          {Component && (
            <Component duration={duration} isVisible={showComponent} />
          )}
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
  font-size: calc(${vars.apply('multiplier')} * ${sizes.fontSize}px);
  letter-spacing: ${sizes.letterSpacing}px;
  line-height: calc(${vars.apply('multiplier')} * 18px);
  overflow: hidden;
  padding-bottom: 8px;
  padding: 8px ${sizes.padding}px;
  position: relative;
  text-align: center;
  text-shadow: rgba(0, 0, 0, 0.8) calc(${vars.apply('multiplier')} * 1px)
    calc(${vars.apply('multiplier')} * 1px) 0;
  text-wrap: balance;
  white-space: nowrap;
  width: 100%;

  ${Breakpoints.sm} {
    ${vars.set('multiplier', 4)}

    padding: 8px ${sizes.padding}px 16px;
    line-height: calc(${vars.apply('multiplier')} * 14px);
  }
`;

const flashyInnerStyle = css`
  backdrop-filter: blur(4px);
  text-transform: uppercase;

  padding: 12px ${sizes.padding}px 14px;

  ${Breakpoints.sm} {
    padding: 16px ${sizes.padding}px 18px;
  }
`;

const largePaddingStyle = css`
  padding: 36px ${sizes.padding}px 38px;

  ${Breakpoints.sm} {
    padding: 48px ${sizes.padding}px 54px;
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

const backgroundAnimationStyle = {
  left: css`
    animation: ${keyframes`
    0% {
      transform: translate3d(0, 0, 0);
    }
    100% {
      transform: translate3d(-72px, 72px, 0);
    }
  `} 5s linear infinite;
  `,

  right: css`
    animation: ${keyframes`
    0% {
      transform: translate3d(0, 0, 0);
    }
    100% {
      transform: translate3d(72px, 72px, 0);
    }
  `} 5s linear infinite;
  `,

  up: css`
    animation: ${keyframes`
    0% {
      transform: translate3d(0, 0, 0);
    }
    100% {
      transform: translate3d(0, -72px, 0);
    }
    `} 5s linear infinite;
  `,
};

const flashyBackgroundStyle = {
  left: css`
    animation: ${keyframes`
    0% {
      transform: translate3d(0, 0, 0);
    }
    100% {
      transform: translate3d(-360px, 0, 0);
    }
  `} 3s linear infinite;
  `,

  right: css`
    animation: ${keyframes`
    0% {
      transform: translate3d(0, 0, 0);
    }
    100% {
      transform: translate3d(360px, 0, 0);
    }
  `} 3s linear infinite;
  `,

  up: css`
    animation: ${keyframes`
    0% {
      transform: translate3d(0, 0, 0);
    }
    100% {
      transform: translate3d(0, -360px, 0);
    }
    `} 3s linear infinite;
  `,
};

const letterStyle = css`
  display: inline-block;
  position: relative;
`;
