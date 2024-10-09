import { DoubleSize } from '@deities/athena/map/Configuration.tsx';
import { css, cx } from '@emotion/css';
import { motion, MotionStyle } from 'framer-motion';
import { memo, MouseEvent, ReactNode, RefObject } from 'react';
import { BoxStyle } from './Box.tsx';

export default memo(function MenuButton({
  blur = true,
  children,
  className,
  delay,
  hide,
  ref,
  ...props
}: {
  blur?: boolean;
  children?: ReactNode;
  className?: string;
  delay?: boolean;
  hide?: boolean;
  onClick?: (event: MouseEvent) => void;
  ref?: RefObject<HTMLDivElement>;
  style?: MotionStyle;
}) {
  return (
    <motion.div
      {...props}
      animate={{
        opacity: hide ? 0 : 1,
      }}
      className={cx(BoxStyle, buttonStyle, blur && blurStyle, className)}
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

const blurStyle = css`
  backdrop-filter: blur(4px);
`;
