import dropInactivePlayers from '@deities/athena/lib/dropInactivePlayers.tsx';
import type { WinCondition } from '@deities/athena/WinConditions.tsx';
import {
  getInitialWinCondition,
  validateWinCondition,
  winConditionHasVectors,
  WinCriteria,
  WinCriteriaList,
} from '@deities/athena/WinConditions.tsx';
import Box from '@deities/ui/Box.tsx';
import InlineLink from '@deities/ui/InlineLink.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { css } from '@emotion/css';
import { useCallback, useState } from 'react';
import getWinCriteriaName from '../../lib/getWinCriteriaName.tsx';
import type { StateWithActions } from '../../Types.tsx';
import hasGameEndCondition from '../lib/hasGameEndCondition.tsx';
import selectWinConditionEffect from '../lib/selectWinConditionEffect.tsx';
import WinConditionCard from '../lib/WinConditionCard.tsx';
import type { EditorState, SetEditorStateFunction } from '../Types.tsx';

export default function WinConditionPanel({
  actions,
  editor,
  setEditorState,
  state,
}: StateWithActions & {
  editor: EditorState;
  setEditorState: SetEditorStateFunction;
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

  const hasDefault = conditions.some(
    ({ type }) => type === WinCriteria.Default,
  );

  const updateWinCondition = (
    condition: WinCondition | null,
    index: number,
  ) => {
    const winConditions = [...conditions];
    if (!condition) {
      const existingCondition = winConditions[index];
      if (existingCondition.type !== WinCriteria.Default) {
        const list = editor.effects.get('GameEnd');
        const newList = list
          ? new Set(
              [...list].filter(
                ({ conditions }) => !hasGameEndCondition(index, conditions),
              ),
            )
          : null;

        if (newList) {
          const effects = new Map(editor.effects);
          effects.set('GameEnd', newList);
          setEditorState({
            effects,
          });
        }
      }
      winConditions.splice(index, 1);
      if (!winConditions.length) {
        winConditions.push(getInitialWinCondition(map, WinCriteria.Default));
      }
      // Increment this counter to force re-rendering all list items which resets their state.
      setRenders((renders) => renders + 1);
      return actions.update({
        map: map.copy({
          config: map.config.copy({
            winConditions,
          }),
        }),
      });
    }

    if (validate(condition)) {
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
            conditions.length > 1 || condition.type !== WinCriteria.Default
          }
          condition={condition}
          index={index}
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
          validate={validate}
        />
      ))}
      <Box gap={16} vertical>
        <h2>
          <fbt desc="Headline for adding new win conditions">
            Add new win condition
          </fbt>
        </h2>
        <Stack gap vertical>
          {WinCriteriaList.filter(
            (type) => type !== WinCriteria.Default || !hasDefault,
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
              {getWinCriteriaName(type)}
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
