import { Ability } from '@deities/athena/info/Unit.tsx';
import { Biome } from '@deities/athena/map/Biome.tsx';
import isPlayable from '@deities/athena/map/isPlayable.tsx';
import { PlayerID } from '@deities/athena/map/Player.tsx';
import SpriteVector from '@deities/athena/map/SpriteVector.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { RadiusItem } from '@deities/athena/Radius.tsx';
import { VisionT } from '@deities/athena/Vision.tsx';
import { CSSVariables } from '@deities/ui/cssVar.tsx';
import { css, cx, keyframes } from '@emotion/css';
import { motion } from 'framer-motion';
import React, { memo } from 'react';
import { GetLayerFunction } from './Types.tsx';

export enum RadiusType {
  Attack,
  Attackable,
  Defense,
  Effect1,
  Effect2,
  Effect3,
  Escort1,
  Escort2,
  Escort3,
  Highlight,
  Lightning,
  Move,
  Rescue,
  Sabotage,
}

export type RadiusInfo = Readonly<{
  dim?: boolean | null;
  fields: ReadonlyMap<Vector, RadiusItem>;
  focus?: 'building' | 'unit';
  locked?: boolean | null;
  path: ReadonlyArray<Vector> | null;
  type: RadiusType;
}>;

const Item = memo(function Item({
  biome,
  dim,
  fields,
  getLayer,
  position,
  size,
  type,
}: {
  biome: Biome;
  dim?: boolean | null;
  fields: ReadonlyMap<Vector, RadiusItem>;
  getLayer: GetLayerFunction;
  position: Vector;
  size: number;
  type: RadiusType;
}) {
  const borderStyles = [];
  if (type !== RadiusType.Attackable) {
    const down = fields.has(position.down());
    const left = fields.has(position.left());
    const right = fields.has(position.right());
    const up = fields.has(position.up());
    if (!left) {
      borderStyles.push(border.left);
    }
    if (!right) {
      borderStyles.push(border.right);
    }
    if (!up) {
      borderStyles.push(border.top);
    }
    if (!down) {
      borderStyles.push(border.bottom);
    }

    if (!down && !left) {
      borderStyles.push(borderRadius.bottomLeft);
    }
    if (!down && !right) {
      borderStyles.push(borderRadius.bottomRight);
    }
    if (!up && !left) {
      borderStyles.push(borderRadius.topLeft);
    }
    if (!up && !right) {
      borderStyles.push(borderRadius.topRight);
    }
  }

  const isEffect =
    type === RadiusType.Effect1 ||
    type === RadiusType.Effect2 ||
    type === RadiusType.Effect3;
  const isEscort =
    type === RadiusType.Escort1 ||
    type === RadiusType.Escort2 ||
    type === RadiusType.Escort3;

  return (
    <motion.div
      animate={{
        opacity: 1,
      }}
      className={cx(
        itemStyle,
        ...borderStyles,
        dim && dimStyle,
        type === RadiusType.Attack &&
          (biome === Biome.Volcano || biome === Biome.Luna)
          ? alternateAttackStyle
          : colors[type],
        isEffect && radialMaskStyle,
        isEscort && animateStyle,
      )}
      initial={{ opacity: isEffect || isEscort ? 1 : 0 }}
      style={{
        [vars.set('x')]: (position.x - 1) * size + 'px',
        [vars.set('y')]: (position.y - 1) * size + 'px',
        height: size,
        width: size,
        zIndex: getLayer(position.y, 'radius'),
      }}
      transition={{
        duration: 0.15,
        ease: 'easeInOut',
      }}
    />
  );
});

