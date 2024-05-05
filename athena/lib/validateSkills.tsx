import { Skill, Skills } from '../info/Skill.tsx';
import MapData from '../MapData.tsx';

export default function validateSkills(
  { skillSlots, skills }: { skillSlots: number; skills: Iterable<number> },
  playerSkills: Iterable<number> | null | undefined,
  map: MapData,
  hasSkills: boolean,
): ReadonlySet<Skill> {
  const validatedSkills = new Set<Skill>();
  const skillSet = new Set(playerSkills);

  if (!hasSkills || !skillSet.size || skillSet.size > skillSlots) {
    return validatedSkills;
  }

  const existingSkills = new Set<Skill>(skills);
  for (const skill of skillSet) {
    if (
      Skills.has(skill) &&
      existingSkills.has(skill) &&
      !map.config.blocklistedSkills.has(skill)
    ) {
      validatedSkills.add(skill);
    }
  }

  return validatedSkills;
}
