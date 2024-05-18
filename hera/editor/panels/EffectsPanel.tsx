import type { Action } from '@deities/apollo/Action.tsx';
import type { Effect, Scenario } from '@deities/apollo/Effects.tsx';
import type MapData from '@deities/athena/MapData.tsx';
import { WinCriteria } from '@deities/athena/WinConditions.tsx';
import isPresent from '@deities/hephaestus/isPresent.tsx';
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
import type { RefObject } from 'react';
import { useCallback, useMemo, useState } from 'react';
import type { UserWithFactionNameAndSkills } from '../../hooks/useUserMap.tsx';
import ActionCard from '../lib/ActionCard.tsx';
import EffectTitle, { EffectWinConditionTitle } from '../lib/EffectTitle.tsx';
import selectWinConditionEffect from '../lib/selectWinConditionEffect.tsx';
import EffectSelector from '../selectors/EffectSelector.tsx';
import type { EditorState, SetEditorStateFunction } from '../Types.tsx';

export default function EffectsPanel({
  editor,
  hasContentRestrictions,
  map,
  scenario,
  scrollRef,
  setEditorState,
  setScenario,
  updateEffect,
  user,
}: {
  editor: EditorState;
  hasContentRestrictions: boolean;
  map: MapData;
  scenario: Scenario;
  scrollRef: RefObject<HTMLElement>;
  setEditorState: SetEditorStateFunction;
  setScenario: (scenario: Scenario) => void;
  updateEffect: (effect: Effect) => void;
  user: UserWithFactionNameAndSkills;
}) {
  const { effects } = editor;
  const { effect } = scenario;
  const { actions } = effect;
  const [showNewEffects, setShowNewEffects] = useState(false);
  const {
    config: { biome, winConditions },
  } = map;

  const effectList = effects.get('GameEnd');
  const conditionsByID = useMemo(
    () =>
      effectList
        ? new Set(
            [...effectList].flatMap(
              ({ conditions }) =>
                conditions
                  ?.map((condition) =>
                    condition.type === 'GameEnd' ? condition.value : null,
                  )
                  .filter(isPresent),
            ),
          )
        : null,
    [effectList],
  );

  const possibleEffects = useMemo(
    () =>
      [
        (['win', 'lose', 'draw'] as const).map((id) =>
          conditionsByID?.has(id) ? null : (
            <InlineLink
              className={fitContentStyle}
              key={id}
              onClick={() => {
                setShowNewEffects(false);
                setEditorState(selectWinConditionEffect(editor, id));
              }}
            >
              <EffectWinConditionTitle id={id} />
            </InlineLink>
          ),
        ),
        winConditions.map((condition, index) =>
          condition.type === WinCriteria.Default ||
          conditionsByID?.has(index) ? null : (
            <InlineLink
              className={fitContentStyle}
              key={index}
              onClick={() => {
                setShowNewEffects(false);
                setEditorState(
                  selectWinConditionEffect(editor, index, condition),
                );
              }}
            >
              <EffectTitle
                effect={{
                  actions: [],
                  conditions: [
                    {
                      type: 'GameEnd',
                      value: index,
                    },
                  ],
                }}
                trigger="GameEnd"
                winConditions={winConditions}
              />
            </InlineLink>
          ),
        ),
      ]
        .flat()
        .filter(isPresent),
    [conditionsByID, editor, setEditorState, winConditions],
  );

  const onChange = useCallback(
    (index: number, type: string, action?: Action) => {
      switch (type) {
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
      }
    },
    [actions, effect, updateEffect],
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

  return (
    <Stack gap={24} vertical verticalPadding>
      <Stack gap={16} vertical>
        <Stack alignCenter gap={16} nowrap>
          <EffectSelector
            effects={effects}
            scenario={scenario}
            setScenario={(scenario) => setScenario(scenario)}
            winConditions={winConditions}
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
          <div className={actionStyle} key={index}>
            <ActionCard
              action={action}
              biome={biome}
              first={index === 0}
              hasContentRestrictions={hasContentRestrictions}
              index={index}
              last={index === actions.length - 1}
              onChange={onChange}
              scrollRef={scrollRef}
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

        <Stack>
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
