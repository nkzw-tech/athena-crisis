import { AnimationConfig } from '@deities/athena/map/Configuration.tsx';
import Player from '@deities/athena/map/Player.tsx';
import { AnimationSpeed } from '../Types.tsx';

export default function getCurrentAnimationConfig(
  player: Player,
  animationSpeed: AnimationSpeed | undefined,
) {
  return (
    animationSpeed?.[player.isHumanPlayer() ? 'human' : 'regular'] ||
    AnimationConfig
  );
}
