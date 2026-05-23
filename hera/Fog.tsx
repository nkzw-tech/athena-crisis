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
const MistAnimationDuration = 30_000;
const MistAnimationFrameInterval = 1000 / 12;
const MistScale = 1;

type MistLayerCache = Readonly<{
  height: number;
  layerCanvases: readonly [HTMLCanvasElement, HTMLCanvasElement];
  width: number;
}>;

type MistCache = Readonly<{
  layers: MistLayerCache;
  maskCanvas: HTMLCanvasElement;
}>;

const getShroudScale = () =>
  typeof window === 'undefined' ? 1 : Math.max(1, Math.ceil(window.devicePixelRatio || 1));

const getMistAnimationPhase = (time: number, start: number) =>
  (time - start) / MistAnimationDuration;

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

const getMistVisibility = (map: MapData, vector: Vector, vision: VisionT) => {
  const visibility = vision.getVisibility(map, vector);
  return (
    visibility === Visibility.Fog ||
    (map.config.fog !== FogType.Exploration && visibility === Visibility.Unexplored)
  );
};

const getMistPath = (map: MapData, offset: number, size: number, vision: VisionT) => {
  const path = new Path2D();
  let hasFogFields = false;

  map.forEachField((vector: Vector) => {
    if (getMistVisibility(map, vector, vision)) {
      hasFogFields = true;
      path.rect(offset + (vector.x - 1) * size, offset + (vector.y - 1) * size, size, size);
    }
  });

  return hasFogFields ? path : null;
};

