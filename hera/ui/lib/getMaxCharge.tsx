import { getSkillConfig } from '@deities/athena/info/Skill.tsx';
import Player from '@deities/athena/map/Player.tsx';
import sortBy from '@deities/hephaestus/sortBy.tsx';

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
