import Icon from '@deities/ui/Icon.tsx';
import { css, cx } from '@emotion/css';
import Coin from '@iconify-icons/pixelarticons/coin.js';
import { motion, useMotionValueEvent, useSpring, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';

const format = (number: number) => Math.round(number).toLocaleString();

export default function Funds({
  className,
  value,
}: {
  className?: string;
  value: number | string;
}) {
  const [isAnimating, setIsAnimating] = useState(false);
  const isString = typeof value === 'string';
  const numberValue = isString ? 0 : value;
  const motionValue = useSpring(numberValue, {
    damping: 20,
    mass: 0.5,
    stiffness: 100,
  });
  const displayValue = useTransform(motionValue, format);

  useEffect(() => {
    motionValue.set(numberValue);
  }, [motionValue, numberValue]);

  useMotionValueEvent(displayValue, 'change', (currentValue) => {
    if (!isAnimating) {
      setIsAnimating(true);
    } else if (currentValue === format(numberValue)) {
      setIsAnimating(false);
    }
  });

  return (
    <div className={cx(style, isAnimating && animateStyle, className)}>
      <Icon className={iconStyle} icon={Coin} />
      {isString ? (
        <span className={cx(value === '???' && offsetStyle)}>{value}</span>
      ) : (
        <motion.span>{displayValue}</motion.span>
      )}
    </div>
  );
}

const style = css`
  align-items: center;
  display: inline-flex;
  transition:
    transform 150ms ease,
    color 150ms ease-in-out;
  transform: scale(1);
  transform-origin: 20% center;
`;

const animateStyle = css`
  transform: scale(1.2);
`;

const iconStyle = css`
  margin: 3px 4px 0 0;
`;

const offsetStyle = css`
  display: inline-block;
  margin-top: 1px;
`;
