import { getUnitInfo } from '@deities/athena/info/Unit.tsx';
import { DoubleSize } from '@deities/athena/map/Configuration.tsx';
import AudioPlayer from '@deities/ui/AudioPlayer.tsx';
import Breakpoints, { lg, sm } from '@deities/ui/Breakpoints.tsx';
import throttle from '@deities/ui/controls/throttle.tsx';
import useInput from '@deities/ui/controls/useInput.tsx';
import cssVar, { CSSVariables } from '@deities/ui/cssVar.tsx';
import gradient from '@deities/ui/gradient.tsx';
import Icon from '@deities/ui/Icon.tsx';
import pixelBorder from '@deities/ui/pixelBorder.tsx';
import Portal from '@deities/ui/Portal.tsx';
import { css, cx, keyframes } from '@emotion/css';
import Forward from '@iconify-icons/pixelarticons/reply.js';
import { Sprites } from 'athena-crisis:images';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Portrait, { PortraitWidth } from '../character/Portrait.tsx';
import {
  BaseAnimationProps,
  CharacterMessageAnimation,
} from '../MapAnimations.tsx';
import formatCharacterText from './lib/formatCharacterText.tsx';
import measureText from './lib/measureText.tsx';
import useSkipAnimation from './lib/useSkipAnimation.tsx';

type Props = Omit<CharacterMessageAnimation, 'onComplete'> &
  BaseAnimationProps & { userDisplayName: string };

const sizes = {
  fontSize: 9,
  letterSpacing: 1,
  padding: 20,
};

