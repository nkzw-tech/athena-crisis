import { css, keyframes } from '@emotion/css';
import Stack from '@nkzw/stack';
import { useEffect, useState } from 'react';
import Box from './Box.tsx';
import clipBorder from './clipBorder.tsx';
import getColor from './getColor.tsx';

export default function Spinner({
  component: Component = Stack,
}: {
  component?: typeof Stack | typeof Box;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!show) {
      const timer = setTimeout(() => setShow(true), 750);
      return () => clearTimeout(timer);
    }
  }, [show]);

  return (
    <Component
      alignCenter
      className={containerStyle}
      gap
      style={{ opacity: show ? 1 : 0 }}
    >
      <div className={dotStyle}></div>
      <div className={dotStyle}></div>
      <div className={dotStyle}></div>
    </Component>
  );
}

const containerStyle = css`
  opacity: 0;
  transition: opacity 300ms ease-in-out;
`;

const dotStyle = css`
  ${clipBorder(2.5)}
  background-color: ${getColor(1)};
  height: 10px;
  width: 10px;

  animation: ${keyframes`
      33% { background-color: ${getColor(2)}}
      66% { background-color: ${getColor(3)}}
      0%, 100% {
        background-color: ${getColor(1)};
        transform: translate3d(0, 3px, 0);
      }
      50% { transform: translate3d(0, -7px, 0); }
    `} 1.5s infinite;

  &:nth-child(1) {
    animation-delay: 0s;
  }
  &:nth-child(2) {
    animation-delay: 0.2s;
  }
  &:nth-child(3) {
    animation-delay: 0.4s;
  }
`;
