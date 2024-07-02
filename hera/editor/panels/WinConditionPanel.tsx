import { Effect, Effects } from '@deities/apollo/Effects.tsx';
import dropInactivePlayers from '@deities/athena/lib/dropInactivePlayers.tsx';
import {
  Criteria,
  CriteriaList,
  getInitialWinCondition,
  validateWinCondition,
  WinCondition,
  winConditionHasVectors,
} from '@deities/athena/WinConditions.tsx';
import groupBy from '@deities/hephaestus/groupBy.tsx';
import Box from '@deities/ui/Box.tsx';
import InlineLink from '@deities/ui/InlineLink.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { css } from '@emotion/css';
import { useCallback, useState } from 'react';
import { UserWithFactionNameAndSkills } from '../../hooks/useUserMap.tsx';
import getCriteriaName from '../../lib/getCriteriaName.tsx';
import { StateWithActions } from '../../Types.tsx';
import hasEffectWinCondition from '../lib/hasEffectWinCondition.tsx';
import selectWinConditionEffect from '../lib/selectWinConditionEffect.tsx';
import WinConditionCard from '../lib/WinConditionCard.tsx';
import { EditorState, SetEditorStateFunction } from '../Types.tsx';

const maybeRemoveEffect = (
  effects: Effects,
  condition: WinCondition,
  index: number,
  setEditorState: SetEditorStateFunction,
) => {
  if (condition.type === Criteria.Default) {
    return;
  }

  const trigger = condition.optional ? 'OptionalObjective' : 'GameEnd';
  const list = effects.get(trigger);
  if (list) {
    const newList = new Set(
      [...list].filter(
        ({ conditions }) => !hasEffectWinCondition(trigger, index, conditions),
      ),
    );
    const newEffects = new Map(effects).set(trigger, newList);
    if (!newList.size) {
      newEffects.delete(trigger);
    }
    for (const [effectTrigger, effectList] of newEffects) {
      const newList = new Set<Effect>();
      for (const effect of effectList) {
        newList.add({
          ...effect,
          conditions: effect.conditions?.map((condition) =>
            condition.type === trigger &&
            typeof condition.value === 'number' &&
            condition.value > index
              ? {
                  ...condition,
                  value: condition.value - 1,
                }
              : condition,
          ),
        });
      }
      newEffects.set(effectTrigger, newList);
    }
    setEditorState({
      effects: newEffects,
    });
  }
};

const maybeSwapEffect = (
  effects: Effects,
  condition: WinCondition,
  existingCondition: WinCondition,
  index: number,
  setEditorState: SetEditorStateFunction,
) => {
  if (
    condition.type === Criteria.Default ||
    existingCondition.type === Criteria.Default ||
    existingCondition.optional === condition.optional
  ) {
    return;
  }

  const trigger = existingCondition.optional ? 'OptionalObjective' : 'GameEnd';
  const newTrigger = trigger === 'GameEnd' ? 'OptionalObjective' : 'GameEnd';
  const list = effects.get(trigger);
  if (!list) {
    return;
  }

  const partition = groupBy(list, ({ conditions }) =>
    hasEffectWinCondition(trigger, index, conditions) ? 'target' : 'origin',
  );
  const target = partition.get('target')?.map((effect) => ({
    ...effect,
    conditions: effect.conditions?.map((condition) => {
      const { type } = condition;
      if (type === trigger) {
        const { value } = condition;
        if (typeof value === 'number' && value === index) {
          return {
            ...condition,
            type: newTrigger,
            value,
          } as const;
        }
      }
      return condition;
    }),
  }));

  const newEffects = new Map(effects);
  if (target) {
    newEffects.set(newTrigger, new Set(target));
  }

  const origin = partition.get('origin');
  if (origin) {
    newEffects.set(trigger, new Set(origin));
  } else {
    newEffects.delete(trigger);
  }
  setEditorState({
    effects: newEffects,
  });
};

export default function WinConditionPanel({
  actions,
  editor,
  hasContentRestrictions,
  isAdmin,
  setEditorState,
  state,
  user,
}: StateWithActions & {
  editor: EditorState;
  hasContentRestrictions: boolean;
  isAdmin?: boolean;
  setEditorState: SetEditorStateFunction;
  user: UserWithFactionNameAndSkills;
}) {
  const { map } = state;
  const { config } = map;
  const { winConditions: conditions } = config;
  const mapWithActivePlayers = dropInactivePlayers(map);

  const [renders, setRenders] = useState(0);
  const validate = useCallback(
    (condition: WinCondition) => validateWinCondition(map, condition),
    [map],
  );

  const hasDefault = conditions.some(({ type }) => type === Criteria.Default);

  const updateWinCondition = (
    condition: WinCondition | null,
    index: number,
  ) => {
    const winConditions = [...conditions];
    const existingCondition = winConditions[index];
    if (!condition) {
      maybeRemoveEffect(
        editor.effects,
        existingCondition,
        index,
        setEditorState,
      );
      winConditions.splice(index, 1);
      if (!winConditions.length) {
        winConditions.push(getInitialWinCondition(map, Criteria.Default));
      }
      // Increment this counter to force re-rendering all list items which resets their state.
      setRenders((renders) => renders + 1);
      actions.update({
        map: map.copy({
          config: map.config.copy({
            winConditions,
          }),
        }),
      });

      return;
    }

    if (validate(condition)) {
      maybeSwapEffect(
        editor.effects,
        condition,
        existingCondition,
        index,
        setEditorState,
      );

      winConditions[index] = condition;
      actions.update({
        map: map.copy({
          config: map.config.copy({
            winConditions,
          }),
        }),
      });
    }
  };

  if (editor?.condition) {
    return (
      <Stack gap={24} vertical verticalPadding>
        <Box>
          <InlineLink
            onClick={() => {
              setEditorState({
                condition: undefined,
              });
            }}
          >
            <fbt desc="Label to stop selecting location">
              Stop selecting location
            </fbt>
          </InlineLink>
        </Box>
      </Stack>
    );
  }

  return (
    <Stack gap={24} vertical verticalPadding>
      {conditions.map((condition, index) => (
        <WinConditionCard
          canDelete={
            conditions.length > 1 || condition.type !== Criteria.Default
          }
          condition={condition}
          hasContentRestrictions={hasContentRestrictions}
          index={index}
          isAdmin={isAdmin}
          key={`${renders}-${index}`}
          map={mapWithActivePlayers}
          onChange={(condition) => updateWinCondition(condition, index)}
          selectEffect={() =>
            setEditorState(selectWinConditionEffect(editor, index, condition))
          }
          selectLocation={() => {
            if (winConditionHasVectors(condition)) {
              setEditorState({
                condition: [condition, index],
              });
            }
          }}
          user={user}
          validate={validate}
        />
      ))}
      <Box gap={16} vertical>
        <h2>
          <fbt desc="Headline for adding a new objective">New Objective</fbt>
        </h2>
        <Stack gap vertical>
          {CriteriaList.filter(
            (type) => type !== Criteria.Default || !hasDefault,
          ).map((type, index) => (
            <InlineLink
              className={linkStyle}
              key={index}
              onClick={() =>
                actions.update({
                  map: map.copy({
                    config: map.config.copy({
                      winConditions: [
                        ...conditions,
                        getInitialWinCondition(map, type),
                      ],
                    }),
                  }),
                })
              }
            >
              {getCriteriaName(type)}
            </InlineLink>
          ))}
        </Stack>
      </Box>
    </Stack>
  );
}

const linkStyle = css`
  width: fit-content;
`;