const MessageComponent = ({
  animationConfig,
  clearTimer,
  factionNames,
  map,
  onComplete,
  player,
  position,
  scheduleTimer,
  text,
  unitId,
  userDisplayName,
  variant,
  viewer,
}: Props) => {
  const unit = getUnitInfo(unitId);
  if (!unit) {
    throw new Error(`Character Message: Invalid unit id ${unitId}.`);
  }

  const duration = animationConfig.MessageSpeed / 1000;
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

  const sound =
    unit.gender === 'male'
      ? 'Talking/Low'
      : unit.gender === 'female'
        ? 'Talking/High'
        : 'Talking/Mid';

  const [timer, setTimer] = useState<Promise<number> | null>(null);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [currentComplete, setCurrentComplete] = useState(false);

  const viewerIsPlayer = viewer != null && viewer === player;
  const nameType = viewerIsPlayer ? 'characterName' : 'name';
  const [currentText, setCurrentText] = useState(() =>
    formatCharacterText(
      text,
      unit,
      nameType,
      map,
      userDisplayName,
      player,
      factionNames,
    ),
  );
  const [currentLine, setCurrentLine] = useState(0);
  const [clientWidth, setClientWidth] = useState<number>(
    () => document.body.clientWidth,
  );
  const isLarge = clientWidth >= sm;
  const [multiplier, width] = isLarge
    ? [4, Math.min(clientWidth * 0.8, lg)]
    : [2, clientWidth];
  const portraitScale = Math.max(2, multiplier) / 2;
  const lines = useMemo(
    () =>
      measureText(
        currentText,
        (width - PortraitWidth * portraitScale - sizes.padding) / multiplier,
        sizes,
      ),
    [currentText, width, portraitScale, multiplier],
  );
  const words = [
    ...(lines[currentLine]?.split(' ') || []),
    ...(lines[currentLine + 1]?.split(' ') || []),
  ];

  // Avoid double invocations of onComplete.
  const done = useRef(false);
  const hasNext = lines.length > currentLine + 2;

  const next = useCallback(() => {
    const isComplete = currentComplete;
    setCurrentComplete(false);

    if (timer) {
      clearTimer(timer);
    }

    if (!animationComplete && !isComplete) {
      AudioPlayer.stop(sound);
      setAnimationComplete(true);
    } else if (hasNext) {
      AudioPlayer.playOrContinueSound(sound);
      setAnimationComplete(false);
      setCurrentLine(currentLine + 2);
    } else if (!done.current) {
      AudioPlayer.stop(sound);
      done.current = true;
      onComplete();
    }
  }, [
    currentComplete,
    timer,
    animationComplete,
    hasNext,
    clearTimer,
    sound,
    currentLine,
    onComplete,
  ]);

  useInput('accept', next);
  useEffect(() => {
    document.body.addEventListener('click', next);
    return () => {
      document.body.removeEventListener('click', next);
    };
  }, [next]);

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

  useEffect(() => {
    AudioPlayer.playSound(sound);

    return () => AudioPlayer.stop(sound);
  }, [sound]);

  const isBottom = position === 'bottom';
  const offset = isBottom ? 20 : -20;
  return (
    <Portal>
      <motion.div
        animate={{
          opacity: 1,
          transform: `translate3d(0px, ${0}px, 0px)`,
        }}
        className={cx(containerStyle, isBottom && bottomStyle)}
        exit={{
          opacity: 0,
          transform: `translate3d(0px, ${offset * (isLarge ? -1 : 1)}px, 0px)`,
        }}
        initial={{
          opacity: 0,
          transform: `translate3d(0px, ${offset}px, 0px)`,
        }}
        transition={{
          duration,
        }}
      >
        <div className={cx(innerStyle, isBottom && innerBottomStyle)}>
          <div className={borderStyle}>
            <Portrait
              animate
              clip={false}
              paused={currentComplete || animationComplete}
              player={player}
              scale={portraitScale}
              unit={unit}
              variant={variant}
            />
          </div>
          <motion.div
            animate="visible"
            className={cx(messageStyle, borderStyle)}
            initial="hidden"
            variants={{
              hidden: {
                opacity: 0,
              },
              visible: {
                opacity: 1,
              },
            }}
          >
            <div
              className={backgroundStyle}
              style={{
                background: gradient(player, 1),
              }}
            />
            <motion.div
              animate="visible"
              initial="hidden"
              key={currentLine}
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
              {words.flatMap((word, wordIndex) => [
                ...Array.from(word).map((letter, index) =>
                  animationComplete ? (
                    <span
                      className={letterStyle}
                      key={`${currentLine}$${wordIndex}$${index}`}
                    >
                      {letter}
                    </span>
                  ) : (
                    <motion.span
                      className={letterStyle}
                      key={`${currentLine}$${wordIndex}$${index}`}
                      onAnimationComplete={
                        wordIndex === words.length - 1 &&
                        index === word.length - 1
                          ? () => {
                              AudioPlayer.stop(sound);
                              setCurrentComplete(true);
                              setTimer(scheduleTimer(next, 3500));
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
              ])}
              {hasNext &&
                (animationComplete ? (
                  <span className={iconStyle} key={currentLine}>
                    <Icon className={iconAnimationStyle} icon={Forward} />
                  </span>
                ) : (
                  <motion.div
                    className={iconStyle}
                    key={currentLine}
                    variants={child}
                  >
                    <Icon className={iconAnimationStyle} icon={Forward} />
                  </motion.div>
                ))}
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </Portal>
  );
};

export default function CharacterMessage(props: Props) {
  return useSkipAnimation(props) ? null : <MessageComponent {...props} />;
}

const vars = new CSSVariables<'multiplier' | 'color' | 'color-light'>('ui-m');

const containerStyle = css`
  align-items: start;
  display: flex;
  image-rendering: pixelated;
  inset: 0;
  pointer-events: none;
  position: fixed;
  z-index: 3001;
`;

const bottomStyle = css`
  align-items: end;
`;

const innerStyle = css`
  ${vars.set('color', `var(${cssVar('background-color-bright')})`)}
  ${vars.set('color-light', `var(${cssVar('border-color')})`)}

  display: flex;
  filter: drop-shadow(0 0 4px ${vars.apply('color-light')});
  flex-direction: row;
  gap: 0;
  margin: 0 auto;
  padding: 0;
  position: relative;
  width: 100%;

  ${Breakpoints.sm} {
    gap: 24px;
    padding: ${DoubleSize * 2}px 0 0;
    width: min(80vw, ${lg}px);
  }
`;

const innerBottomStyle = css`
  ${Breakpoints.sm} {
    padding: 0 0 ${DoubleSize * 2}px;
  }
`;

const messageStyle = css`
  ${vars.set('multiplier', 2)}

  background-color: #fff;
  color: #fff;
  flex: 1;
  font-size: calc(${vars.apply('multiplier')} * ${sizes.fontSize}px);
  height: calc(${vars.apply('multiplier')} * 37.5px);
  letter-spacing: ${sizes.letterSpacing}px;
  line-height: calc(${vars.apply('multiplier')} * 14px);
  overflow: hidden;
  position: relative;
  text-align: left;
  text-shadow: rgba(0, 0, 0, 0.8) calc(${vars.apply('multiplier')} * 0.75px)
    calc(${vars.apply('multiplier')} * 0.75px) 0;

  padding: calc(${vars.apply('multiplier')} * 3.5px) ${sizes.padding / 2}px 0;
  ${Breakpoints.sm} {
    padding: calc(${vars.apply('multiplier')} * 3.5px) ${sizes.padding}px 0;
    ${vars.set('multiplier', 4)}
  }
`;

const backgroundStyle = css`
  inset: 0;
  mask-image: url('${Sprites.Noise}'),
    linear-gradient(
      to bottom right,
      rgba(0, 0, 0, 0.9) 0%,
      rgba(0, 0, 0, 0.9) 50%
    );
  position: absolute;
`;

const borderStyle = css`
  ${pixelBorder(vars.apply('color'), 2)}
  ${Breakpoints.sm} {
    ${pixelBorder(vars.apply('color'), 4)}
  }
`;

const letterStyle = css`
  position: relative;
`;

const iconStyle = css`
  bottom: 8px;
  color: #fff;
  filter: drop-shadow(0px -0.75px 0px #000) drop-shadow(-0.75px 0px 0px #000);
  height: 16px;
  position: absolute;
  right: 4px;
  transform: scale(-1, 1) rotate(-90deg);
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