const drawMistCloud = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  seed: number,
  alpha: number,
) => {
  const lobes = [
    [-0.34, 0.08, 0.34, 0.56],
    [-0.13, -0.06, 0.44, 0.72],
    [0.12, -0.08, 0.48, 0.78],
    [0.35, 0.08, 0.36, 0.58],
    [0, 0.15, 0.62, 0.44],
  ] as const;

  context.save();
  context.translate(x, y);
  context.rotate((pseudoRandom(seed + 7) - 0.5) * 0.24);
  context.filter = `blur(${Math.max(1, Math.round(width * 0.025))}px)`;
  context.globalCompositeOperation = 'screen';

  for (const [offsetX, offsetY, radiusX, radiusY] of lobes) {
    const brightness = 0.75 + pseudoRandom(seed + offsetX * 173 + offsetY * 211) * 0.5;
    const lobeAlpha = alpha * brightness;
    const lobeX = offsetX * width + (pseudoRandom(seed + offsetX * 100) - 0.5) * width * 0.08;
    const lobeY = offsetY * height + (pseudoRandom(seed + offsetY * 100) - 0.5) * height * 0.12;
    const xRadius = radiusX * width;
    const yRadius = radiusY * height;
    const gradient = context.createRadialGradient(lobeX, lobeY, 0, lobeX, lobeY, xRadius);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${lobeAlpha})`);
    gradient.addColorStop(0.62, `rgba(238, 246, 255, ${lobeAlpha * 0.48})`);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    context.fillStyle = gradient;
    context.beginPath();
    context.ellipse(lobeX, lobeY, xRadius, yRadius, 0, 0, Math.PI * 2);
    context.fill();
  }

  context.restore();
};

const renderMistLayer = (
  canvas: HTMLCanvasElement,
  map: MapData,
  offset: number,
  size: number,
  scale: number,
  variant: 0 | 1,
) => {
  const context = canvas.getContext('2d')!;
  const width = map.size.width * size + offset * 2;
  const height = map.size.height * size + offset * 2;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = true;
  context.setTransform(scale, 0, 0, scale, 0, 0);

  const step = size * (variant === 0 ? 2.35 : 2.7);
  const columnCount = Math.ceil(width / step) + 1;
  const rowCount = Math.ceil(height / step) + 1;

  for (let row = -1; row < rowCount; row++) {
    for (let column = -1; column < columnCount; column++) {
      const seed =
        (column + 11 + variant * 19) * 271 +
        (row + 17 + variant * 23) * 421 +
        map.size.width * 13 +
        map.size.height;
      if (pseudoRandom(seed + 1) < (variant === 0 ? 0.16 : 0.28)) {
        continue;
      }

      const cloudWidth =
        size *
        (variant === 0
          ? 1.45 + pseudoRandom(seed + 3) * 0.6
          : 1.15 + pseudoRandom(seed + 3) * 0.45);
      const cloudHeight = cloudWidth * (0.34 + pseudoRandom(seed + 4) * 0.16);
      const x =
        column * step +
        pseudoRandom(seed + 5) * step -
        size +
        (pseudoRandom(seed + 9) - 0.5) * size * 0.3;
      const y = row * step + pseudoRandom(seed + 6) * step - size;
      drawMistCloud(
        context,
        x,
        y,
        cloudWidth,
        cloudHeight,
        seed,
        (variant === 0 ? 0.06 : 0.045) + pseudoRandom(seed + 8) * (variant === 0 ? 0.06 : 0.045),
      );
    }
  }

  context.setTransform(1, 0, 0, 1, 0, 0);
};

const createMistLayerCache = (
  map: MapData,
  offset: number,
  size: number,
  scale: number,
): MistLayerCache => {
  const height = Math.ceil((map.size.height * size + offset * 2) * scale);
  const width = Math.ceil((map.size.width * size + offset * 2) * scale);
  const layerCanvases = [
    document.createElement('canvas'),
    document.createElement('canvas'),
  ] as const;
  layerCanvases.forEach((layerCanvas, variant) => {
    layerCanvas.height = height;
    layerCanvas.width = width;
    renderMistLayer(layerCanvas, map, offset, size, scale, variant as 0 | 1);
  });

  return { height, layerCanvases, width };
};

const createMistMask = (
  map: MapData,
  offset: number,
  size: number,
  vision: VisionT,
  scale: number,
): HTMLCanvasElement | null => {
  const path = getMistPath(map, offset, size, vision);
  if (!path) {
    return null;
  }

  const height = Math.ceil((map.size.height * size + offset * 2) * scale);
  const width = Math.ceil((map.size.width * size + offset * 2) * scale);
  const maskCanvas = document.createElement('canvas');
  maskCanvas.height = height;
  maskCanvas.width = width;

  const maskContext = maskCanvas.getContext('2d')!;
  maskContext.imageSmoothingEnabled = true;
  maskContext.setTransform(scale, 0, 0, scale, 0, 0);
  maskContext.save();
  maskContext.filter = `blur(${Math.max(3, Math.round(size * 0.2))}px)`;
  maskContext.fillStyle = 'black';
  maskContext.fill(path);
  maskContext.restore();
  maskContext.setTransform(1, 0, 0, 1, 0, 0);

  return maskCanvas;
};

const drawMist = (canvas: HTMLCanvasElement, cache: MistCache | null, size: number, phase = 0) => {
  const context = canvas.getContext('2d')!;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);

  if (!cache) {
    return false;
  }

  const phaseRadians = phase * Math.PI * 2;
  const firstX = Math.sin(phaseRadians) * size * 0.34;
  const firstY = Math.cos(phaseRadians * 0.8) * size * 0.18;
  const secondX = Math.sin(phaseRadians * 0.7 + Math.PI) * size * 0.26;
  const secondY = Math.cos(phaseRadians * 0.55 + Math.PI * 0.3) * size * 0.14;

  context.imageSmoothingEnabled = true;
  context.globalCompositeOperation = 'source-over';
  context.drawImage(cache.layers.layerCanvases[0], firstX, firstY);
  context.drawImage(cache.layers.layerCanvases[1], secondX, secondY);
  context.globalCompositeOperation = 'destination-in';
  context.drawImage(cache.maskCanvas, 0, 0);
  context.globalCompositeOperation = 'source-over';

  return true;
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
  const mistLayerCacheRef = useRef<MistLayerCache | null>(null);
  const mistPhaseRef = useRef(pseudoRandom(size));
  const mistStartRef = useRef(
    typeof performance === 'undefined'
      ? 0
      : performance.now() - mistPhaseRef.current * MistAnimationDuration,
  );
  const mistRef = useRef<HTMLCanvasElement>(null);
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
    const mistCanvas = mistRef.current;
    const mistWidth = Math.ceil((map.size.width * size + offset * 2) * MistScale);
    const mistHeight = Math.ceil((map.size.height * size + offset * 2) * MistScale);
    const mistLayerCache =
      mistCanvas &&
      (mistLayerCacheRef.current?.width !== mistWidth ||
        mistLayerCacheRef.current.height !== mistHeight)
        ? (mistLayerCacheRef.current = createMistLayerCache(map, offset, size, MistScale))
        : mistLayerCacheRef.current;
    const mistMask = mistCanvas ? createMistMask(map, offset, size, vision, MistScale) : null;
    const mistCache =
      mistLayerCache && mistMask ? { layers: mistLayerCache, maskCanvas: mistMask } : null;
    const now = performance.now();
    const initialMistPhase = !paused
      ? getMistAnimationPhase(now, mistStartRef.current)
      : mistPhaseRef.current;
    if (paused) {
      mistStartRef.current = now - initialMistPhase * MistAnimationDuration;
    }
    const hasAnimatedMist = mistCanvas
      ? drawMist(mistCanvas, mistCache, size, initialMistPhase)
      : false;
    if (hasAnimatedMist) {
      mistPhaseRef.current = initialMistPhase;
    }

    if (shroudCanvas) {
      drawExplorationShroud(shroudCanvas, map, offset, size, vision, shroudScale);
    }

    if (!paused && (shroudCanvas || hasAnimatedMist)) {
      let animationTimer: number;
      let lastShroudDraw = 0;
      let lastMistDraw = 0;
      const start = performance.now();
      const frameInterval = Math.min(ShroudAnimationFrameInterval, MistAnimationFrameInterval);
      const drawAnimatedFog = () => {
        const time = performance.now();

        if (shroudCanvas && time - lastShroudDraw >= ShroudAnimationFrameInterval) {
          drawExplorationShroud(
            shroudCanvas,
            map,
            offset,
            size,
            vision,
            shroudScale,
            ((time - start) % ShroudAnimationDuration) / ShroudAnimationDuration,
          );
          lastShroudDraw = time;
        }

        if (mistCanvas && hasAnimatedMist && time - lastMistDraw >= MistAnimationFrameInterval) {
          const mistPhase = getMistAnimationPhase(time, mistStartRef.current);
          drawMist(mistCanvas, mistCache, size, mistPhase);
          mistPhaseRef.current = mistPhase;
          lastMistDraw = time;
        }

        animationTimer = window.setTimeout(drawAnimatedFog, frameInterval);
      };
      animationTimer = window.setTimeout(drawAnimatedFog, frameInterval);

      return () => clearTimeout(animationTimer);
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
      <canvas
        className={mistCanvasStyle}
        data-fog-layer="mist"
        height={canvasHeight * MistScale}
        ref={mistRef}
        style={{
          height: canvasHeight,
          left: -offset,
          top: -offset,
          width: canvasWidth,
          zIndex: zIndex + 1,
        }}
        width={canvasWidth * MistScale}
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

const mistCanvasStyle = css`
  image-rendering: auto;
  mix-blend-mode: screen;
  opacity: 0.8;
  position: absolute;
`;

const shroudCanvasStyle = css`
  image-rendering: auto;
  left: 0;
  position: absolute;
  top: 0;
`;
