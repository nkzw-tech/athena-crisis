import type { Conditions, WinConditionID } from '@deities/apollo/Condition.tsx';

export default function hasGameEndCondition(
  id: WinConditionID,
  conditions?: Conditions,
) {
  return conditions?.some(
    (condition) => condition.type === 'GameEnd' && condition.value === id,
  );
}
