import { spriteImage } from '@deities/art/Sprites.tsx';
import { Brute, SuperAPU, UnitInfo } from '@deities/athena/info/Unit.tsx';
import { DynamicPlayerID, encodeDynamicPlayerID } from '@deities/athena/map/Player.tsx';
import { sm } from '@deities/ui/Breakpoints.tsx';
import clipBorder from '@deities/ui/clipBorder.tsx';
import useMedia from '@deities/ui/hooks/useMedia.tsx';
import { css, cx } from '@emotion/css';
import { PortraitSilhouettes } from 'athena-crisis:images';
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
  silhouette = false,
  unit,
  variant,
}: {
  animate?: boolean;
  clip?: boolean;
  paused?: boolean;
  player: DynamicPlayerID;
  scale?: number | 'adaptive';
  silhouette?: boolean;
  unit: UnitInfo;
  variant?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const hasPortraits = useSprites('portraits');

  if (silhouette && unit === SuperAPU) {
    unit = Brute;
  }

  const { position } = unit.sprite.portrait;

  const isLarge = useMedia(`(min-width: ${sm}px)`);
  const zoom = scale === 'adaptive' ? (isLarge ? 2 : 1) : scale;

  useLayoutEffect(() => {
    if (!hasPortraits) {
      return;
    }

    const canvas = ref.current;
    if (!canvas) {
      return;
    }

    const image = silhouette
      ? PortraitSilhouettes
      : spriteImage('Portraits', encodeDynamicPlayerID(player));
    const context = canvas.getContext('2d')!;
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
    let currentPosition = ((Number(document.timeline.currentTime) || 0) / 1000) % 1 < 0.5 ? 0 : 1;

    const draw = () => {
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
    };

    draw();

    if (animate && !paused) {
      const interval = setInterval(draw, 1000 / positions.length);
      return () => clearInterval(interval);
    }
  }, [hasPortraits, animate, paused, player, position, variant, silhouette, unit]);

  return (
    <canvas
      className={cx(portraitStyle, clip && clipStyle)}
      height={PortraitHeight}
      ref={ref}
      style={{
        zoom,
      }}
      width={PortraitWidth}
    />
  );
});

const portraitStyle = css`
  display: block;
  image-rendering: pixelated;
  pointer-events: none;
`;

const clipStyle = css`
  ${clipBorder(2)}
`;
