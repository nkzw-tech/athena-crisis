import { OilRig, Shipyard } from '@deities/athena/info/Building.tsx';
import { Biome } from '@deities/athena/map/Biome.tsx';
import Building from '@deities/athena/map/Building.tsx';
import { AnimationConfig } from '@deities/athena/map/Configuration.tsx';
import vec from '@deities/athena/map/vec.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import { applyVar, CSSVariables } from '@deities/ui/cssVar.tsx';
import { css, cx, keyframes } from '@emotion/css';
import { Sprites } from 'athena-crisis:images';
import { memo, useEffect, useRef } from 'react';
import Label from './Label.tsx';
import getBuildingSpritePosition from './lib/getBuildingSpritePosition.tsx';
import getFlashDelay from './lib/getFlashDelay.tsx';
import sprite from './lib/sprite.tsx';
import { BuildingAnimation } from './MapAnimations.tsx';
import Tick from './Tick.tsx';
import { RequestFrameFunction, TimerFunction } from './Types.tsx';

const defaultPosition = vec(1, 1);

// This is using a const to give the component a name and
// prevents it from being auto-imported as `Building`.
const BuildingTile = memo(function BuildingTile({
  absolute,
  animation,
  animationConfig,
  biome,
  building,
  fade,
  highlight,
  isVisible = true,
  maybeOutline,
  outline,
  position = defaultPosition,
  requestFrame,
  scheduleTimer,
  size,
  zIndex,
}: {
  absolute?: boolean;
  animation?: BuildingAnimation;
  animationConfig?: AnimationConfig;
  biome: Biome;
  building: Building;
  fade?: boolean | null;
  highlight?: boolean;
  isVisible?: boolean;
  maybeOutline?: boolean;
  outline?: boolean;
  position?: Vector;
  requestFrame?: RequestFrameFunction;
  scheduleTimer?: TimerFunction;
  size: number;
  zIndex?: number;
}) {
  if (isVisible === false) {
    building = building.hide(biome, true);
  }

  const { x, y } = position;
  const { info, player } = building;
  const [spritePositionX, spritePositionY] = getBuildingSpritePosition(
    info,
    player,
    biome,
    isVisible,
  );
  const isBeingCreated = animation?.type === 'createBuilding';
  const positionX = (x - 1) * size;
  const positionY = (y - 2) * size + (isBeingCreated ? size / 6 : 0);
  const height = size * 2 - (isBeingCreated ? size / 3 : 0);
  const elementRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (isBeingCreated) {
      if (!animationConfig || !scheduleTimer || !requestFrame) {
        throw new Error(
          `Building: 'scheduleTimer' or 'requestFrame' props are missing for building animation at '${position}'.`,
        );
      }

      const duration = animationConfig.AnimationDuration * 0.8;
      const animate = () => {
        if (!elementRef.current) {
          return;
        }
        const { style } = elementRef.current;
        const pixelsPerStep = size / 6 / duration;
        let animateStart: number | null = null;
        let start: number | null = null;

        const step = (timestamp: number) => {
          if (!animateStart) {
            animateStart = timestamp;
          }
          if (!start) {
            start = timestamp;
          }

          const progress = Math.min(timestamp - start, duration);
          style.height = height + progress * pixelsPerStep * 2 + 'px';
          style.setProperty(
            vars.set('y'),
            positionY - progress * pixelsPerStep + 'px',
          );
          if (progress < duration) {
            requestFrame(step);
          }
        };

        requestFrame((timestamp: number) => {
          start = null;
          step(timestamp);
          return;
        });
      };

      scheduleTimer(() => {
        if (elementRef.current) {
          elementRef.current.style.opacity = '1';
        }
      }, animationConfig.ExplosionStep / 2);

      animate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animation]);

  const showHighlight = highlight && player > 0;
  const isCompleted = building.isCompleted();

  const buildingTile = (
    <div
      className={cx(
        baseStyle,
        baseBuildingStyle,
        absolute && absoluteStyle,
        info.sprite.name !== 'Structures' &&
          sprite(info.sprite.name, info.isStructure() ? undefined : player),
        isCompleted && completedStyle,
        isCompleted &&
          (player === 2 || player === 3 || player === 5 || player === 7) &&
          darkCompletedStyle,
        showHighlight && brightStyle,
        (maybeOutline || showHighlight) && maybeOutlineStyle,
        outline
          ? biome === Biome.Volcano || biome === Biome.Luna
            ? alternateOutlineStyle
            : outlineStyle
          : null,
        animation &&
          animation.type == 'attackBuildingFlash' &&
          attackFlashStyle,
        fade && fadeStyle,
        animation?.type === 'capture' ? captureStyle : null,
      )}
      ref={elementRef}
      style={{
        ...(info.sprite.name === 'Structures'
          ? { backgroundImage: `url(${Sprites.Structures})` }
          : null),
        [vars.set('x')]: `${positionX}px`,
        [vars.set('y')]: `${positionY}px`,
        backgroundPositionX: -spritePositionX * size + 'px',
        backgroundPositionY: -spritePositionY * size + 'px',
        height,
        opacity: isBeingCreated ? 0 : 1,
        width: `${size}px`,
        zIndex: zIndex ?? 0,
        ...(animationConfig && getFlashDelay(animation, animationConfig)),
      }}
    >
      {(building.id === Shipyard.id || building.id === OilRig.id) && (
        <div
          className={absoluteStyle}
          style={{
            backgroundImage: `url('${Sprites.Crane}')`,
            backgroundPositionY: `calc(${Tick.vars.apply(
              'building',
            )} * ${-size}px)`,
            height: size,
            left: size / 2 + 'px',
            width: size / 2 + 'px',
          }}
        />
      )}
    </div>
  );

  return building.label != null ? (
    <>
      {buildingTile}
      {building.label !== null && (
        <div
          className={cx(baseStyle, absoluteStyle)}
          style={{
            [vars.set('x')]: `${positionX}px`,
            [vars.set('y')]: `${positionY}px`,
            height,
            width: `${size}px`,
            zIndex: zIndex ?? 0,
          }}
        >
          <Label entity={building} hide={!!animation} />
        </div>
      )}
    </>
  ) : (
    buildingTile
  );
});