const getArrowPath = (
  originalPath: ReadonlyArray<Vector> | null,
  from: Vector | undefined | null,
  size: number,
) => {
  if (!originalPath || !originalPath.length || !from) {
    return null;
  }

  const first = originalPath[0];
  const path = [
    new SpriteVector(
      from.x + (first.x - from.x) * 0.65,
      from.y + (first.y - from.y) * 0.65,
    ),
  ];

  // First, add additional half-steps to the path.
  for (let i = 0; i < originalPath.length; i++) {
    const current = originalPath[i];
    const after = originalPath[i + 1];
    path.push(new SpriteVector(current.x, current.y));
    if (after) {
      path.push(
        new SpriteVector(
          current.x + (after.x - current.x) / 2,
          current.y + (after.y - current.y) / 2,
        ),
      );
    }
  }

  // Then calculate the control points for curves and modify the path.
  const controlPoints: Array<Vector | null> = [null, null];
  for (let i = 1; i < path.length - 1; i++) {
    const before = path[i - 1];
    const after = path[i + 1];
    const delta = new SpriteVector(before.x - after.x, before.y - after.y);
    if (delta.x !== 0 && delta.y !== 0) {
      controlPoints.push(path[i]);
      path.splice(i, 1);
    } else {
      controlPoints.push(null);
    }
  }

  const last = path.at(-1)!;
  const secondToLast = path.at(-2) || first;
  return [
    new SpriteVector(
      from.x + (first.x - from.x) * 0.63,
      from.y + (first.y - from.y) * 0.63,
    ),
    ...path.slice(0, -1),
    new SpriteVector(
      last.x + (secondToLast.x - last.x) * 0.1,
      last.y + (secondToLast.y - last.y) * 0.1,
    ),
  ]
    .map((vector, index) => {
      const control: Vector | null = controlPoints[index];
      return `${
        index
          ? control
            ? `Q${(control.x - 0.5) * size},${(control.y - 0.5) * size} `
            : 'L'
          : 'M'
      }${(vector.x - 0.5) * size},${(vector.y - 0.5) * size}`;
    })
    .join('');
};

const color = '#fff';
const width = 4;

export default memo(function Radius({
  currentViewer,
  getLayer,
  map,
  radius: { dim, fields, path, type },
  selectedPosition,
  selectedUnit,
  size,
  vision,
}: {
  currentViewer: PlayerID | null;
  getLayer: GetLayerFunction;
  map: MapData;
  radius: RadiusInfo;
  selectedPosition?: Vector | null;
  selectedUnit?: Unit | null;
  size: number;
  vision: VisionT;
}) {
  const showCircle = path?.length === 1 && selectedPosition?.equals(path[0]);

  let subPath: ReadonlyArray<Vector> | null = null;
  if (selectedPosition && path) {
    let index: number;
    for (index = path.length - 1; index >= 0; index--) {
      const vector = path[index];
      const unit = map.units.get(vector);
      if (
        !(
          (unit &&
            vision.isVisible(map, vector) &&
            selectedUnit &&
            (!isPlayable(map, currentViewer, unit) ||
              !unit.info.canTransport(
                selectedUnit.info,
                map.getTileInfo(vector),
              ))) ||
          (map.buildings.has(vector) &&
            selectedUnit &&
            !selectedUnit.info.hasAbility(Ability.AccessBuildings))
        )
      ) {
        break;
      }
    }
    subPath = path.slice(0, index + 1);
  }
  const arrowPath = !showCircle
    ? getArrowPath(subPath, selectedPosition, size)
    : null;

  return (
    <>
      {[...fields.values()].map(({ vector }) => (
        <Item
          biome={map.config.biome}
          dim={dim}
          fields={fields}
          getLayer={(y) =>
            getLayer(
              y +
                (vision.isVisible(map, vector) && map.units.has(vector)
                  ? 0
                  : 1),
              'radius',
            )
          }
          key={'r' + String(vector)}
          position={vector}
          size={size}
          type={type}
        />
      ))}
      {showCircle || arrowPath ? (
        <svg
          style={{
            pointerEvents: 'none',
            position: 'absolute',
            zIndex: getLayer(map.size.height + 1, 'radius'),
          }}
          viewBox={`0 0 ${size * map.size.width} ${size * map.size.height}`}
        >
          <defs>
            <marker
              id="arrow"
              markerHeight="4"
              markerWidth="4"
              orient={showCircle ? '100' : 'auto'}
              refX={showCircle ? '3' : '5.3'}
              refY="5.5"
              viewBox="0 0 11 11"
            >
              <polyline
                fill={showCircle ? color : 'none'}
                points="0,5.5 5.5,2.75 0,0"
                stroke={color}
                strokeLinecap="square"
                strokeLinejoin="round"
                strokeWidth="2"
                style={{ strokeDasharray: 14 }}
                transform="matrix(1, 0, 0, 1, 1.83, 2.75)"
              />
            </marker>
          </defs>
          <path
            className={animationStyle}
            d={
              showCircle && selectedPosition
                ? `M${(selectedPosition.x - 0.45) * size},${
                    (selectedPosition.y - 0.175) * size
                  } a8,8 0 1,0 -8,-8`
                : arrowPath!
            }
            fill="none"
            markerEnd="url(#arrow)"
            stroke={color}
            strokeLinecap="square"
            strokeLinejoin="miter"
            strokeWidth={width}
          />
        </svg>
      ) : null}
    </>
  );
});

