import type { AttackDirection } from '@deities/apollo/attack-direction/getAttackDirection.tsx';
import type { MaybeTileID } from '@deities/athena/info/Tile.tsx';
import { Beach, isSea } from '@deities/athena/info/Tile.tsx';
import isAmphibiousOnLand from '@deities/athena/lib/isAmphibiousOnLand.tsx';
import type Entity from '@deities/athena/map/Entity.tsx';
import { getEntityGroup, isUnit } from '@deities/athena/map/Entity.tsx';
import type Vector from '@deities/athena/map/Vector.tsx';
import AnimationKey from '../lib/AnimationKey.tsx';
import type { Animations } from '../MapAnimations.tsx';
import type { State, StateToStateLike } from '../Types.tsx';

const isSeaExceptBeach = (id: MaybeTileID | null) =>
  !id || (isSea(id) && id !== Beach.id);

export default function addExplosionAnimation(
  state: State,
  entity: Entity,
  position: Vector,
  direction: AttackDirection | undefined,
  onComplete: StateToStateLike,
  onExplode: StateToStateLike,
): Animations {
  const isUnitEntity = isUnit(entity);

  const withExplosion =
    isUnitEntity &&
    entity.info.sprite.withNavalExplosion &&
    isSeaExceptBeach(state.map.getTile(position));

  const sprite = isUnitEntity
    ? ((entity.isUnfolded() || withExplosion) &&
        entity.info.sprite.alternativeExplosionSprite) ||
      entity.info.sprite.explosionSprite
    : null;

  const key = new AnimationKey();
  const complete = (state: State) => {
    const newState = {
      ...state,
      animations: state.animations.delete(position).delete(key),
    };
    return onComplete(
      onExplode ? { ...newState, ...onExplode(state) } : newState,
    );
  };
  const animations = withExplosion
    ? state.animations.set(key, {
        direction,
        onComplete: complete,
        onExplode,
        position,
        style: 'naval-death',
        type: 'explosion',
      })
    : state.animations;

  return sprite
    ? animations.set(position, {
        direction,
        fade: true,
        locked: true,
        ...sprite,
        frames: withExplosion ? Math.max(0, sprite.frames - 3) : sprite.frames,
        onComplete: withExplosion ? () => null : complete,
        type: 'unitExplosion',
        withExplosion,
      })
    : animations
        .set(position, {
          direction,
          onComplete,
          onExplode,
          style: isAmphibiousOnLand(entity, state.map.getTileInfo(position))
            ? 'land'
            : getEntityGroup(entity),
          type: 'explosion',
        })
        .set(new AnimationKey(), { type: 'shake' });
}
