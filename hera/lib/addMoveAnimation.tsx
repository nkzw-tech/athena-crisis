import type Vector from '@deities/athena/map/Vector.tsx';
import type { Animations, MoveAnimation } from '../MapAnimations.tsx';

export default function addMoveAnimation(
  animations: Animations,
  {
    endSound,
    from,
    onComplete,
    partial = false,
    path,
    pathVisibility = null,
    realPosition = from,
    startSound,
    tiles,
  }: Omit<MoveAnimation, 'partial' | 'pathVisibility' | 'type'> &
    Readonly<{
      partial?: boolean;
      pathVisibility?: ReadonlyArray<boolean> | null;
      realPosition?: Vector;
    }>,
): Animations {
  return animations.set(realPosition, {
    endSound,
    from,
    onComplete,
    partial,
    path,
    pathVisibility,
    startSound,
    tiles,
    type: 'move',
  });
}
