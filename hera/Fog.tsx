import { Fog as FogType } from '@deities/athena/map/PlainMap.tsx';
import vec from '@deities/athena/map/vec.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { Visibility, VisionT } from '@deities/athena/Vision.tsx';
import { css, cx } from '@emotion/css';
import { memo, useLayoutEffect, useRef } from 'react';
import { TileStyle } from './Tiles.tsx';

const SoftFogBlurPasses = 3;
const SoftFogBlurRadius = 5;
const SoftFogEdgePower = 2.35;
const SoftFogScale = 1;
const SoftFogPadding = SoftFogBlurPasses * SoftFogBlurRadius + 2;
const ShroudBaseColor = '#070910';
const ShroudEdgeColor = '#172033';
const ShroudHighlightColor = 'rgba(112, 137, 176, 0.16)';
const ShroudShadowColor = 'rgba(4, 6, 11, 0.58)';
const ShroudAnimationDuration = 36_000;
const ShroudAnimationFrameInterval = 1000 / 12;

const getShroudScale = () =>
  typeof window === 'undefined' ? 1 : Math.max(1, Math.ceil(window.devicePixelRatio || 1));

const blurAlpha = (
  source: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number,
  passes: number,
) => {
  if (radius <= 0 || passes <= 0) {
    return source;
  }

  let input: Uint8ClampedArray<ArrayBufferLike> = source;
  let output: Uint8ClampedArray<ArrayBufferLike> = new Uint8ClampedArray(source.length);
  const diameter = radius * 2 + 1;

  for (let pass = 0; pass < passes; pass++) {
    for (let y = 0; y < height; y++) {
      const row = y * width;
      let sum = 0;

      for (let x = -radius; x <= radius; x++) {
        sum += input[row + Math.max(0, Math.min(width - 1, x))];
      }

      for (let x = 0; x < width; x++) {
        output[row + x] = Math.round(sum / diameter);
        sum +=
          input[row + Math.min(width - 1, x + radius + 1)] - input[row + Math.max(0, x - radius)];
      }
    }

    [input, output] = [output, input];

    for (let x = 0; x < width; x++) {
      let sum = 0;

      for (let y = -radius; y <= radius; y++) {
        sum += input[Math.max(0, Math.min(height - 1, y)) * width + x];
      }

      for (let y = 0; y < height; y++) {
        output[y * width + x] = Math.round(sum / diameter);
        sum +=
          input[Math.min(height - 1, y + radius + 1) * width + x] -
          input[Math.max(0, y - radius) * width + x];
      }
    }

    [input, output] = [output, input];
  }

  return input;
};

const fillAlphaRect = (
  alpha: Uint8ClampedArray,
  width: number,
  x: number,
  y: number,
  rectWidth: number,
  rectHeight: number,
  value: number,
) => {
  for (let row = 0; row < rectHeight; row++) {
    const start = (y + row) * width + x;
    alpha.fill(value, start, start + rectWidth);
  }
};

const smoothStep = (value: number) => {
  const x = Math.max(0, Math.min(1, value));
  return x * x * (3 - 2 * x);
};

const getEdgeFadeValues = (length: number, startDistance: number, endDistance: number) => {
  const values = new Float32Array(length);
  for (let index = 0; index < length; index++) {
    values[index] = Math.pow(
      smoothStep(
        index < startDistance
          ? index / startDistance
          : index >= length - endDistance
            ? (length - 1 - index) / endDistance
            : 1,
      ),
      SoftFogEdgePower,
    );
  }
  return values;
};

const drawImageData = (
  canvas: HTMLCanvasElement,
  bufferCanvas: HTMLCanvasElement,
  imageData: ImageData,
  imageSmoothingEnabled: boolean,
) => {
  const context = canvas.getContext('2d')!;
  const bufferContext = bufferCanvas.getContext('2d')!;
  bufferContext.putImageData(imageData, 0, 0);
  context.imageSmoothingEnabled = imageSmoothingEnabled;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bufferCanvas, 0, 0, canvas.width, canvas.height);
};

