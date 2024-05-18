import { DoubleSize } from '@deities/athena/map/Configuration.tsx';
import { css, cx } from '@emotion/css';
import { motion } from 'framer-motion';
import type { CSSProperties, MouseEvent, ReactNode, RefObject } from 'react';
import { memo } from 'react';
import { BoxStyle } from './Box.tsx';

export default memo(function MenuButton({
  children,
  className,
  delay,
  hide,
  ref,
  ...props
}: {
  children?: ReactNode;
  className?: string;
  delay?: boolean;
  hide?: boolean;
  onClick?: (event: MouseEvent) => void;
  ref?: RefObject<HTMLDivElement>;
  style?: CSSProperties;
}) {
  return (
    <motion.div
      {...props}
      animate={{
        opacity: hide ? 0 : 1,
      }}
      className={cx(BoxStyle, buttonStyle, className)}
      initial={{ opacity: 0 }}
      ref={ref}
      transition={{
        delay: delay ? 0.25 : 0,
        duration: 0.4,
      }}
    >
      {children}
    </motion.div>
  );
});

const size = DoubleSize;
const buttonStyle = css`
  -webkit-user-drag: none;
  backdrop-filter: blur(4px);
  cursor: pointer;
  font-size: ${size}px;
  height: ${size}px;
  line-height: ${size}px;
  position: fixed;
  transition:
    background-color 150ms ease,
    box-shadow 150ms ease,
    color 150ms ease;
  width: ${size}px;

  & svg {
    vertical-align: top;
  }
`;
