import {
  Conditions,
  DynamicEffectObjectiveID,
} from '@deities/apollo/Condition.tsx';

export default function hasEffectWinCondition(
  type: 'GameEnd' | 'OptionalObjective',
  id: DynamicEffectObjectiveID,
  conditions?: Conditions,
) {
  return conditions?.some(
    (condition) => condition.type === type && condition.value === id,
  );
}