const copyCanvas = (
  sourceCanvas: HTMLCanvasElement | null,
  targetCanvas: HTMLCanvasElement | null,
) => {
  if (!sourceCanvas || !targetCanvas) {
    return;
  }

  const context = targetCanvas.getContext('2d')!;
  context.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
  context.drawImage(sourceCanvas, 0, 0);
};

const pseudoRandom = (seed: number) => {
  const value = Math.sin(seed * 12.9898) * 43_758.5453;
  return value - Math.floor(value);
};

const drawVeilStreaks = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  size: number,
  phase = 0,
) => {
  const sway = Math.sin(phase * Math.PI * 2);
  context.lineCap = 'round';
  context.strokeStyle = ShroudHighlightColor;
  context.lineWidth = Math.max(2, size * 0.14);

  for (let offset = -height; offset < width + height; offset += size * 1.65) {
    context.beginPath();
    const animatedOffset = offset + sway * size * 0.24;
    context.moveTo(animatedOffset, 0);
    context.bezierCurveTo(
      animatedOffset + height * 0.2,
      height * 0.34,
      animatedOffset + height * 0.58,
      height * 0.66,
      animatedOffset + height * 0.82,
      height,
    );
    context.stroke();
  }

  context.strokeStyle = 'rgba(61, 88, 124, 0.1)';
  context.lineWidth = Math.max(1, size * 0.08);

  for (let offset = -height; offset < width + height; offset += size * 2.2) {
    context.beginPath();
    const animatedOffset = offset - sway * size * 0.18;
    context.moveTo(animatedOffset + size * 0.7, height);
    context.bezierCurveTo(
      animatedOffset + height * 0.12,
      height * 0.72,
      animatedOffset + height * 0.4,
      height * 0.3,
      animatedOffset + height * 0.66,
      0,
    );
    context.stroke();
  }
};

const drawVeilNoise = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  size: number,
  phase = 0,
) => {
  const count = Math.ceil((width * height) / (size * size)) * 5;
  const driftX = Math.sin(phase * Math.PI * 2) * size * 0.18;
  const driftY = (Math.cos(phase * Math.PI * 2) - 1) * size * 0.12;
  context.fillStyle = 'rgba(167, 190, 220, 0.12)';

  for (let index = 0; index < count; index++) {
    const x = Math.floor((pseudoRandom(index + 1) * width + driftX + width) % width);
    const y = Math.floor((pseudoRandom(index + count + 3) * height + driftY + height) % height);
    const particleSize = pseudoRandom(index + count * 2 + 5) > 0.72 ? 2 : 1;
    context.fillRect(x, y, particleSize, particleSize);
  }
};

const drawShroudEdgeFade = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  offset: number,
) => {
  const fadeSize = offset / 2;
  if (fadeSize <= 0) {
    return;
  }

  context.save();
  context.globalCompositeOperation = 'destination-in';

  const horizontalGradient = context.createLinearGradient(0, 0, width, 0);
  horizontalGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  horizontalGradient.addColorStop(fadeSize / width, 'rgba(0, 0, 0, 1)');
  horizontalGradient.addColorStop(1 - fadeSize / width, 'rgba(0, 0, 0, 1)');
  horizontalGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  context.fillStyle = horizontalGradient;
  context.fillRect(0, 0, width, height);

  const verticalGradient = context.createLinearGradient(0, 0, 0, height);
  verticalGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  verticalGradient.addColorStop(fadeSize / height, 'rgba(0, 0, 0, 1)');
  verticalGradient.addColorStop(1 - fadeSize / height, 'rgba(0, 0, 0, 1)');
  verticalGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  context.fillStyle = verticalGradient;
  context.fillRect(0, 0, width, height);

  context.restore();
};

