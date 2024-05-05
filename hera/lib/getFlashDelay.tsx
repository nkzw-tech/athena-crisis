import { AnimationConfig } from '@deities/athena/map/Configuration.tsx';
import { Animation } from '../MapAnimations.tsx';

export default function getFlashDelay(
  animation: Animation | undefined,
  animationConfig: AnimationConfig,
) {
  if (animation?.type === 'rescue') {
    return {
      animationDelay: `${animationConfig.ExplosionStep * 12}ms`,
      animationDuration: `${3 * animationConfig.ExplosionStep}ms`,
    };
  }

  return (animation?.type === 'attackBuildingFlash' ||
    animation?.type === 'attackUnitFlash') &&
    animation.weapon
    ? {
        animationDelay: `${
          (animation.weapon.animation.frames *
            animation.weapon.animation.repeat -
            3) *
          animationConfig.ExplosionStep
        }ms`,
        animationDuration: `${3 * animationConfig.ExplosionStep}ms`,
      }
    : null;
}
