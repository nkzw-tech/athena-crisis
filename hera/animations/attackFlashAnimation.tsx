import type { AttackDirection } from '@deities/apollo/attack-direction/getAttackDirection.tsx';
import type Vector from '@deities/athena/map/Vector.tsx';
import type { Actions, State } from '../Types.tsx';

type Options = Readonly<{
  direction: AttackDirection;
  hasAttackStance: boolean;
  position: Vector;
  type: 'unit' | 'building';
}>;

export default function attackFlashAnimation(
  { scheduleTimer, update }: Actions,
  state: State,
  options: Options,
): Promise<State> {
  return new Promise((resolve) => {
    const { animationConfig, animations } = state;

    update({
      animations: animations.set(options.position, {
        direction: options.direction,
        hasAttackStance: options.hasAttackStance,
        type:
          options.type === 'unit' && options.direction
            ? 'attackUnitFlash'
            : 'attackBuildingFlash',
        variant: 0,
      }),
    });

    scheduleTimer(async () => {
      const state = await update(null);
      resolve({
        ...state,
        animations: state.animations.delete(options.position),
      });
    }, animationConfig.AnimationDuration);
  });
}
