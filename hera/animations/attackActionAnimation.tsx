import type { AttackDirection } from '@deities/apollo/attack-direction/getAttackDirection.tsx';
import type { AttackStance, Weapon } from '@deities/athena/info/Unit.tsx';
import type { PlayerID } from '@deities/athena/map/Player.tsx';
import type Vector from '@deities/athena/map/Vector.tsx';
import AnimationKey from '../lib/AnimationKey.tsx';
import type { Actions, State } from '../Types.tsx';

export default function attackActionAnimation(
  { update }: Actions,
  state: State,
  {
    attackStance,
    damage,
    directions: [direction, oppositeDirection],
    from,
    isBuilding,
    style,
    to,
    variant,
    weapon,
  }: {
    attackStance?: AttackStance;
    damage: number | null;
    directions: [AttackDirection, AttackDirection?];
    from: Vector;
    isBuilding: boolean;
    style: 'unfold' | null;
    to: Vector | null;
    variant: PlayerID;
    weapon: Weapon | null;
  },
): Promise<State> {
  const { map } = state;
  const originalEntityB =
    to && (isBuilding ? map.buildings.get(to) : map.units.get(to));

  return weapon
    ? new Promise((resolve) => {
        update({
          animations: (to && oppositeDirection
            ? state.animations.set(to, {
                direction: oppositeDirection,
                hasAttackStance: !!attackStance,
                type: isBuilding ? 'attackBuildingFlash' : 'attackUnitFlash',
                variant,
                weapon,
              })
            : state.animations
          ).set(from, {
            direction,
            frames: attackStance
              ? attackStance === 'long'
                ? 16
                : 8
              : undefined,
            hasAttackStance: !!attackStance,
            onComplete: (state) => {
              const animations =
                to && oppositeDirection
                  ? state.animations.delete(to)
                  : state.animations;

              resolve({
                ...state,
                animations:
                  to && damage != null
                    ? animations.set(new AnimationKey(), {
                        change: -damage,
                        position: to,
                        previousHealth: originalEntityB?.health || 0,
                        type: 'health',
                      })
                    : animations,
              });
              return null;
            },
            style,
            type: 'attack',
            variant,
            weapon,
          }),
        });
      })
    : Promise.resolve(state);
}
