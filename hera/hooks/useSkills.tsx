import { Skills } from '@deities/athena/info/Skill.tsx';
import { useMemo } from 'react';

export default function useSkills(
  skills: ReadonlyArray<number> | null | undefined,
) {
  return useMemo(() => {
    const currentSkills = new Set(skills);
    // Skills should always be sorted by the internal sort order.
    return new Set([...Skills].filter((skill) => currentSkills.has(skill)));
  }, [skills]);
}
