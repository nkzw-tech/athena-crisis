import type Vector from '@deities/athena/map/Vector.tsx';
import type MapData from '@deities/athena/MapData.tsx';
import type { VisionT } from '@deities/athena/Vision.tsx';
import { isSafari } from '@deities/ui/Browser.tsx';
import { css, cx } from '@emotion/css';
import { memo, useLayoutEffect, useRef } from 'react';
import type { TileStyle } from './Tiles.tsx';

export default memo(function CanvasFog({
  fogStyle,
  map,
  style,
  tileSize: size,
  vision,
  zIndex,
}: {
  fogStyle?: 'soft' | 'hard';
  map: MapData;
  style: TileStyle;
  tileSize: number;
  vision: VisionT;
  zIndex: number;
}) {
  const offset = 8;
  const mainRef = useRef<HTMLCanvasElement>(null);
  const darkRef = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const canvas = mainRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d')!;
    context.fillStyle = 'rgba(0, 0, 0, 1)';
    if (fogStyle === 'soft') {
      // Fill the edges of the canvas with black so that fog is not washed out at the edges.
      context.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      context.fillRect(3, 3, canvas.width - 6, canvas.height - 2);
    }

    map.forEachField((vector: Vector) => {
      if (vision.isVisible(map, vector)) {
        context.clearRect(
          offset + (vector.x - 1) * size,
          offset + (vector.y - 1) * size,
          size,
          size,
        );
      }
    });

    const darkCanvas = darkRef.current;
    if (darkCanvas) {
      const darkContext = darkCanvas.getContext('2d')!;
      darkContext.clearRect(0, 0, darkCanvas.width, darkCanvas.height);
      darkContext.drawImage(canvas, 0, 0);
    }
  }, [fogStyle, map, size, vision]);

  if (!map.config.fog) {
    return null;
  }

  return (
    <div
      className={cx(
        containerStyle,
        style !== 'floating' && overflowHiddenStyle,
      )}
      style={{
        height: map.size.height * size,
        width: map.size.width * size,
      }}
    >
      {!isSafari && (
        <canvas
          className={cx(darkenCanvasStyle, fogStyle !== 'hard' && blurStyle)}
          height={map.size.height * size + offset * 2}
          ref={darkRef}
          style={{
            left: -offset,
            top: -offset,
            zIndex,
          }}
          width={map.size.width * size + offset * 2}
        />
      )}
      <canvas
        className={cx(canvasStyle, fogStyle !== 'hard' && blurStyle)}
        height={map.size.height * size + offset * 2}
        ref={mainRef}
        style={{
          left: -offset,
          top: -offset,
          zIndex,
        }}
        width={map.size.width * size + offset * 2}
      />
    </div>
  );
});

const overflowHiddenStyle = css`
  overflow: hidden;
`;

const containerStyle = css`
  pointer-events: none;
  position: absolute;
`;

const mode = isSafari
  ? `
mix-blend-mode: multiply;
opacity: 0.66;
`
  : `
mix-blend-mode: saturation;
`;

const canvasStyle = css`
  ${mode}

  position: absolute;
`;

const darkenCanvasStyle = css`
  mix-blend-mode: multiply;
  opacity: 0.25;
  position: absolute;
`;

const blurStyle = css`
  filter: blur(6px);
`;
