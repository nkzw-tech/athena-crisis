import {
  Conditions,
  DynamicEffectObjectiveID,
} from '@deities/apollo/Condition.tsx';

export default function hasEffectObjective(
  type: 'GameEnd' | 'OptionalObjective',
  id: DynamicEffectObjectiveID,
  conditions?: Conditions,
) {
  return conditions?.some(
    (condition) => condition.type === type && condition.value === id,
  );
}
