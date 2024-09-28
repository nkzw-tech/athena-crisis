import { motion } from 'framer-motion';
import { memo, ReactNode } from 'react';

export const PageTransitionDuration = 0.15;

const animate = {
  opacity: 1,
  transform: 'translate3d(0, 0px, 0)',
};

const initial = {
  opacity: 0,
  transform: 'translate3d(0, 20px, 0)',
};

const exit = {
  opacity: 0,
  transform: 'translate3d(0, -20px, 0)',
};

export default memo(function PageTransition({
  children,
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      animate={animate}
      exit={exit}
      initial={initial}
      transition={{
        delay,
        duration: PageTransitionDuration,
      }}
    >
      {children}
    </motion.div>
  );
});
