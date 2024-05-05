import { SoundName } from '@deities/athena/info/Music.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import type { ReactNode } from 'react';
import { Animations } from '../MapAnimations.tsx';
import { StateToStateLike } from '../Types.tsx';
import { FlyoutColor } from '../ui/Flyout.tsx';
import AnimationKey from './AnimationKey.tsx';

export default function addFlashAnimation(
  animations: Animations,
  {
    children,
    color,
    onComplete = (state) => state,
    position,
    sound,
  }: {
    children: ReactNode;
    color?: FlyoutColor;
    onComplete?: StateToStateLike;
    position: Vector;
    sound?: SoundName;
  },
): Animations {
  return animations.set(new AnimationKey(), {
    children,
    color: color || null,
    onComplete,
    position,
    sound,
    type: 'flash',
  });
}
