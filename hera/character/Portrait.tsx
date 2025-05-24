import { spriteImage } from '@deities/art/Sprites.tsx';
import {
  AmphibiousTank,
  APU,
  Brute,
  Helicopter,
  SuperAPU,
  UnitInfo,
} from '@deities/athena/info/Unit.tsx';
import {
  DynamicPlayerID,
  encodeDynamicPlayerID,
} from '@deities/athena/map/Player.tsx';
import { sm } from '@deities/ui/Breakpoints.tsx';
import clipBorder from '@deities/ui/clipBorder.tsx';
import useMedia from '@deities/ui/hooks/useMedia.tsx';
import { css, cx } from '@emotion/css';
import { memo, useLayoutEffect, useRef } from 'react';
import { useSprites } from '../hooks/useSprites.tsx';

export const PortraitWidth = 55;
export const PortraitHeight = 75;

type RGB = readonly [r: number, g: number, b: number];

const hexToRgb = (hex: string): RGB => {
  const int24 = Number.parseInt(hex.slice(1), 16);
  const r = (int24 >> 16) & 0xff;
  const g = (int24 >> 8) & 0xff;
  const b = int24 & 0xff;
  return [r, g, b];
};

const silhouetteColor = hexToRgb('#111111');
const backgroundColor = hexToRgb('#0094ff');

const extraBackgroundColors = new Map([
  [
    APU,
    [
      hexToRgb('#111111'),
      hexToRgb('#5a6066'),
      hexToRgb('#7c2b3f'),
      hexToRgb('#819796'),
      hexToRgb('#a86b55'),
      hexToRgb('#abc6d1'),
      hexToRgb('#c09473'),
      hexToRgb('#fcffff'),
    ],
  ],
  [
    Helicopter,
    [
      hexToRgb('#111111'),
      hexToRgb('#5a6266'),
      hexToRgb('#819796'),
      hexToRgb('#abc6d1'),
      hexToRgb('#ccffff'),
    ],
  ],
  [
    AmphibiousTank,
    [
      hexToRgb('#111111'),
      hexToRgb('#464725'),
      hexToRgb('#6c7c42'),
      hexToRgb('#7c2b2b'),
      hexToRgb('#9c4c3f'),
      hexToRgb('#a4ad5d'),
      hexToRgb('#bc7349'),
      hexToRgb('#c97546'),
      hexToRgb('#ccffff'),
      hexToRgb('#fcffff'),
      hexToRgb('#ffc95e'),
    ],
  ],
] as const);

const tolerance = 1;

const matches = (
  data: Uint8ClampedArray<ArrayBufferLike>,
  index: number,
  color: readonly [number, number, number],
) =>
  Math.abs(data[index] - color[0]) <= tolerance &&
  Math.abs(data[index + 1] - color[1]) <= tolerance &&
  Math.abs(data[index + 2] - color[2]) <= tolerance;

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

    const image = spriteImage('Portraits', encodeDynamicPlayerID(player));
    const context = canvas.getContext('2d', { willReadFrequently: true })!;
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
    let currentPosition =
      ((Number(document.timeline.currentTime) || 0) / 1000) % 1 < 0.5 ? 0 : 1;

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

      if (silhouette) {
        const image = context.getImageData(0, 0, PortraitWidth, PortraitHeight);
        const data = image.data;

        for (let index = 0; index < data.length; index += 4) {
          const colors = extraBackgroundColors.get(unit);
          const r = index,
            g = index + 1,
            b = index + 2;

          if (colors) {
            if (colors.some((color) => matches(data, index, color))) {
              data[r] = backgroundColor[0];
              data[g] = backgroundColor[1];
              data[b] = backgroundColor[2];
            } else {
              data[r] = silhouetteColor[0];
              data[g] = silhouetteColor[1];
              data[b] = silhouetteColor[2];
            }
          } else if (!matches(data, index, backgroundColor)) {
            data[r] = silhouetteColor[0];
            data[g] = silhouetteColor[1];
            data[b] = silhouetteColor[2];
          }
        }

        const edges = [];
        for (let y = 0; y < PortraitHeight; y++) {
          for (let x = 0; x < PortraitWidth; x++) {
            const index = (y * PortraitWidth + x) * 4;
            if (
              data[index] === silhouetteColor[0] &&
              data[index + 1] === silhouetteColor[1] &&
              data[index + 2] === silhouetteColor[2]
            ) {
              if (
                (y > 0 &&
                  matches(data, index - PortraitWidth * 4, backgroundColor)) ||
                (y < PortraitHeight - 1 &&
                  matches(data, index + PortraitWidth * 4, backgroundColor)) ||
                (x > 0 && matches(data, index - 4, backgroundColor)) ||
                (x < PortraitWidth - 1 &&
                  matches(data, index + 4, backgroundColor))
              ) {
                edges.push([x, y]);
              }
            }
          }
        }

        context.putImageData(image, 0, 0);

        context.fillStyle = '#fff';
        for (const [x, y] of edges) {
          context.fillRect(x, y, 1, 1);
        }
      }

      currentPosition = (currentPosition + 1) % positions.length;
    };

    draw();

    if (animate && !paused) {
      const interval = setInterval(draw, 1000 / positions.length);
      return () => clearInterval(interval);
    }
  }, [
    hasPortraits,
    animate,
    paused,
    player,
    position,
    variant,
    silhouette,
    unit,
  ]);

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
