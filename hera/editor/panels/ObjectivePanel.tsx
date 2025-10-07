import { Effects } from '@deities/apollo/Effects.tsx';
import dropInactivePlayers from '@deities/athena/lib/dropInactivePlayers.tsx';
import getNextObjectiveId from '@deities/athena/lib/getNextObjectiveId.tsx';
import {
  Criteria,
  CriteriaList,
  CriteriaListWithoutDefault,
  getInitialObjective,
  Objective,
  objectiveHasVectors,
  ObjectiveID,
  validateObjective,
} from '@deities/athena/Objectives.tsx';
import levelUsesObjective from '@deities/hermes/levelUsesObjective.tsx';
import toLevelMap from '@deities/hermes/toLevelMap.tsx';
import { ClientLevelID } from '@deities/hermes/Types.tsx';
import Box from '@deities/ui/Box.tsx';
import InlineLink from '@deities/ui/InlineLink.tsx';
import Select from '@deities/ui/Select.tsx';
import { css } from '@emotion/css';
import filterNodes from '@nkzw/core/filterNodes.js';
import groupBy from '@nkzw/core/groupBy.js';
import sortBy from '@nkzw/core/sortBy.js';
import ImmutableMap from '@nkzw/immutable-map';
import { VStack } from '@nkzw/stack';
import { useCallback, useMemo } from 'react';
import { UserWithUnlocks } from '../../hooks/useUserMap.tsx';
import getCriteriaName from '../../lib/getCriteriaName.tsx';
import { StateWithActions } from '../../Types.tsx';
import hasEffectObjective from '../lib/hasEffectObjective.tsx';
import ObjectiveCard from '../lib/ObjectiveCard.tsx';
import selectObjectiveEffect from '../lib/selectObjectiveEffect.tsx';
import {
  CampaignEdge,
  EditorState,
  SetEditorStateFunction,
} from '../Types.tsx';

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
    return objective;
  }

  const trigger = existingObjective.optional ? 'OptionalObjective' : 'GameEnd';
  const newTrigger = trigger === 'GameEnd' ? 'OptionalObjective' : 'GameEnd';
  const list = effects.get(trigger);

  if (newTrigger === 'GameEnd' && objective.reward) {
    objective = { ...objective, reward: undefined };
  }

  if (!list) {
    return objective;
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
    newEffects.set(
      newTrigger,
      new Set([...(newEffects.get(newTrigger) || []), ...target]),
    );
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

  return objective;
};

export default function ObjectivePanel({
  actions,
  campaignEdges,
  canEditPerformance,
  editor,
  hasContentRestrictions,
  isAdmin,
  mapId,
  setEditorState,
  state,
  tags,
  user,
}: StateWithActions & {
  campaignEdges: CampaignEdge['edges'] | undefined;
  canEditPerformance: boolean;
  editor: EditorState;
  hasContentRestrictions: boolean;
  isAdmin?: boolean;
  mapId: string | undefined;
  setEditorState: SetEditorStateFunction;
  tags: ReadonlyArray<string>;
  user: UserWithUnlocks;
}) {
  const { map } = state;
  const { config } = map;
  const { objectives } = config;
  const mapWithActivePlayers = dropInactivePlayers(map);

  const validate = useCallback(
    (objective: Objective) => validateObjective(map, objective, 0),
    [map],
  );

  const objectivesInCampaigns = useMemo(
    () =>
      mapId
        ? campaignEdges
            ?.filter(filterNodes)
            .map((edge) => edge.node)
            .map(({ levels, name, slug }) => ({
              level: toLevelMap<ClientLevelID>(JSON.parse(levels || '')).get(
                mapId,
              ),
              name,
              slug,
            }))
        : null,
    [campaignEdges, mapId],
  );

  const updateObjective = useCallback(
    (id: ObjectiveID, objective: Objective | null) => {
      const existingObjective = objectives.get(id);
      if (!existingObjective) {
        return;
      }

      if (!objective) {
        maybeRemoveEffect(
          editor.effects,
          existingObjective,
          id,
          setEditorState,
        );
        actions.update({
          map: map.copy({
            config: map.config.copy({
              objectives:
                objectives.size === 1
                  ? ImmutableMap([
                      [0, getInitialObjective(map, Criteria.Default)],
                    ])
                  : objectives.delete(id),
            }),
          }),
        });
        return;
      }

      if (validate(objective)) {
        objective = maybeSwapEffect(
          editor.effects,
          objective,
          existingObjective,
          id,
          setEditorState,
        );

        actions.update({
          map: map.copy({
            config: map.config.copy({
              objectives: objectives.set(id, objective),
            }),
          }),
        });
      }
    },
    [actions, editor.effects, map, objectives, setEditorState, validate],
  );

  if (editor?.objective) {
    return (
      <VStack between gap={24} verticalPadding wrap>
        <Box between wrap>
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
      </VStack>
    );
  }

  return (
    <VStack between className={paddingStyle} gap={24} wrap>
      {sortBy([...objectives], ([id]) => id).map(([id, objective]) => (
        <ObjectiveCard
          campaigns={
            objectivesInCampaigns?.filter(
              ({ level }) => level && levelUsesObjective(id, level),
            ) || null
          }
          canDelete={objectives.size > 1 || objective.type !== Criteria.Default}
          canEditPerformance={canEditPerformance}
          hasContentRestrictions={hasContentRestrictions}
          id={id}
          isAdmin={isAdmin}
          key={id}
          map={mapWithActivePlayers}
          objective={objective}
          onChange={(objective) => updateObjective(id, objective)}
          selectEffect={() =>
            setEditorState(selectObjectiveEffect(editor, id, objective))
          }
          selectLocation={() => {
            if (objectiveHasVectors(objective)) {
              setEditorState({
                objective: { objective, objectiveId: id },
              });
            }
          }}
          tags={tags}
          user={user}
          validate={validate}
        />
      ))}
      <Select
        selectedItem={
          <fbt desc="Headline for adding a new objective">New Objective</fbt>
        }
      >
        <VStack between gap={4} wrap>
          {(objectives.some(({ type }) => type === Criteria.Default)
            ? CriteriaListWithoutDefault
            : CriteriaList
          ).map((type, index) => (
            <InlineLink
              className={linkStyle}
              key={index}
              onClick={() =>
                actions.update({
                  map: map.copy({
                    config: map.config.copy({
                      objectives: objectives
                        .set(
                          getNextObjectiveId(objectives),
                          getInitialObjective(map, type),
                        )
                        .sortBy((_, id) => id),
                    }),
                  }),
                })
              }
            >
              {getCriteriaName(type)}
            </InlineLink>
          ))}
        </VStack>
      </Select>
    </VStack>
  );
}

const linkStyle = css`
  padding: 8px;
`;

const paddingStyle = css`
  padding: 24px 0 520px;
`;
