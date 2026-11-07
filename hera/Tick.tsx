import { AnimationSpeed, type AnimationConfig } from '@deities/athena/map/Configuration.tsx';
import cssVar, { applyVar, CSSVariables } from '@deities/ui/cssVar.tsx';
import { css, cx, keyframes } from '@emotion/css';
import { ReactNode } from 'react';

export default function Tick({
  animationConfig: { AnimationDuration, UnitAnimationStep, UnitMoveDuration },
  children,
  className,
  paused,
}: {
  animationConfig: AnimationConfig;
  children: ReactNode;
  className?: string;
  paused?: boolean;
}) {
  return (
    <div
      className={cx(animationStyle, className)}
      style={{
        animationPlayState: paused ? 'paused' : 'running',
        [cssVar('animation-duration-30')]: `calc(${applyVar('animation-duration')} * 0.3)`,
        [cssVar('animation-duration-70')]: `calc(${applyVar('animation-duration')} * 0.7)`,
        [cssVar('animation-duration')]: `${AnimationDuration}ms`,
        [cssVar('unit-animation-step')]: `${UnitAnimationStep}ms`,
        [cssVar('unit-move-duration')]: `${UnitMoveDuration}ms`,
        imageRendering: 'pixelated',
        [vars.set('building')]: 0,
        [vars.set('tile-decorator')]: 0,
        [vars.set('unit-attack-stance')]: 0,
        [vars.set('unit')]: 0,
      }}
    >
      {children}
    </div>
  );
}

const vars = (Tick.vars = new CSSVariables<
  'unit' | 'unit-attack-stance' | 'building' | 'tile-decorator'
>('i'));

const unitAnimation = keyframes`
  0%, 100% {
    ${vars.set('unit', 0)}
  }
  12.5% {
    ${vars.set('unit', 1)}
  }
  25% {
    ${vars.set('unit', 2)}
  }
  37.5% {
    ${vars.set('unit', 3)}
  }
  50% {
    ${vars.set('unit', 4)}
  }
  62.5% {
    ${vars.set('unit', 5)}
  }
  75% {
    ${vars.set('unit', 6)}
  }
  87.5% {
    ${vars.set('unit', 7)}
  }
`;

const attackStanceAnimation = keyframes`
  0%, 100% {
    ${vars.set('unit-attack-stance', 4)}
  }
  25% {
    ${vars.set('unit-attack-stance', 5)}
  }
  50% {
    ${vars.set('unit-attack-stance', 6)}
  }
  75% {
    ${vars.set('unit-attack-stance', 7)}
  }
`;

const buildingAnimation = keyframes`
  0%, 100% {
    ${vars.set('building', 0)}
  }
  25% {
    ${vars.set('building', 1)}
  }
  50% {
    ${vars.set('building', 2)}
  }
  75% {
    ${vars.set('building', 3)}
  }
`;

const tileDecoratorAnimation = keyframes`
  0%, 100% {
    ${vars.set('tile-decorator', 0)}
  }
  25% {
    ${vars.set('tile-decorator', 2)}
  }
  50% {
    ${vars.set('tile-decorator', 4)}
  }
  75% {
    ${vars.set('tile-decorator', 6)}
  }
`;

// Each keyframe above is one sprite frame, and the timing function applies
// between every pair of keyframes. `step-end` holds each frame until the next
// one. Some browsers (mostly mobile) treat these variables as numbers and blend
// them, so `steps(n)` here would slide the sprite sheet between frames.
const animationStyle = css`
  animation:
    ${unitAnimation} ${AnimationSpeed * 8}ms step-end infinite,
    ${attackStanceAnimation} ${AnimationSpeed * 4}ms step-end infinite,
    ${buildingAnimation} ${AnimationSpeed * 6 * 2}ms step-end infinite,
    ${tileDecoratorAnimation} ${AnimationSpeed * 6 * 2}ms step-end infinite;
`;