const drawVeilEdges = (
  context: CanvasRenderingContext2D,
  map: MapData,
  offset: number,
  size: number,
  vision: VisionT,
) => {
  const primaryEdgeSize = 1;
  const secondaryEdgeSize = 1;

  map.forEachField((vector: Vector) => {
    if (vision.getVisibility(map, vector) !== Visibility.Unexplored) {
      return;
    }

    const x = offset + (vector.x - 1) * size;
    const y = offset + (vector.y - 1) * size;
    const edges: Array<
      [
        edgeX: number,
        edgeY: number,
        width: number,
        height: number,
        innerX: number,
        innerY: number,
        innerWidth: number,
        innerHeight: number,
        visibility: Visibility,
      ]
    > = [];

    const up = vision.getVisibility(map, vector.up());
    if (up !== Visibility.Unexplored) {
      edges.push([
        x,
        y,
        size,
        primaryEdgeSize,
        x,
        y + primaryEdgeSize,
        size,
        secondaryEdgeSize,
        up,
      ]);
    }

    const right = vision.getVisibility(map, vector.right());
    if (right !== Visibility.Unexplored) {
      edges.push([
        x + size - primaryEdgeSize,
        y,
        primaryEdgeSize,
        size,
        x + size - primaryEdgeSize - secondaryEdgeSize,
        y,
        secondaryEdgeSize,
        size,
        right,
      ]);
    }

    const down = vision.getVisibility(map, vector.down());
    if (down !== Visibility.Unexplored) {
      edges.push([
        x,
        y + size - primaryEdgeSize,
        size,
        primaryEdgeSize,
        x,
        y + size - primaryEdgeSize - secondaryEdgeSize,
        size,
        secondaryEdgeSize,
        down,
      ]);
    }

    const left = vision.getVisibility(map, vector.left());
    if (left !== Visibility.Unexplored) {
      edges.push([
        x,
        y,
        primaryEdgeSize,
        size,
        x + primaryEdgeSize,
        y,
        secondaryEdgeSize,
        size,
        left,
      ]);
    }

    if (edges.length) {
      for (const [edgeX, edgeY, width, height, , , , , visibility] of edges) {
        context.fillStyle =
          visibility === Visibility.Visible ? 'rgba(1, 2, 6, 0.78)' : 'rgba(5, 8, 14, 0.5)';
        context.fillRect(edgeX, edgeY, width, height);
      }

      for (const [, , , , innerX, innerY, innerWidth, innerHeight, visibility] of edges) {
        context.fillStyle =
          visibility === Visibility.Visible
            ? 'rgba(26, 34, 52, 0.16)'
            : 'rgba(124, 156, 196, 0.18)';
        context.fillRect(innerX, innerY, innerWidth, innerHeight);
      }
    }
  });
};

const drawExplorationShroud = (
  canvas: HTMLCanvasElement,
  map: MapData,
  offset: number,
  size: number,
  vision: VisionT,
  scale: number,
  phase = 0,
) => {
  const context = canvas.getContext('2d')!;
  const width = map.size.width * size + offset * 2;
  const height = map.size.height * size + offset * 2;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = true;
  context.setTransform(scale, 0, 0, scale, 0, 0);

  const path = new Path2D();
  let hasUnexploredFields = false;
  map.forEachField((vector: Vector) => {
    if (vision.getVisibility(map, vector) === Visibility.Unexplored) {
      hasUnexploredFields = true;
      path.rect(offset + (vector.x - 1) * size, offset + (vector.y - 1) * size, size, size);
    }
  });

  for (let x = 0; x <= map.size.width + 1; x++) {
    for (let y = 0; y <= map.size.height + 1; y++) {
      if (map.contains(vec(x, y))) {
        continue;
      }

      const closestVector = vec(
        Math.max(1, Math.min(map.size.width, x)),
        Math.max(1, Math.min(map.size.height, y)),
      );
      if (vision.getVisibility(map, closestVector) === Visibility.Unexplored) {
        hasUnexploredFields = true;
        path.rect(offset + (x - 1) * size, offset + (y - 1) * size, size, size);
      }
    }
  }

  if (!hasUnexploredFields) {
    return;
  }

  context.save();
  context.clip(path);
  context.filter = `blur(${Math.max(3, Math.round(size / 8))}px)`;
  context.fillStyle = ShroudShadowColor;
  context.fill(path);
  context.filter = 'none';

  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, ShroudBaseColor);
  gradient.addColorStop(0.45, '#101727');
  gradient.addColorStop(1, '#090b13');
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  const radialGradient = context.createRadialGradient(
    width * 0.2,
    height * 0.12,
    0,
    width * 0.2,
    height * 0.12,
    Math.max(width, height),
  );
  radialGradient.addColorStop(0, ShroudEdgeColor);
  radialGradient.addColorStop(0.58, 'rgba(13, 18, 31, 0.88)');
  radialGradient.addColorStop(1, 'rgba(7, 9, 16, 0)');
  context.fillStyle = radialGradient;
  context.fillRect(0, 0, width, height);

  drawVeilStreaks(context, width, height, size, phase);
  drawVeilNoise(context, width, height, size, phase);
  context.restore();

  drawVeilEdges(context, map, offset, size, vision);
  drawShroudEdgeFade(context, width, height, offset);
  context.setTransform(1, 0, 0, 1, 0, 0);
};

