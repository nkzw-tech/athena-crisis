import getMapName from '../i18n/getMapName.tsx';
import type { Animations } from '../MapAnimations.tsx';
import type { Actions, State } from '../Types.tsx';
import AnimationKey from './AnimationKey.tsx';

export default function startGameAnimation(
  { update }: Actions,
  animations: Animations,
  mapName: string,
): Promise<State> {
  return new Promise((resolve) =>
    update({
      animations: animations.set(new AnimationKey(), {
        length: 'long',
        onComplete: (state) => {
          requestAnimationFrame(() => resolve(state));
          return null;
        },
        player: 0,
        sound: 'UI/Start',
        text: getMapName(mapName),
        type: 'banner',
      }),
    }),
  );
}
