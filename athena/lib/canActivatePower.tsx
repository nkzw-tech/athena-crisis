import { getSkillConfig, Skill } from '../info/Skill.tsx';
import { Charge } from '../map/Configuration.tsx';
import Player, { isHumanPlayer } from '../map/Player.tsx';

export default function canActivatePower(player: Player, skill: Skill) {
  const { charges, requiresCrystal } = getSkillConfig(skill);
  return (
    charges != null &&
    charges * Charge <= player.charge &&
    player.skills.has(skill) &&
    !player.activeSkills.has(skill) &&
    (!requiresCrystal || (isHumanPlayer(player) && player.crystal != null))
  );
}
