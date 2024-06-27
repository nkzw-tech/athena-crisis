import cssVar, { applyVar } from '@deities/ui/cssVar.tsx';
import getColor from '@deities/ui/getColor.tsx';
import pixelBorder from '@deities/ui/pixelBorder.tsx';
import Portal from '@deities/ui/Portal.tsx';
import { css } from '@emotion/css';
import { motion } from 'framer-motion';
import { BaseAnimationProps, NoticeAnimation } from '../MapAnimations.tsx';
import useSkipAnimation from './lib/useSkipAnimation.tsx';

export default function Notice(
  props: Omit<NoticeAnimation, 'onComplete' | 'type'> & BaseAnimationProps,
) {
  if (useSkipAnimation(props)) {
    return null;
  }

  const { animationConfig, color, onComplete, scheduleTimer, text, zIndex } =
    props;

  return (
    <Portal>
      <motion.div
        animate={{
          opacity: 1,
          transform: 'scale(1) translate3d(0, 0%, 0)',
        }}
        className={style}
        exit={{
          opacity: 0,
          transform: 'scale(0.9) translate3d(0, 100%, 0)',
        }}
        initial={{
          opacity: 0,
          transform: 'scale(0.9) translate3d(0, 100%, 0)',
        }}
        onAnimationComplete={() =>
          scheduleTimer(
            () => onComplete(),
            animationConfig.AnimationDuration * 10,
          )
        }
        style={{
          ...(color
            ? { [cssVar('background-color')]: getColor(color, 0.9) }
            : null),
          zIndex,
        }}
        transition={{
          default: {
            duration: 0.25,
            ease: [0.34, 1.56, 0.64, 1],
          },
          opacity: {
            duration: 0.15,
            ease: 'ease',
          },
        }}
      >
        {text}
      </motion.div>
    </Portal>
  );
}

const style = css`
  ${pixelBorder(applyVar('background-color-light'))}

  align-items: center;
  backdrop-filter: blur(4px);
  background: ${applyVar('background-color')};
  bottom: 24px;
  color: ${applyVar('text-color-active-light')};
  display: flex;
  flex-direction: row;
  font-size: 1.5em;
  justify-content: center;
  left: 0;
  line-height: 1.4em;
  margin: 0 auto;
  max-width: max(40%, 320px);
  min-height: 48px;
  min-width: 180px;
  opacity: 0;
  padding: 10px 10px 8px;
  pointer-events: none;
  position: fixed;
  right: 0;
  text-align: center;
  text-shadow: 1.5px 1.5px 0 rgba(0, 0, 0, 0.7);
  text-wrap: balance;
`;
