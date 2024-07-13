import { Action } from '@deities/apollo/Action.tsx';
import { Effect, Scenario } from '@deities/apollo/Effects.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { Criteria } from '@deities/athena/Objectives.tsx';
import isPresent from '@deities/hephaestus/isPresent.tsx';
import UnknownTypeError from '@deities/hephaestus/UnknownTypeError.tsx';
import Box from '@deities/ui/Box.tsx';
import Button from '@deities/ui/Button.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import ellipsis from '@deities/ui/ellipsis.tsx';
import ErrorText from '@deities/ui/ErrorText.tsx';
import Icon from '@deities/ui/Icon.tsx';
import ZapOn from '@deities/ui/icons/ZapOn.tsx';
import InlineLink from '@deities/ui/InlineLink.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { css, cx } from '@emotion/css';
import Plus from '@iconify-icons/pixelarticons/plus.js';
import ImmutableMap from '@nkzw/immutable-map';
import { RefObject, useCallback, useMemo, useState } from 'react';
import { DrawerPosition } from '../../drawer/Drawer.tsx';
import { UserWithFactionNameAndSkills } from '../../hooks/useUserMap.tsx';
import ActionCard from '../lib/ActionCard.tsx';
import EffectTitle, { EffectObjectiveTitle } from '../lib/EffectTitle.tsx';
import selectObjectiveEffect from '../lib/selectObjectiveEffect.tsx';
import EffectSelector from '../selectors/EffectSelector.tsx';
import {
  EditorState,
  SetEditorStateFunction,
  SetMapFunction,
} from '../Types.tsx';

export type ActionChangeFn = (
  index: number,
  type: 'update' | 'up' | 'down' | 'delete' | 'toggle-select-units',
  action?: Action,
) => void;

