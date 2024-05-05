import { Skills } from '@deities/athena/info/Skill.tsx';
import MapData from '@deities/athena/MapData.tsx';
import {
  MAX_AMOUNT,
  MAX_ROUNDS,
  MIN_AMOUNT,
  MIN_ROUNDS,
  WinCondition,
  winConditionHasAmounts,
  winConditionHasLabel,
  winConditionHasRounds,
  winConditionHasVectors,
  WinCriteria,
} from '@deities/athena/WinConditions.tsx';
import parseInteger from '@deities/hephaestus/parseInteger.tsx';
import sortBy from '@deities/hephaestus/sortBy.tsx';
import Box from '@deities/ui/Box.tsx';
import clipBorder from '@deities/ui/clipBorder.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import Form from '@deities/ui/Form.tsx';
import gradient from '@deities/ui/gradient.tsx';
import Icon from '@deities/ui/Icon.tsx';
import InlineLink from '@deities/ui/InlineLink.tsx';
import Stack from '@deities/ui/Stack.tsx';
import Tag from '@deities/ui/Tag.tsx';
import { css } from '@emotion/css';
import Close from '@iconify-icons/pixelarticons/close.js';
import { useState } from 'react';
import PlayerIcon from '../../ui/PlayerIcon.tsx';
import { SkillSelector } from '../../ui/SkillDialog.tsx';
import WinConditionTitle from '../../win-conditions/WinConditionTitle.tsx';
import { ManyLabelSelector } from '../selectors/LabelSelector.tsx';

