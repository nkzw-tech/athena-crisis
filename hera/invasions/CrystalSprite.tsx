import { Crystal } from '@deities/athena/invasions/Crystal.tsx';
import { css } from '@emotion/css';
import { Crystals as CrystalImage } from 'athena-crisis:images';
import { memo, useLayoutEffect, useRef, useState } from 'react';

const size = 26;
const offsets: Record<Crystal, number> = {
  [Crystal.Help]: 3,
  [Crystal.Super]: 1,
  [Crystal.Power]: 5,
  [Crystal.Memory]: 2,
  [Crystal.Command]: 4,
  [Crystal.Phantom]: 0,
};

export default memo(function CrystalSprite({
  animate,
  crystal,
  onComplete,
  paused,
  portal,
  scale = 2,
  variant,
}: {
  animate?: boolean;
  crystal: Crystal;
  onComplete?: () => void;
  paused?: boolean;
  portal?: boolean;
  scale?: number;
  variant?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [complete, setComplete] = useState(false);

  useLayoutEffect(() => {
    const canvas = ref.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d')!;
    const y = offsets[crystal] * size;
    let offsetX = 0;
    const draw = () => {
      context.clearRect(0, 0, size, size);
      context.drawImage(
        CrystalImage,
        offsetX * size,
        y,
        size,
        size,
        0,
        0,
        size,
        size,
      );
      offsetX = (offsetX + 1) % (portal ? 32 : 16);

      if (offsetX === 0 && onComplete && !complete) {
        setComplete(true);
        onComplete();
      }
    };

    draw();

    if (animate && !paused) {
      const interval = setInterval(draw, 1000 / 4);
      return () => clearInterval(interval);
    }
  }, [animate, complete, crystal, onComplete, paused, portal, variant]);

  return (
    <canvas
      className={crystalStyle}
      height={size}
      ref={ref}
      style={{
        zoom: scale,
      }}
      width={size}
    />
  );
});

const crystalStyle = css`
  display: block;
  image-rendering: pixelated;
  pointer-events: none;
`;
