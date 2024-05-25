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
  const keyFrameYs = [
    (position.y + (variant || 0)) * PortraitHeight,
    (position.y + (variant || 0) + 6) * PortraitHeight,
  ];
  let curKeyFrameY = 0;

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

    function animate() {
      context.drawImage(
        image,
        position.x * PortraitWidth,
        keyFrameYs[curKeyFrameY],
        PortraitWidth,
        PortraitHeight,
        0,
        0,
        PortraitWidth,
        PortraitHeight,
      );

      curKeyFrameY = (curKeyFrameY + 1) % keyFrameYs.length;
    }

    if (animate) {
      setInterval(animate, 1000 / keyFrameYs.length);
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