export default function EffectsPanel({
  editor,
  hasContentRestrictions,
  map,
  position,
  scenario,
  scrollRef,
  setEditorState,
  setMap,
  setScenario,
  updateEffect,
  user,
}: {
  editor: EditorState;
  hasContentRestrictions: boolean;
  map: MapData;
  position: DrawerPosition;
  scenario: Scenario;
  scrollRef: RefObject<HTMLElement>;
  setEditorState: SetEditorStateFunction;
  setMap: SetMapFunction;
  setScenario: (scenario: Scenario) => void;
  updateEffect: (effect: Effect) => void;
  user: UserWithFactionNameAndSkills;
}) {
  const { action: currentAction, effects } = editor;
  const { effect, trigger } = scenario;
  const { actions } = effect;
  const [showNewEffects, setShowNewEffects] = useState(false);
  const {
    config: { biome, objectives },
  } = map;

  const conditionsByID = useMemo(() => {
    const effectList = new Set([
      ...(effects.get('GameEnd') || []),
      ...(effects.get('OptionalObjective') || []),
    ]);
    return new Set(
      [...effectList].flatMap(
        ({ conditions }) =>
          conditions
            ?.map((condition) =>
              condition.type === 'GameEnd' ||
              condition.type === 'OptionalObjective'
                ? condition.value
                : null,
            )
            .filter(isPresent),
      ),
    );
  }, [effects]);

  const possibleEffects = useMemo(
    () =>
      [
        ...(['win', 'lose', 'draw'] as const).map((id) =>
          conditionsByID?.has(id) ? null : (
            <InlineLink
              className={fitContentStyle}
              key={id}
              onClick={() => {
                setShowNewEffects(false);
                setEditorState(selectObjectiveEffect(editor, id));
              }}
            >
              <EffectObjectiveTitle id={id} />
            </InlineLink>
          ),
        ),
        ...objectives
          .map((condition, id) => {
            if (
              condition.type === Criteria.Default ||
              conditionsByID?.has(id)
            ) {
              return null;
            }

            const type = condition.optional ? 'OptionalObjective' : 'GameEnd';
            return (
              <InlineLink
                className={fitContentStyle}
                key={id}
                onClick={() => {
                  setShowNewEffects(false);
                  setEditorState(selectObjectiveEffect(editor, id, condition));
                }}
              >
                <EffectTitle
                  effect={{
                    actions: [],
                    conditions: [
                      {
                        type,
                        value: id,
                      },
                    ],
                  }}
                  objectives={objectives}
                  trigger={type}
                />
              </InlineLink>
            );
          })
          .values(),
      ].filter(isPresent),
    [conditionsByID, editor, setEditorState, objectives],
  );

  const onChange: ActionChangeFn = useCallback(
    (index, changeType, action?) => {
      switch (changeType) {
        case 'update':
          if (action) {
            updateEffect({
              ...effect,
              actions: actions.map((_action, i) =>
                i === index ? action : _action,
              ),
            });
          }
          break;
        case 'up':
          if (index > 0 && actions[index - 1]) {
            const newActions = [...actions];
            newActions[index] = actions[index - 1];
            newActions[index - 1] = actions[index];
            updateEffect({
              ...effect,
              actions: newActions,
            });
          }
          break;
        case 'down':
          if (index < actions.length - 1 && actions[index + 1]) {
            const newActions = [...actions];
            newActions[index] = actions[index + 1];
            newActions[index + 1] = actions[index];
            updateEffect({
              ...effect,
              actions: newActions,
            });
          }
          break;
        case 'delete':
          updateEffect({
            ...effect,
            actions: actions.filter((_action, i) => i !== index),
          });
          break;
        case 'toggle-select-units':
          setEditorState({
            action:
              editor.action?.actionId === index
                ? undefined
                : { action: actions[index], actionId: index },
          });
          break;
        default: {
          changeType satisfies never;
          throw new UnknownTypeError('EffectsPanel.onChange', changeType);
        }
      }
    },
    [actions, editor.action?.actionId, effect, setEditorState, updateEffect],
  );

  if (showNewEffects) {
    return (
      <Stack gap={24} vertical verticalPadding>
        <Box gap vertical>
          {possibleEffects.length ? (
            <>
              <h2 className={flexStyle}>
                <fbt desc="Headline for choosing a new effect">
                  Choose a new Effect
                </fbt>
              </h2>
              <Stack gap vertical>
                {possibleEffects}
              </Stack>
            </>
          ) : (
            <ErrorText>
              <fbt desc="Error message for no available effects">
                There are currently no effects available.
              </fbt>
            </ErrorText>
          )}
        </Box>
        <Stack start>
          <Button onClick={() => setShowNewEffects(false)}>
            <fbt desc="Button to navigate back">Back</fbt>
          </Button>
        </Stack>
      </Stack>
    );
  }

  if (currentAction) {
    return (
      <Stack gap={24} vertical verticalPadding>
        <ActionCard
          action={currentAction.action}
          biome={biome}
          focused
          hasContentRestrictions={hasContentRestrictions}
          index={currentAction.actionId}
          map={map}
          onChange={onChange}
          position={position}
          scrollRef={scrollRef}
          setMap={setMap}
          trigger={trigger}
          user={user}
        />
      </Stack>
    );
  }

  return (
    <Stack gap={24} vertical verticalPadding>
      <Stack gap={16} vertical>
        <Stack alignCenter gap={16} nowrap>
          <EffectSelector
            effects={effects}
            objectives={objectives}
            scenario={scenario}
            setScenario={(scenario) => setScenario(scenario)}
          />
          <Button
            className={cx(ellipsis, fitContentStyle, flexStyle)}
            onClick={() => setShowNewEffects(true)}
          >
            <Icon icon={ZapOn} />
            <fbt desc="Button for choosing a new effect">New Effect</fbt>
          </Button>
        </Stack>
        {actions.map((action, index) => (
          <div className={actionStyle} key={`${index}-${action.type}`}>
            <ActionCard
              action={action}
              biome={biome}
              first={index === 0}
              hasContentRestrictions={hasContentRestrictions}
              index={index}
              last={index === actions.length - 1}
              map={map}
              onChange={onChange}
              position={position}
              scrollRef={scrollRef}
              setMap={setMap}
              trigger={trigger}
              user={user}
            />
            {index === actions.length - 1 ? null : (
              <Icon
                button
                className={iconStyle}
                icon={Plus}
                onClick={() => {
                  const newActions = [...actions];
                  newActions.splice(index + 1, 0, {
                    message: '',
                    player: 'self',
                    type: 'CharacterMessageEffect',
                    unitId: 1,
                  });
                  updateEffect({
                    ...effect,
                    actions: newActions,
                  });
                }}
              />
            )}
          </div>
        ))}

        <Stack gap={16} start>
          <Button
            onClick={() =>
              updateEffect({
                ...effect,
                actions: [
                  ...actions,
                  {
                    message: '',
                    player: 'self',
                    type: 'CharacterMessageEffect',
                    unitId: 1,
                  },
                ],
              })
            }
          >
            <fbt desc="Button to add a new character message in the map editor">
              Add Message
            </fbt>
          </Button>
          {trigger !== 'GameEnd' ? (
            <Button
              onClick={() =>
                updateEffect({
                  ...effect,
                  actions: [
                    ...actions,
                    {
                      type: 'SpawnEffect',
                      units: ImmutableMap(),
                    },
                  ],
                })
              }
            >
              <fbt desc="Button to add a new spawn effect in the map editor">
                Add Spawn Effect
              </fbt>
            </Button>
          ) : null}
        </Stack>
      </Stack>
    </Stack>
  );
}

const actionStyle = css`
  position: relative;
`;

const iconStyle = css`
  position: absolute;
  right: -13.5px;
  bottom: -18.5px;
  color: ${applyVar('text-color-light')};
  z-index: 2;
`;

const fitContentStyle = css`
  width: fit-content;
`;

const flexStyle = css`
  display: inline-flex;
  gap: 4px;
`;
