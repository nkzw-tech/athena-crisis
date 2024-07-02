import { DynamicEffectObjectiveID } from '@deities/apollo/Condition.tsx';
import { WinCondition, WinCriteria } from '@deities/athena/WinConditions.tsx';
import { EditorState } from '../Types.tsx';
import hasEffectWinCondition from './hasEffectWinCondition.tsx';

export default function selectWinConditionEffect(
  editor: EditorState,
  conditionIndex: DynamicEffectObjectiveID,
  condition?: WinCondition,
): Partial<EditorState> {
  const isDefault = condition?.type === WinCriteria.Default;
  const trigger =
    !isDefault && condition?.optional ? 'OptionalObjective' : 'GameEnd';
  const effectList = editor.effects.get(trigger);
  const effect = effectList
    ? [...effectList].find(({ conditions }) =>
        hasEffectWinCondition(
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
    condition: undefined,
    effects,
    mode: 'effects',
    scenario: { effect: effect || newEffect, trigger },
  };
}
