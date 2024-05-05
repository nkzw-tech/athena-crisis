import { WinConditionID } from '@deities/apollo/Condition.tsx';
import { WinCondition, WinCriteria } from '@deities/athena/WinConditions.tsx';
import { EditorState } from '../Types.tsx';
import hasGameEndCondition from './hasGameEndCondition.tsx';

export default function selectWinConditionEffect(
  editor: EditorState,
  conditionIndex: number | WinConditionID,
  condition?: WinCondition,
): Partial<EditorState> {
  const effectList = editor.effects.get('GameEnd');
  const effect = effectList
    ? [...effectList].find(({ conditions }) =>
        hasGameEndCondition(
          condition?.type === WinCriteria.Default ? 'win' : conditionIndex,
          conditions,
        ),
      )
    : false;

  const newEffect = {
    actions: [],
    conditions: [{ type: 'GameEnd', value: conditionIndex }],
  } as const;
  const effects = effect
    ? editor.effects
    : new Map([
        ...editor.effects,
        ['GameEnd', new Set([...(effectList || []), newEffect])] as const,
      ]);

  return {
    condition: undefined,
    effects,
    mode: 'effects',
    scenario: { effect: effect || newEffect, trigger: 'GameEnd' },
  };
}