const drawFog = (
  canvas: HTMLCanvasElement,
  bufferCanvas: HTMLCanvasElement,
  fogStyle: 'soft' | 'hard' | undefined,
  map: MapData,
  offset: number,
  size: number,
  vision: VisionT,
) => {
  const targetHeight = Math.ceil(canvas.height / SoftFogScale);
  const targetWidth = Math.ceil(canvas.width / SoftFogScale);
  const height = targetHeight + SoftFogPadding * 2;
  const width = targetWidth + SoftFogPadding * 2;
  const alpha = new Uint8ClampedArray(width * height);
  alpha.fill(255);

  const scale = (value: number) => Math.round(value / SoftFogScale);

  map.forEachField((vector: Vector) => {
    if (vision.getVisibility(map, vector) === Visibility.Visible) {
      const x = SoftFogPadding + scale(offset + (vector.x - 1) * size);
      const y = SoftFogPadding + scale(offset + (vector.y - 1) * size);
      fillAlphaRect(
        alpha,
        width,
        x,
        y,
        SoftFogPadding + scale(offset + vector.x * size) - x,
        SoftFogPadding + scale(offset + vector.y * size) - y,
        0,
      );
    }
  });

  const hardAlpha = fogStyle === 'hard' ? alpha.slice() : null;
  const blurredAlpha = blurAlpha(alpha, width, height, SoftFogBlurRadius, SoftFogBlurPasses);
  bufferCanvas.height = targetHeight;
  bufferCanvas.width = targetWidth;

  const bufferContext = bufferCanvas.getContext('2d')!;
  const imageData = bufferContext.createImageData(targetWidth, targetHeight);
  const data = imageData.data;
  const horizontalFade = getEdgeFadeValues(
    targetWidth,
    Math.max(1, scale(offset)),
    Math.max(1, scale(offset)),
  );
  const verticalFade = getEdgeFadeValues(
    targetHeight,
    Math.max(1, scale(offset)),
    Math.max(1, scale(offset)),
  );

  for (let y = 0; y < targetHeight; y++) {
    const sourceStart = (y + SoftFogPadding) * width + SoftFogPadding;
    const targetStart = y * targetWidth;
    const edgeFade = verticalFade[y];
    for (let x = 0; x < targetWidth; x++) {
      const targetIndex = (targetStart + x) * 4 + 3;
      const isInnerMap =
        x >= offset && x < targetWidth - offset && y >= offset && y < targetHeight - offset;
      const fade = edgeFade * horizontalFade[x];
      const sourceAlpha =
        hardAlpha && isInnerMap ? hardAlpha[sourceStart + x] : blurredAlpha[sourceStart + x];
      data[targetIndex] = sourceAlpha * fade;
    }
  }

  drawImageData(canvas, bufferCanvas, imageData, fogStyle !== 'hard');
};

