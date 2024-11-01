import { getSkillConfig, Skill } from '@deities/athena/info/Skill.tsx';
import { Crystal } from '@deities/athena/invasions/Crystal.tsx';
import Player, { isHumanPlayer } from '@deities/athena/map/Player.tsx';

export default function shouldActivateCrystalPower(
  player: Player,
  skill: Skill,
) {
  const { activateOnInvasion, ignoreCommandCrystal } = getSkillConfig(skill);
  return (
    activateOnInvasion &&
    (!ignoreCommandCrystal ||
      (isHumanPlayer(player) && player.crystal !== Crystal.Command))
  );
}
