import { AnimationConfig } from '@deities/athena/map/Configuration.tsx';
import Breakpoints, { sm } from '@deities/ui/Breakpoints.tsx';
import throttle from '@deities/ui/controls/throttle.tsx';
import useInput from '@deities/ui/controls/useInput.tsx';
import { CSSVariables } from '@deities/ui/cssVar.tsx';
import gradient from '@deities/ui/gradient.tsx';
import Icon from '@deities/ui/Icon.tsx';
import Portal from '@deities/ui/Portal.tsx';
import { css, cx, keyframes } from '@emotion/css';
import Forward from '@iconify-icons/pixelarticons/reply.js';
import { Sprites } from 'athena-crisis:images';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BaseAnimationProps, MessageAnimation } from '../MapAnimations.tsx';
import measureText from './lib/measureText.tsx';
import useSkipAnimation from './lib/useSkipAnimation.tsx';

type Props = Omit<MessageAnimation, 'onComplete'> & BaseAnimationProps;

const sizes = {
  fontSize: 9,
  letterSpacing: 1,
  padding: 20,
};

const MessageComponent = ({
  clearTimer,
  color,
  onComplete,
  position,
  scheduleTimer,
  text,
}: Props) => {
  const duration = AnimationConfig.AnimationDuration / 1000;
  const transition = {
    duration: duration / 2,
  };
  const child = {
    hidden: {
      opacity: 0,
      transition,
    },
    visible: {
      opacity: 1,
      transition,
    },
  };

  const [timer, setTimer] = useState<Promise<number> | null>(null);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [currentText, setCurrentText] = useState(text);
  const [currentLine, setCurrentLine] = useState(0);
  const [clientWidth, setClientWidth] = useState<number>(
    () => document.body.clientWidth,
  );
  const multiplier = clientWidth >= sm ? 4 : 2;
  const lines = useMemo(
    () =>
      measureText(
        currentText,
        (clientWidth - sizes.padding) / multiplier,
        sizes,
      ),
    [currentText, clientWidth, multiplier],
  );
  const words = [
    ...(lines[currentLine]?.split(' ') || []),
    ...(lines[currentLine + 1]?.split(' ') || []),
  ];

  useEffect(() => {
    const listener = throttle(() => {
      setClientWidth(document.body.clientWidth);
      setCurrentLine(0);
      const newText = lines.slice(currentLine).join(' ');
      if (newText) {
        setCurrentText(newText);
      } else {
        onComplete();
      }
    }, 100);
    window.addEventListener('resize', listener);
    return () => window.removeEventListener('resize', listener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLine, clientWidth, lines]);

  // Avoid double invocations of onComplete.
  const done = useRef(false);
  const complete = useRef(false);
  const hasNext = lines.length > currentLine + 2;

  const next = useCallback(() => {
    const isComplete = complete.current;
    complete.current = false;

    if (timer) {
      clearTimer(timer);
    }

    if (!animationComplete && !isComplete) {
      setAnimationComplete(true);
    } else if (hasNext) {
      setAnimationComplete(false);
      setCurrentLine(currentLine + 2);
    } else if (!done.current) {
      done.current = true;
      onComplete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer, animationComplete, hasNext, clearTimer, currentLine]);

  useInput('accept', next);
  useEffect(() => {
    document.body.addEventListener('click', next);
    return () => {
      document.body.removeEventListener('click', next);
    };
  }, [next]);

  return (
    <Portal>
      <motion.div
        className={cx(
          containerStyle,
          position === 'top' ? topStyle : bottomStyle,
        )}
        exit={{
          opacity: 0,
        }}
        initial={{
          opacity: 1,
        }}
        transition={{
          duration,
        }}
      >
        <motion.div
          animate="visible"
          className={innerStyle}
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
            className={backgroundStyle}
            style={{
              background: gradient(color, 1),
            }}
          />
          {words.flatMap((word, wordIndex) => [
            ...Array.from(word).map((letter, index) => (
              <motion.span
                className={letterStyle}
                key={`${currentLine}$${wordIndex}$${index}`}
                onAnimationComplete={
                  wordIndex === words.length - 1 && index === word.length - 1
                    ? () => {
                        setTimer(scheduleTimer(next, 3500));
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
          {hasNext && (
            <motion.div
              className={iconStyle}
              key={currentLine}
              variants={child}
            >
              <Icon className={iconAnimationStyle} icon={Forward} />
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </Portal>
  );
};

export default function Message(props: Props) {
  return useSkipAnimation(props) ? null : <MessageComponent {...props} />;
}

const vars = new CSSVariables<'multiplier'>('ui-m');

const containerStyle = css`
  display: flex;
  image-rendering: pixelated;
  inset: 0;
  pointer-events: none;
  position: fixed;
  z-index: 3001;
`;

const topStyle = css`
  align-items: start;
  justify-content: start;
`;

const bottomStyle = css`
  align-items: end;
  justify-content: end;
`;

const innerStyle = css`
  ${vars.set('multiplier', 2)}

  background-color: #fff;
  color: #fff;
  letter-spacing: ${sizes.letterSpacing}px;
  padding: 6px ${sizes.padding}px;
  pointer-events: none;
  position: relative;
  text-align: left;
  width: 100%;

  border-bottom: calc(${vars.apply('multiplier')} * 1px) solid #fff;
  border-top: calc(${vars.apply('multiplier')} * 1px) solid #fff;
  font-size: calc(${vars.apply('multiplier')} * ${sizes.fontSize}px);
  line-height: calc(${vars.apply('multiplier')} * 14px);
  height: calc(${vars.apply('multiplier')} * 36px);
  text-shadow: rgba(0, 0, 0, 0.8) calc(${vars.apply('multiplier')} * 0.75px)
    calc(${vars.apply('multiplier')} * 0.75px) 0;

  ${Breakpoints.sm} {
    ${vars.set('multiplier', 4)}
  }
`;

const backgroundStyle = css`
  bottom: 0;
  left: 0;
  mask-image: url('${Sprites.Noise}'),
    linear-gradient(
      to bottom right,
      rgba(0, 0, 0, 0.9) 0%,
      rgba(0, 0, 0, 0.9) 50%
    );
  position: absolute;
  right: 0;
  top: 0;
`;

const letterStyle = css`
  position: relative;
`;

const iconStyle = css`
  bottom: 8px;
  color: #fff;
  filter: drop-shadow(0px -0.75px 0px black) drop-shadow(-0.75px 0px 0px black);
  height: 16px;
  position: absolute;
  transform: scale(-1, 1) rotate(-90deg);
  right: 4px;
  width: 16px;
`;

const iconAnimationStyle = css`
  animation: 2s infinite ${keyframes`
    0%, 30% {
      opacity: 1;
    }
    70% {
      opacity: 0.3;
    }
    100% {
      opacity: 1;
    }
  `};
`;
