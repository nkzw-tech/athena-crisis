import { Conditions, WinConditionID } from '@deities/apollo/Condition.tsx';

export default function hasEffectWinCondition(
  type: 'GameEnd' | 'Optional',
  id: WinConditionID,
  conditions?: Conditions,
) {
  return conditions?.some(
    (condition) => condition.type === type && condition.value === id,
  );
}
