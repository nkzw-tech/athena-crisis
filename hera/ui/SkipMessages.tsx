import Box from '@deities/ui/Box.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import pixelBorder from '@deities/ui/pixelBorder.tsx';
import { css, cx, keyframes } from '@emotion/css';
import { motion, useAnimationControls, usePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export const MessageSkipDuration = 1500;

const circleProps = {
  animate: { opacity: 1, scale: 1 },
  exit: { delay: 0, opacity: 0, scale: 1.2 },
  initial: { opacity: 0, scale: 0 },
  transition: {
    delay: 0.05,
    duration: (MessageSkipDuration / 1000) * 0.75,
    ease: [0.34, 1.56, 0.64, 1],
  },
} as const;

const skipProps = {
  ...circleProps,
  animate: { opacity: 1 },
  exit: { delay: 0, opacity: 0 },
  initial: { opacity: 0 },
};

export default function SkipMessages() {
  const [isPresent] = usePresence();
  const [animationComplete, setAnimationComplete] = useState(false);
  const controls = useAnimationControls();

  useEffect(() => {
    if (!isPresent) {
      controls.start(circleProps.initial);
    }
  }, [isPresent, controls]);

  useEffect(() => {
    controls.start(circleProps.animate);
  }, [controls]);

  return (
    <motion.div {...skipProps} className={absoluteStyle}>
      <Box
        alignCenter
        between
        className={skipMessagesStyle}
        gap={12}
        horizontalPadding={16}
        verticalPadding
      >
        <motion.div
          className={cx(circleStyle, animationComplete && pulseStyle)}
          {...circleProps}
          animate={controls}
          onAnimationComplete={() => {
            if (isPresent) {
              setAnimationComplete(true);
            }
          }}
        />
        <motion.div {...skipProps}>
          <fbt desc="Text for skipping dialogue">Skip</fbt>
        </motion.div>
      </Box>
    </motion.div>
  );
}

// Keep zIndex in sync with CharacterMessage and Menu.
const absoluteStyle = css`
  pointer-events: none;
  position: fixed;
  right: 0;
  top: 0;
  z-index: 3002;
`;

const skipMessagesStyle = css`
  ${pixelBorder(applyVar('background-color'))};

  background-color: ${applyVar('background-color')};
  position: fixed;
  right: 0;
  top: 0;
  z-index: 3003;
`;

const circleStyle = css`
  background-color: ${applyVar('text-color')};
  border-radius: 50%;
  height: 16px;
  width: 16px;
  margin-top: 2.5px;
`;

export const pulseStyle = css`
  animation: ${keyframes`
    0%, 100% {
      transform: scale(1);
    }
    80% {
      transform: scale(1.2);
    }
    120% {
      transform: scale(0);
    }
    45%, 65% {
      opacity: 1;
    }
    60% {
      opacity: 0;
    }
  `} ${MessageSkipDuration / 3}ms 1 forwards;
`;
