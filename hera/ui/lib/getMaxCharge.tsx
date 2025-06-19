import { getSkillConfig } from '@deities/athena/info/Skill.tsx';
import canActivatePower from '@deities/athena/lib/canActivatePower.tsx';
import Player from '@deities/athena/map/Player.tsx';

export default function getMaxCharge(player: Player): number {
  const list: Array<number> = [];
  for (const skill of player.skills) {
    const { charges } = getSkillConfig(skill);
    if (charges && canActivatePower(player, skill)) {
      list.push(charges);
    }
  }

  return Math.max(...list) ?? 0;
}