export default BuildingTile;

const vars = new CSSVariables<
  | 'brightness'
  | 'drop-shadow-color'
  | 'drop-shadow-size'
  | 'saturation'
  | 'skew'
  | 'x'
  | 'y'
>('b');

const absoluteStyle = css`
  position: absolute;
`;

const baseStyle = css`
  ${vars.set('x', 0)}
  ${vars.set('y', 0)}

  pointer-events: none;
  transform: translate3d(${vars.apply('x')}, ${vars.apply('y')}, 0);
`;

const baseBuildingStyle = css`
  ${vars.set('brightness', 1.05)}
  ${vars.set('drop-shadow-color', 'rgba(0, 0, 0, 0)')}
  ${vars.set('drop-shadow-size', '0.5px')}
  ${vars.set('saturation', 1)}
  ${vars.set('skew', '0deg')}
  
  filter: brightness(${vars.apply('brightness')})
    saturate(${vars.apply('saturation')});
  transform: translate3d(${vars.apply('x')}, ${vars.apply('y')}, 0)
    skewX(${vars.apply('skew')});
  transition:
    filter calc(${applyVar('animation-duration')} / 2) ease-in-out,
    opacity calc(${applyVar('animation-duration')} / 2) ease-in-out;
`;

const maybeOutlineStyle = css`
  filter: brightness(${vars.apply('brightness')})
    saturate(${vars.apply('saturation')})
    drop-shadow(
      ${vars.apply('drop-shadow-size')} ${vars.apply('drop-shadow-size')} 0px
        ${vars.apply('drop-shadow-color')}
    )
    drop-shadow(
      calc(-1 * ${vars.apply('drop-shadow-size')})
        calc(-1 * ${vars.apply('drop-shadow-size')}) 0px
        ${vars.apply('drop-shadow-color')}
    )
    drop-shadow(
      calc(-1 * ${vars.apply('drop-shadow-size')})
        ${vars.apply('drop-shadow-size')} 0px ${vars.apply('drop-shadow-color')}
    )
    drop-shadow(
      ${vars.apply('drop-shadow-size')}
        calc(-1 * ${vars.apply('drop-shadow-size')}) 0px
        ${vars.apply('drop-shadow-color')}
    );
`;

const completedStyle = css`
  ${vars.set('saturation', 0.1)}
`;

const darkCompletedStyle = css`
  ${vars.set('brightness', 0.8)}
`;

const brightStyle = css`
  ${vars.set('drop-shadow-color', 'rgb(255, 255, 255)')}
  ${vars.set('brightness', 1.3)}
`;

const outlineStyle = css`
  ${vars.set('drop-shadow-color', 'rgb(210, 18, 24)')}
`;
const alternateOutlineStyle = css`
  ${vars.set('drop-shadow-color', 'rgb(255, 215, 0)')}
`;

const fadeStyle = css`
  mask-image: linear-gradient(
    rgba(0, 0, 0, 0.1),
    rgba(0, 0, 0, 0.5) 45%,
    rgba(0, 0, 0, 1) 65%
  );
  mask-type: alpha;
`;

const attackFlashStyle = css`
  animation-delay: ${applyVar('animation-duration-70')};
  animation-duration: ${applyVar('animation-duration-30')};
  animation-iteration-count: 1;
  animation-name: ${keyframes`
  0% {
    ${vars.set('skew', '0deg')}
    opacity: 1;
  }
  33% {
    ${vars.set('skew', '2.5deg')}
  }
  50% {
    filter: saturate(0.5);
    opacity: 0.5;
  }
  66% {
    ${vars.set('skew', '-2.5deg')}
  }
  100% {
    ${vars.set('skew', '0deg')}
    opacity: 1;
  }
`};
  animation-timing-function: linear;
  transform-origin: bottom center;
`;

const captureStyle = css`
  animation-delay: calc(${applyVar('animation-duration')} * 1.5);
  animation-duration: ${applyVar('animation-duration-30')};
  animation-iteration-count: 2;
  animation-name: ${keyframes`
  0% {
    ${vars.set('skew', '0deg')}
  }
  33% {
    ${vars.set('skew', '2.5deg')}
  }
  66% {
    ${vars.set('skew', '-2.5deg')}
  }
  100% {
    ${vars.set('skew', '0deg')}
  }
`};
  animation-timing-function: linear;
  transform-origin: bottom center;
`;