export default function WinConditionCard({
  canDelete,
  condition,
  index,
  map,
  onChange,
  selectEffect,
  selectLocation,
  validate,
}: {
  canDelete?: boolean;
  condition: WinCondition;
  index: number;
  map: MapData;
  onChange: (condition: WinCondition | null) => void;
  selectEffect: () => void;
  selectLocation: () => void;
  validate: (condition: WinCondition) => boolean;
}) {
  const [rounds, setRounds] = useState<number | null>(
    winConditionHasRounds(condition) ? condition.rounds : 0,
  );
  const [amount, setAmount] = useState<number | null>(
    winConditionHasAmounts(condition) ? condition.amount : 0,
  );
  const hasPlayers = condition.type !== WinCriteria.Default;
  const hasLabel = winConditionHasLabel(condition);

  return (
    <Box
      className={boxStyle}
      gap={16}
      style={{
        backgroundImage:
          hasPlayers && condition.players?.length
            ? gradient(condition.players, 0.15)
            : undefined,
      }}
      vertical
    >
      {canDelete && (
        <Icon
          button
          className={deleteStyle}
          icon={Close}
          onClick={() => onChange(null)}
        />
      )}
      <h2>
        <WinConditionTitle condition={condition} index={index} />
      </h2>
      <Form>
        <Stack gap={16} vertical>
          {hasPlayers && (
            <Stack alignCenter gap={16} nowrap>
              <Stack flex1>
                <fbt desc="Player selector for win condition">Players</fbt>
              </Stack>
              {map.active.map((id) => (
                <PlayerIcon
                  id={id}
                  key={id}
                  onClick={() => {
                    const newCondition = {
                      ...condition,
                      players: condition.players?.includes(id)
                        ? condition.players.filter((player) => player !== id)
                        : sortBy(
                            [...(condition.players || []), id],
                            (id) => id,
                          ),
                    };
                    if (validate(newCondition)) {
                      onChange(newCondition);
                    }
                  }}
                  selected={condition.players?.includes(id)}
                />
              ))}
            </Stack>
          )}
          {hasLabel && (
            <Stack alignCenter nowrap>
              <Stack flex1>
                <fbt desc="Label selector for win condition">Labels</fbt>
              </Stack>
              <ManyLabelSelector
                active={condition.label}
                onChange={(label) =>
                  onChange({
                    ...condition,
                    label,
                  })
                }
              />
            </Stack>
          )}
          {winConditionHasAmounts(condition) && (
            <label>
              <Stack alignCenter gap start>
                <span className="input-label">
                  <fbt desc="Label for win condition amount">Amount</fbt>
                </span>
                <input
                  className={rounds == null ? 'invalid' : undefined}
                  max={MAX_AMOUNT}
                  min={MIN_AMOUNT}
                  onChange={({ target: { value } }) => {
                    const amount = parseInteger(value);
                    setAmount(amount);
                    if (amount) {
                      const newCondition = {
                        ...condition,
                        amount,
                      };
                      if (validate(newCondition)) {
                        onChange(newCondition);
                      }
                    }
                  }}
                  required
                  style={{ width: 100 }}
                  type="number"
                  value={amount ?? ''}
                />
              </Stack>
            </label>
          )}
          {winConditionHasRounds(condition) && (
            <label>
              <Stack alignCenter gap start>
                <span className="input-label">
                  <fbt desc="Label for win condition rounds">Rounds</fbt>
                </span>
                <input
                  className={rounds == null ? 'invalid' : undefined}
                  max={MAX_ROUNDS}
                  min={MIN_ROUNDS}
                  onChange={({ target: { value } }) => {
                    const rounds = parseInteger(value);
                    setRounds(rounds);
                    if (rounds) {
                      const newCondition = {
                        ...condition,
                        rounds,
                      };
                      if (validate(newCondition)) {
                        onChange(newCondition);
                      } else {
                        setRounds(condition.rounds);
                      }
                    }
                  }}
                  required
                  style={{ width: 100 }}
                  type="number"
                  value={rounds ?? ''}
                />
              </Stack>
            </label>
          )}
          <label>
            <Stack gap start>
              <span className="input-label">
                <fbt desc="Label for secret win condition checkbox">Secret</fbt>
              </span>
              <input
                checked={condition.hidden}
                onChange={(event) =>
                  onChange({
                    ...condition,
                    hidden: event.target.checked,
                  })
                }
                type="checkbox"
              />
            </Stack>
          </label>
          {condition.hidden && hasLabel && (
            <p>
              <fbt desc="Description for secret win condition labels">
                Labels associated with this win condition will be hidden from
                all players.
              </fbt>
            </p>
          )}
          <Stack gap start verticalPadding>
            <fbt desc="Label for win condition reward">Reward</fbt>
            <SkillSelector
              availableSkills={Skills}
              currentSkill={condition.reward?.skill}
              note={
                <Stack gap>
                  <h2>Note</h2>
                  <p className={noteBoxStyle}>
                    {condition.type === WinCriteria.Default ? (
                      <fbt desc="Explanation in the map editor of how rewards work for the default win condition">
                        Players receive a reward for the default win condition
                        if they win in any way.
                      </fbt>
                    ) : (
                      <fbt desc="Explanation in the map editor for how rewards work">
                        Players receive a reward if they win the map through
                        this win condition.
                      </fbt>
                    )}{' '}
                    <fbt desc="Reward tags">
                      The map must have the
                      <fbt:param name="tag">
                        <Tag tag="reward" />
                      </fbt:param>{' '}
                      tag applied which can only be added by an Athena Crisis
                      admin.
                    </fbt>
                  </p>
                </Stack>
              }
              onSelect={(skill) =>
                onChange({
                  ...condition,
                  reward: skill ? { skill, type: 'skill' } : undefined,
                })
              }
            />
          </Stack>
          <Stack reverse>
            <InlineLink onClick={selectEffect}>
              {
                <fbt desc="Button to define an effect for this win condition">
                  Effect
                </fbt>
              }
            </InlineLink>
            {winConditionHasVectors(condition) && (
              <InlineLink onClick={selectLocation}>
                {
                  <fbt desc="Button to select win condition location">
                    Select Location
                  </fbt>
                }
              </InlineLink>
            )}
          </Stack>
        </Stack>
      </Form>
    </Box>
  );
}

const boxStyle = css`
  position: relative;
`;

const deleteStyle = css`
  position: absolute;
  right: 4px;
  top: 4px;
`;

const noteBoxStyle = css`
  ${clipBorder()}
  padding: 12px;
  background: ${applyVar('background-color')};
`;