export default memo(function CanvasFog({
  fogStyle,
  map,
  paused,
  style,
  tileSize: size,
  vision,
  zIndex,
}: {
  fogStyle?: 'soft' | 'hard';
  map: MapData;
  paused?: boolean;
  style: TileStyle;
  tileSize: number;
  vision: VisionT;
  zIndex: number;
}) {
  const offset = size;
  const mainRef = useRef<HTMLCanvasElement>(null);
  const darkRef = useRef<HTMLCanvasElement>(null);
  const shroudRef = useRef<HTMLCanvasElement>(null);
  const bufferRef = useRef<HTMLCanvasElement>(null);
  const shroudScale = getShroudScale();
  useLayoutEffect(() => {
    const canvas = mainRef.current;
    if (!canvas) {
      return;
    }

    drawFog(
      canvas,
      bufferRef.current || (bufferRef.current = document.createElement('canvas')),
      fogStyle,
      map,
      offset,
      size,
      vision,
    );

    copyCanvas(canvas, darkRef.current);

    const shroudCanvas = map.config.fog === FogType.Exploration ? shroudRef.current : null;
    if (shroudCanvas) {
      drawExplorationShroud(shroudCanvas, map, offset, size, vision, shroudScale);

      if (!paused && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
        let animationFrame: number;
        let lastDraw = 0;
        const start = performance.now();
        const drawAnimatedShroud = (time: number) => {
          if (time - lastDraw >= ShroudAnimationFrameInterval) {
            drawExplorationShroud(
              shroudCanvas,
              map,
              offset,
              size,
              vision,
              shroudScale,
              ((time - start) % ShroudAnimationDuration) / ShroudAnimationDuration,
            );
            lastDraw = time;
          }

          animationFrame = requestAnimationFrame(drawAnimatedShroud);
        };
        animationFrame = requestAnimationFrame(drawAnimatedShroud);

        return () => cancelAnimationFrame(animationFrame);
      }
    }
  }, [fogStyle, map, offset, paused, shroudScale, size, vision]);

  if (!map.config.fog) {
    return null;
  }

  const canvasHeight = map.size.height * size + offset * 2;
  const canvasWidth = map.size.width * size + offset * 2;

  return (
    <div
      className={cx(
        containerStyle,
        style !== 'floating' && fogStyle === 'hard' && overflowHiddenStyle,
      )}
      style={{
        height: map.size.height * size,
        width: map.size.width * size,
      }}
    >
      <canvas
        className={cx(darkenCanvasStyle, fogStyle === 'hard' && hardCanvasStyle)}
        height={canvasHeight}
        ref={darkRef}
        style={{
          left: -offset,
          top: -offset,
          zIndex,
        }}
        width={canvasWidth}
      />
      <canvas
        className={cx(canvasStyle, fogStyle === 'hard' && hardCanvasStyle)}
        data-fog-layer="saturation"
        data-fog-style={fogStyle || 'soft'}
        height={canvasHeight}
        ref={mainRef}
        style={{
          left: -offset,
          top: -offset,
          zIndex,
        }}
        width={canvasWidth}
      />
      {map.config.fog === FogType.Exploration && (
        <canvas
          className={shroudCanvasStyle}
          data-fog-layer="shroud"
          height={canvasHeight * shroudScale}
          ref={shroudRef}
          style={{
            height: canvasHeight,
            left: -offset,
            top: -offset,
            width: canvasWidth,
            zIndex: 3,
          }}
          width={canvasWidth * shroudScale}
        />
      )}
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

const canvasStyle = css`
  image-rendering: auto;
  mix-blend-mode: saturation;
  position: absolute;
`;

const darkenCanvasStyle = css`
  image-rendering: auto;
  mix-blend-mode: multiply;
  opacity: 0.25;
  position: absolute;
`;

const hardCanvasStyle = css`
  image-rendering: pixelated;
`;

const shroudCanvasStyle = css`
  image-rendering: auto;
  left: 0;
  position: absolute;
  top: 0;
`;