const vars = new CSSVariables<
  'opacity' | 'color' | 'background-light' | 'x' | 'y'
>('r');

const itemStyle = css`
  ${vars.set('opacity', 0.4)}
  ${vars.set(
    'background-light',
    `rgba(${vars.apply('color')}, calc(${vars.apply('opacity')} / 2))`,
  )}

  background-position-x: 0;
  background-color: rgba(${vars.apply('color')}, ${vars.apply('opacity')});
  background-repeat: no-repeat;
  border: solid 0 rgba(${vars.apply('color')}, 0.6);
  mask: repeating-linear-gradient(
    to top left,
    black,
    black 1px,
    ${vars.apply('background-light')} 0%,
    ${vars.apply('background-light')} 2.13px
  );
  pointer-events: none;
  position: absolute;
  transform: translate3d(${vars.apply('x')}, ${vars.apply('y')}, 0);
`;

const radialMaskStyle = css`
  mask: repeating-radial-gradient(
    circle at 50%,
    black,
    black 1px,
    ${vars.apply('background-light')} 0%,
    ${vars.apply('background-light')} 2.13px
  );
`;

const colors: Record<RadiusType, string> = {
  [RadiusType.Attack]: css`
    ${vars.set('color', '210, 18, 24')}
  `,
  [RadiusType.Attackable]: ``,
  [RadiusType.Defense]: ``,
  [RadiusType.Rescue]: ``,
  [RadiusType.Effect1]: css`
    ${vars.set('opacity', 0.35)}
    ${vars.set('color', '210, 18, 24')}
  `,
  [RadiusType.Effect2]: css`
    ${vars.set('opacity', 0.35)}
    ${vars.set('color', '0, 230, 230')}
  `,
  [RadiusType.Effect3]: css`
    ${vars.set('opacity', 0.35)}
    ${vars.set('color', '19, 19, 209')}
  `,
  [RadiusType.Escort1]: css`
    ${vars.set('opacity', 0.5)}
    ${vars.set('color', '195, 33, 127')}
  `,
  [RadiusType.Escort2]: css`
    ${vars.set('opacity', 0.5)}
    ${vars.set('color', '0, 230, 230')}
  `,
  [RadiusType.Escort3]: css`
    ${vars.set('opacity', 0.5)}
    ${vars.set('color', '230, 230, 0')}
  `,
  [RadiusType.Highlight]: ``,
  [RadiusType.Lightning]: css`
    ${vars.set('color', '139, 23, 133')}
    ${vars.set('opacity', 0.6)}

    border-radius: 8px;
    animation: ${keyframes`
      0% {
        transform: translate3d(${vars.apply(
          'x',
        )}, ${vars.apply('y')}, 0) scale(1, 1);
      }
      50% {
        transform: translate3d(${vars.apply(
          'x',
        )}, ${vars.apply('y')}, 0) scale(1.1, 1.1);        
      }
      100% {
        transform: translate3d(${vars.apply(
          'x',
        )}, ${vars.apply('y')}, 0) scale(0.9, 0.9);
      }
    `} ease-in-out 2s infinite alternate;
  `,
  [RadiusType.Move]: css`
    ${vars.set('color', '19, 19, 209')}
  `,
  [RadiusType.Sabotage]: ``,
};

const alternateAttackStyle = css`
  ${vars.set('color', '255, 215, 0')}
`;

const animationStyle = css`
  animation-duration: 20s;
  animation-iteration-count: infinite;
  animation-timing-function: linear;
  animation-name: ${keyframes`
    from {
      stroke-dashoffset: 100;
    }
    to {
      stroke-dashoffset: 0;
    }
`};
  filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.3));
  stroke-dasharray: 6 8;
`;

const dimStyle = css`
  ${vars.set('opacity', 0.2)}
`;

const borderRadius = {
  bottomLeft: css`
    border-bottom-left-radius: 2px;
  `,
  bottomRight: css`
    border-bottom-right-radius: 2px;
  `,
  topLeft: css`
    border-top-left-radius: 2px;
  `,
  topRight: css`
    border-top-right-radius: 2px;
  `,
};

const animateStyle = css`
  mask-size: 200% 200%;
  animation: ${keyframes`
    0% {
      mask-position: 200% 200%;
    }
    100% {
      mask-position: 0% 0%;
    }
  `} linear 40s infinite;
`;

const border = {
  bottom: css`
    border-bottom-width: 1px;
  `,
  left: css`
    border-left-width: 1px;
  `,
  right: css`
    border-right-width: 1px;
  `,
  top: css`
    border-top-width: 1px;
  `,
};
