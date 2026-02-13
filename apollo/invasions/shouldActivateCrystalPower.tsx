import { getSkillConfig, Skill } from '@deities/athena/info/Skill.tsx';
import { Crystal } from '@deities/athena/invasions/Crystal.tsx';
import Player, { isHumanPlayer } from '@deities/athena/map/Player.tsx';
import UnknownTypeError from '@nkzw/core/UnknownTypeError.js';

export default function shouldActivateCrystalPower(player: Player, skill: Skill) {
  const { activateOnInvasion } = getSkillConfig(skill);
  const crystal = isHumanPlayer(player) ? player.crystal : null;

  if (activateOnInvasion) {
    switch (activateOnInvasion) {
      case 'all':
        return true;
      case 'phantom-only':
        return crystal === Crystal.Phantom;
      case 'no-command':
        return crystal !== Crystal.Command;
      default: {
        activateOnInvasion satisfies never;
        throw new UnknownTypeError('shouldActivateCrystalPower', activateOnInvasion);
      }
    }
  }
  return false;
}
