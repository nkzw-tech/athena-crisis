import { spriteImage } from '@deities/art/Sprites.tsx';
import { UnitInfo } from '@deities/athena/info/Unit.tsx';
import {
  DynamicPlayerID,
  encodeDynamicPlayerID,
} from '@deities/athena/map/Player.tsx';
import clipBorder from '@deities/ui/clipBorder.tsx';
import { css, cx } from '@emotion/css';
import { memo, useLayoutEffect, useRef } from 'react';
import { useSprites } from '../hooks/useSprites.tsx';

export const PortraitWidth = 55;
export const PortraitHeight = 75;

export default memo(function Portrait({
  animate,
  clip = true,
  paused,
  player,
  scale = 2,
  unit,
  variant,
}: {
  animate?: boolean;
  clip?: boolean;
  paused?: boolean;
  player: DynamicPlayerID;
  scale?: number;
  unit: UnitInfo;
  variant?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const hasPortraits = useSprites('portraits');

  const { position } = unit.sprite.portrait;
  const positions = [
    {
      x: position.x * PortraitWidth,
      y: (position.y + (variant || 0)) * PortraitHeight,
    },
    {
      x: position.x * PortraitWidth,
      y: (position.y + (variant || 0) + 6) * PortraitHeight,
    },
  ];

  useLayoutEffect(() => {
    if (!hasPortraits) {
      return;
    }

    const canvas = ref.current;
    if (!canvas) {
      return;
    }

    const image = spriteImage('Portraits', encodeDynamicPlayerID(player));
    const context = canvas.getContext('2d')!;

    let currentPosition = 0;
    function animate() {
      context.drawImage(
        image,
        positions[currentPosition].x,
        positions[currentPosition].y,
        PortraitWidth,
        PortraitHeight,
        0,
        0,
        PortraitWidth,
        PortraitHeight,
      );

      currentPosition = (currentPosition + 1) % positions.length;
    }

    if (animate) {
      const interval = setInterval(animate, 1000 / positions.length);
      return () => clearInterval(interval);
    }
  }, [hasPortraits]);

  return (
    <div
      className={cx(portraitStyle, clip && clipStyle)}
      style={{
        height: PortraitHeight,
        width: PortraitWidth,
        zoom: scale,
      }}
    >
      <canvas ref={ref}></canvas>
    </div>
  );
});

const portraitStyle = css`
  contain: content;
  image-rendering: pixelated;
  pointer-events: none;
`;

const clipStyle = css`
  ${clipBorder(2)}
`;
