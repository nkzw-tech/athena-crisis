import { Effect, Effects } from '@deities/apollo/Effects.tsx';
import dropInactivePlayers from '@deities/athena/lib/dropInactivePlayers.tsx';
import {
  Criteria,
  CriteriaList,
  getInitialObjective,
  Objective,
  objectiveHasVectors,
  validateObjective,
} from '@deities/athena/Objectives.tsx';
import groupBy from '@deities/hephaestus/groupBy.tsx';
import Box from '@deities/ui/Box.tsx';
import InlineLink from '@deities/ui/InlineLink.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { css } from '@emotion/css';
import { useCallback, useState } from 'react';
import { UserWithFactionNameAndSkills } from '../../hooks/useUserMap.tsx';
import getCriteriaName from '../../lib/getCriteriaName.tsx';
import { StateWithActions } from '../../Types.tsx';
import hasEffectObjective from '../lib/hasEffectObjective.tsx';
import ObjectiveCard from '../lib/ObjectiveCard.tsx';
import selectObjectiveEffect from '../lib/selectObjectiveEffect.tsx';
import { EditorState, SetEditorStateFunction } from '../Types.tsx';

const maybeRemoveEffect = (
  effects: Effects,
  objective: Objective,
  index: number,
  setEditorState: SetEditorStateFunction,
) => {
  if (objective.type === Criteria.Default) {
    return;
  }

  const trigger = objective.optional ? 'OptionalObjective' : 'GameEnd';
  const list = effects.get(trigger);
  if (list) {
    const newList = new Set(
      [...list].filter(
        ({ conditions }) => !hasEffectObjective(trigger, index, conditions),
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
  objective: Objective,
  existingObjective: Objective,
  index: number,
  setEditorState: SetEditorStateFunction,
) => {
  if (
    objective.type === Criteria.Default ||
    existingObjective.type === Criteria.Default ||
    existingObjective.optional === objective.optional
  ) {
    return;
  }

  const trigger = existingObjective.optional ? 'OptionalObjective' : 'GameEnd';
  const newTrigger = trigger === 'GameEnd' ? 'OptionalObjective' : 'GameEnd';
  const list = effects.get(trigger);
  if (!list) {
    return;
  }

  const partition = groupBy(list, ({ conditions }) =>
    hasEffectObjective(trigger, index, conditions) ? 'target' : 'origin',
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

export default function ObjectivePanel({
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
    (objective: Objective) => validateObjective(map, objective),
    [map],
  );

  const hasDefault = conditions.some(({ type }) => type === Criteria.Default);

  const updateWinCondition = (objective: Objective | null, index: number) => {
    const winConditions = [...conditions];
    const existingCondition = winConditions[index];
    if (!objective) {
      maybeRemoveEffect(
        editor.effects,
        existingCondition,
        index,
        setEditorState,
      );
      winConditions.splice(index, 1);
      if (!winConditions.length) {
        winConditions.push(getInitialObjective(map, Criteria.Default));
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

    if (validate(objective)) {
      maybeSwapEffect(
        editor.effects,
        objective,
        existingCondition,
        index,
        setEditorState,
      );

      winConditions[index] = objective;
      actions.update({
        map: map.copy({
          config: map.config.copy({
            winConditions,
          }),
        }),
      });
    }
  };

  if (editor?.objective) {
    return (
      <Stack gap={24} vertical verticalPadding>
        <Box>
          <InlineLink
            onClick={() => {
              setEditorState({
                objective: undefined,
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
        <ObjectiveCard
          canDelete={
            conditions.length > 1 || condition.type !== Criteria.Default
          }
          hasContentRestrictions={hasContentRestrictions}
          index={index}
          isAdmin={isAdmin}
          key={`${renders}-${index}`}
          map={mapWithActivePlayers}
          objective={condition}
          onChange={(condition) => updateWinCondition(condition, index)}
          selectEffect={() =>
            setEditorState(selectObjectiveEffect(editor, index, condition))
          }
          selectLocation={() => {
            if (objectiveHasVectors(condition)) {
              setEditorState({
                objective: [condition, index],
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
                        getInitialObjective(map, type),
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
