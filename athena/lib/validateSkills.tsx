import { CampaignOnlySkills, Skill, Skills } from '../info/Skill.tsx';
import MapData from '../MapData.tsx';

export default function validateSkills(
  {
    skills,
    unlockedSkillSlots,
  }: { skills: Iterable<number>; unlockedSkillSlots: ReadonlyArray<number> },
  playerSkills: Iterable<number> | null | undefined,
  map: MapData,
  { hasSkills, isCampaign }: { hasSkills: boolean; isCampaign: boolean },
): ReadonlySet<Skill> {
  const validatedSkills = new Set<Skill>();
  const skillSet = new Set(playerSkills);

  if (
    !hasSkills ||
    !skillSet.size ||
    skillSet.size > unlockedSkillSlots.length
  ) {
    return validatedSkills;
  }

  const existingSkills = new Set<Skill>(skills);
  for (const skill of skillSet) {
    if (
      Skills.has(skill) &&
      existingSkills.has(skill) &&
      !map.config.blocklistedSkills.has(skill) &&
      (isCampaign || !CampaignOnlySkills.has(skill))
    ) {
      validatedSkills.add(skill);
    }
  }

  return validatedSkills;
}
