import { DoubleSize, TileSize } from '@deities/athena/map/Configuration.tsx';
import Box from '@deities/ui/Box.tsx';
import Breakpoints from '@deities/ui/Breakpoints.tsx';
import { applyVar, insetStyle } from '@deities/ui/cssVar.tsx';
import { css, cx } from '@emotion/css';
import Stack from '@nkzw/stack';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

export default function Notification({
  center,
  children,
  delay = 0,
  inline,
  inset = 0,
  offset = 0,
  position = 'bottom',
  size,
}: {
  center?: true;
  children?: ReactNode;
  delay?: number;
  inline?: true;
  inset?: number;
  offset?: number;
  position?: 'bottom' | 'top-right' | 'top';
  size?: 'fit';
}) {
  const direction = position === 'top-right' || position === 'top' ? 1 : -1;
  const Component = inline ? Stack : Box;
  return (
    <motion.div
      animate={{
        opacity: 1,
        transform: `scale(1) translate3d(0, ${offset * 100 * direction}%, 0)`,
      }}
      className={cx(
        containerStyle,
        position === 'top' ? topStyle : position === 'top-right' ? topRightStyle : bottomStyle,
      )}
      exit={{
        opacity: 0,
        transform: `scale(0.9) translate3d(0, ${(offset + direction * -1) * 100}%, 0)`,
      }}
      initial={{
        opacity: 0,
        transform: `scale(0.9) translate3d(0, ${(offset + direction * -1) * 100}%, 0)`,
      }}
      style={insetStyle(inset)}
      transition={{
        delay: delay / 1000,
        duration: 0.25,
        ease: [0.34, 1.56, 0.64, 1],
      }}
    >
      <Component center={center} className={cx(boxStyle, size === 'fit' && fitStyle)}>
        {children}
      </Component>
    </motion.div>
  );
}

const containerStyle = css`
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  position: fixed;
  width: fit-content;
  z-index: calc(1 + ${applyVar('inset-z')});

  max-width: 80vw;
  ${Breakpoints.sm} {
    max-width: 90vw;
  }
`;

const bottomStyle = css`
  bottom: calc(${applyVar('inset')} + ${TileSize * 1.5}px);
  left: ${applyVar('inset')};
  margin: 0 auto;
  right: ${applyVar('inset')};
`;

const topStyle = css`
  margin: 0 auto;
  top: calc(${applyVar('safe-area-top')} + ${applyVar('inset')});
`;

const topRightStyle = css`
  left: ${DoubleSize * 1.5}px;
  right: ${applyVar('inset')};
  top: calc(${applyVar('safe-area-top')} + ${applyVar('inset')});

  ${Breakpoints.sm} {
    left: auto;
  }
`;

const boxStyle = css`
  backdrop-filter: blur(4px);
  line-height: 1.2em;
  pointer-events: auto;
  position: relative;
`;

const fitStyle = css`
  width: fit-content;
`;
