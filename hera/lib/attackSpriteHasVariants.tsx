import type { AttackSprite } from '@deities/athena/info/AttackSprite.tsx';
import type { AttackSpriteWithVariants } from '@deities/athena/info/Unit.tsx';

export default function attackSpriteHasVariants(
  sprite: AttackSprite | AttackSpriteWithVariants,
): sprite is AttackSpriteWithVariants {
  return sprite === 'AttackOctopus';
}
