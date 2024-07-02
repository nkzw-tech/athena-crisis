import { DynamicEffectObjectiveID } from '@deities/apollo/Condition.tsx';
import { Criteria, Objective } from '@deities/athena/Objectives.tsx';
import { EditorState } from '../Types.tsx';
import hasEffectObjective from './hasEffectObjective.tsx';

export default function selectObjectiveEffect(
  editor: EditorState,
  conditionIndex: DynamicEffectObjectiveID,
  objective?: Objective,
): Partial<EditorState> {
  const isDefault = objective?.type === Criteria.Default;
  const trigger =
    !isDefault && objective?.optional ? 'OptionalObjective' : 'GameEnd';
  const effectList = editor.effects.get(trigger);
  const effect = effectList
    ? [...effectList].find(({ conditions }) =>
        hasEffectObjective(
          trigger,
          isDefault ? 'win' : conditionIndex,
          conditions,
        ),
      )
    : false;

  const newEffect =
    trigger === 'OptionalObjective' && typeof conditionIndex === 'number'
      ? ({
          actions: [],
          conditions: [{ type: trigger, value: conditionIndex }],
        } as const)
      : trigger === 'GameEnd'
        ? ({
            actions: [],
            conditions: [{ type: trigger, value: conditionIndex }],
          } as const)
        : null;

  if (!newEffect) {
    throw new Error('selectWinConditionEffect: Invalid effect condition.');
  }

  const effects = effect
    ? editor.effects
    : new Map([
        ...editor.effects,
        [trigger, new Set([...(effectList || []), newEffect])] as const,
      ]);

  return {
    effects,
    mode: 'effects',
    objective: undefined,
    scenario: { effect: effect || newEffect, trigger },
  };
}
