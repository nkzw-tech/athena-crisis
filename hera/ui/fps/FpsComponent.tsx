import Box from '@deities/ui/Box.tsx';
import { css, cx } from '@emotion/css';
import parseInteger from '@nkzw/core/parseInteger.js';
import { useEffect, useRef, useState } from 'react';
import useHide from '../../hooks/useHide.tsx';
import maybeFade from '../../ui/lib/maybeFade.tsx';

const useFps = (windowWidth: number) => {
  const lastFpsValues = useRef<Array<number>>([]);
  const frames = useRef(0);
  const prevTime = useRef(performance.now());
  const animationRef = useRef(0);
  const [fps, setFps] = useState<Array<number>>([]);

  const calcFps = () => {
    const t = performance.now();

    frames.current += 1;

    if (t > prevTime.current + 1000) {
      const elapsedTime = t - prevTime.current;

      const currentFps = Math.round((frames.current * 1000) / elapsedTime);

      lastFpsValues.current = lastFpsValues.current.concat(currentFps);

      if (elapsedTime > 1500) {
        for (let i = 1; i <= (elapsedTime - 1000) / 1000; i++) {
          lastFpsValues.current = lastFpsValues.current.concat(0);
        }
      }

      lastFpsValues.current = lastFpsValues.current.slice(
        Math.max(lastFpsValues.current.length - windowWidth, 0),
      );

      setFps(lastFpsValues.current);

      frames.current = 0;
      prevTime.current = performance.now();
    }

    animationRef.current = requestAnimationFrame(calcFps);
  };

  useEffect(() => {
    animationRef.current = requestAnimationFrame(calcFps);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
    // eslint-disable-next-line react-hooks/react-compiler
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const avgFps = (fps.reduce((a, b) => a + b, 0) / fps.length).toFixed(2);
  const maxFps = Math.max.apply(Math.max, fps);
  const currentFps = fps.at(-1);

  return { avgFps, currentFps, fps, maxFps };
};

export default function Fps() {
  const hidden = useHide();
  const { avgFps, currentFps } = useFps(20);
  return currentFps != null ? (
    <Box blur center className={cx(style, maybeFade(hidden))}>
      {currentFps} fps/{parseInteger(avgFps)} avg
    </Box>
  ) : null;
}

const style = css`
  bottom: 10px;
  font-family: Athena, ui-sans-serif, system-ui, sans-serif;
  font-size: 12px;
  height: 12px;
  left: 0;
  line-height: 12px;
  margin: 0 auto;
  min-height: auto;
  padding: 0 8px;
  pointer-events: none;
  position: fixed;
  right: 0;
  white-space: nowrap;
  width: 124px;
  z-index: 1000;
`;
