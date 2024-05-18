import {
  SeaAnimation,
  ShipyardConstructionSiteDecorator,
} from '@deities/athena/info/Tile.tsx';
import type { AnimationConfig } from '@deities/athena/map/Configuration.tsx';
import cssVar, { applyVar, CSSVariables } from '@deities/ui/cssVar.tsx';
import type { ReactNode } from 'react';
import React, { useCallback, useRef } from 'react';
import { getIdleFrame, useTick } from './lib/tick.tsx';

const UnitAnimation = {
  animation: { frames: 8, offset: 1, ticks: 1 },
};
const UnitAttackStanceAnimation = {
  animation: { frames: 4, offset: 1, ticks: 1 },
};
const BuildingAnimation = {
  animation: { ...SeaAnimation, offset: 1 },
};

const TileDecoratorAnimation = {
  animation: ShipyardConstructionSiteDecorator.animation!,
};

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
  const ref = useRef<HTMLDivElement>(null);
  useTick(
    paused,
    useCallback((tick: number) => {
      if (ref.current) {
        const style = ref.current.style;
        const attackStance = getIdleFrame(UnitAttackStanceAnimation, tick);
        style.setProperty(
          vars.set('unit'),
          '' + getIdleFrame(UnitAnimation, tick),
        );
        style.setProperty(
          vars.set('unit-attack-stance'),
          attackStance != null ? '' + (4 + attackStance) : '',
        );
        style.setProperty(
          vars.set('building'),
          '' + getIdleFrame(BuildingAnimation, tick),
        );
        style.setProperty(
          vars.set('tile-decorator'),
          '' + getIdleFrame(TileDecoratorAnimation, tick),
        );
      }
    }, []),
    [],
  );

  return (
    <div
      className={className}
      ref={ref}
      style={{
        [vars.set('building')]: 0,
        [vars.set('tile-decorator')]: 0,
        [vars.set('unit')]: 0,
        [cssVar('animation-duration')]: `${AnimationDuration}ms`,
        [cssVar('unit-animation-step')]: `${UnitAnimationStep}ms`,
        [cssVar('unit-move-duration')]: `${UnitMoveDuration}ms`,
        [cssVar('animation-duration-70')]: `calc(${applyVar(
          'animation-duration',
        )} * .7)`,
        [cssVar('animation-duration-30')]: `calc(${applyVar(
          'animation-duration',
        )} * .3)`,
        imageRendering: 'pixelated',
      }}
    >
      {children}
    </div>
  );
}

const vars = (Tick.vars = new CSSVariables<
  'unit' | 'unit-attack-stance' | 'building' | 'tile-decorator'
>('i'));
