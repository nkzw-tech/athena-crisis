import { getSkillConfig } from '@deities/athena/info/Skill.tsx';
import Player from '@deities/athena/map/Player.tsx';
import sortBy from '@nkzw/core/sortBy.js';

export default function getMaxCharge(
  player: Player,
  availableCharges: number,
): number {
  return (
    sortBy(
      [...player.skills].flatMap((skill) => {
        if (player.activeSkills.has(skill)) {
          return [];
        }

        const { charges } = getSkillConfig(skill);
        return charges && charges <= availableCharges ? [charges] : [];
      }),
      (charges) => charges,
    ).at(-1) || 0
  );
}
