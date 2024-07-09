import getCampaignRoute from '@deities/apollo/routes/getCampaignRoute.tsx';
import { Skills } from '@deities/athena/info/Skill.tsx';
import MapData from '@deities/athena/MapData.tsx';
import {
  Criteria,
  MAX_AMOUNT,
  MAX_ROUNDS,
  MIN_AMOUNT,
  MIN_ROUNDS,
  Objective,
  objectiveHasAmounts,
  objectiveHasLabel,
  objectiveHasRounds,
  objectiveHasVectors,
} from '@deities/athena/Objectives.tsx';
import parseInteger from '@deities/hephaestus/parseInteger.tsx';
import sortBy from '@deities/hephaestus/sortBy.tsx';
import Box from '@deities/ui/Box.tsx';
import clipBorder from '@deities/ui/clipBorder.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import Form from '@deities/ui/Form.tsx';
import gradient from '@deities/ui/gradient.tsx';
import useAlert from '@deities/ui/hooks/useAlert.tsx';
import Icon from '@deities/ui/Icon.tsx';
import InlineLink from '@deities/ui/InlineLink.tsx';
import Stack from '@deities/ui/Stack.tsx';
import Tag from '@deities/ui/Tag.tsx';
import { css } from '@emotion/css';
import Close from '@iconify-icons/pixelarticons/close.js';
import { useCallback, useMemo, useState } from 'react';
import { UserWithFactionNameAndSkills } from '../../hooks/useUserMap.tsx';
import getCampaignTranslation from '../../i18n/getCampaignTranslation.tsx';
import intlList, { Conjunctions, Delimiters } from '../../i18n/intlList.tsx';
import ObjectiveTitle from '../../objectives/ObjectiveTitle.tsx';
import PlayerIcon from '../../ui/PlayerIcon.tsx';
import { SkillSelector } from '../../ui/SkillDialog.tsx';
import { ManyLabelSelector } from '../selectors/LabelSelector.tsx';
import UnitSelector from './UnitSelector.tsx';

export default function ObjectiveCard({
  campaigns,
  canDelete,
  hasContentRestrictions,
  id,
  isAdmin,
  map,
  objective,
  onChange,
  selectEffect,
  selectLocation,
  user,
  validate,
}: {
  campaigns: ReadonlyArray<{ name: string; slug: string }> | null;
  canDelete?: boolean;
  hasContentRestrictions: boolean;
  id: number;
  isAdmin?: boolean;
  map: MapData;
  objective: Objective;
  onChange: (objective: Objective | null) => void;
  selectEffect: () => void;
  selectLocation: () => void;
  user: UserWithFactionNameAndSkills;
  validate: (objective: Objective) => boolean;
}) {
  const [rounds, setRounds] = useState<number | null>(
    objectiveHasRounds(objective) ? objective.rounds : 0,
  );
  const [amount, setAmount] = useState<number | null>(
    objectiveHasAmounts(objective) ? objective.amount : 0,
  );
  const { alert } = useAlert();
  const campaignList = useMemo(
    () =>
      campaigns
        ? intlList(
            campaigns.map(({ name, slug }) => (
              <InlineLink key={slug} to={getCampaignRoute(slug, 'edit')}>
                {getCampaignTranslation(name)}
              </InlineLink>
            )),
            Conjunctions.AND,
            Delimiters.COMMA,
          )
        : null,
    [campaigns],
  );

  const onDelete = useCallback(() => {
    if (!canDelete) {
      return;
    }

    if (!campaigns?.length) {
      onChange(null);
      return;
    }

    alert({
      text: (
        <fbt desc="Explanation for why the objective cannot be deleted">
          This objective is associated with the
          <fbt:param name="campaigns">
            {intlList(
              campaigns.map(({ name }) => getCampaignTranslation(name)),
              Conjunctions.AND,
              Delimiters.COMMA,
            )}
          </fbt:param>
          <fbt:plural count={campaigns.length} many="campaigns">
            campaign
          </fbt:plural>. If you want to delete the objective, you must first
          change the campaign objectives to no longer require this objective.
        </fbt>
      ),
      title: (
        <fbt desc="Label explaining the objective is part of a campaign and cannot be deleted">
          Cannot Delete Objective
        </fbt>
      ),
    });
  }, [alert, campaigns, canDelete, onChange]);

  const isDefaultObjective = objective.type === Criteria.Default;
  const hasPlayers = !isDefaultObjective;
  const isOptional = !isDefaultObjective && objective.optional;
  const hasLabel = objectiveHasLabel(objective);
  const { reward } = objective;
  const selectedUnit = reward?.type === 'UnitPortraits' ? reward.unit : null;

  return (
    <Box
      className={boxStyle}
      gap={16}
      style={{
        backgroundImage:
          hasPlayers && objective.players?.length
            ? gradient(objective.players, 0.15)
            : undefined,
      }}
      vertical
    >
      {canDelete && (
        <Icon button className={deleteStyle} icon={Close} onClick={onDelete} />
      )}
      <h2>
        <ObjectiveTitle id={id} objective={objective} />
      </h2>
      <Form>
        <Stack gap={16} vertical>
          {hasPlayers && (
            <Stack alignCenter gap={16} nowrap>
              <Stack flex1>
                <fbt desc="Player selector for objective">Players</fbt>
              </Stack>
              {map.active.map((id) => (
                <PlayerIcon
                  id={id}
                  key={id}
                  onClick={() => {
                    const newObjective = {
                      ...objective,
                      players: objective.players?.includes(id)
                        ? objective.players.filter((player) => player !== id)
                        : sortBy(
                            [...(objective.players || []), id],
                            (id) => id,
                          ),
                    };
                    if (validate(newObjective)) {
                      onChange(newObjective);
                    }
                  }}
                  selected={objective.players?.includes(id)}
                />
              ))}
            </Stack>
          )}
          {hasLabel && (
            <Stack alignCenter nowrap>
              <Stack flex1>
                <fbt desc="Label selector for objective">Labels</fbt>
              </Stack>
              <ManyLabelSelector
                active={objective.label}
                onChange={(label) =>
                  onChange({
                    ...objective,
                    label,
                  })
                }
              />
            </Stack>
          )}
          {objectiveHasAmounts(objective) && (
            <label>
              <Stack alignCenter gap start>
                <span className={labelWidthStyle}>
                  <fbt desc="Label for objective amount">Amount</fbt>
                </span>
                <input
                  className={rounds == null ? 'invalid' : undefined}
                  max={MAX_AMOUNT}
                  min={MIN_AMOUNT}
                  onChange={({ target: { value } }) => {
                    const amount = parseInteger(value);
                    setAmount(amount);
                    if (amount) {
                      const newObjective = {
                        ...objective,
                        amount,
                      };
                      if (validate(newObjective)) {
                        onChange(newObjective);
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
          {objectiveHasRounds(objective) && (
            <label>
              <Stack alignCenter gap start>
                <span className={labelWidthStyle}>
                  <fbt desc="Label for objective rounds">Rounds</fbt>
                </span>
                <input
                  className={rounds == null ? 'invalid' : undefined}
                  max={MAX_ROUNDS}
                  min={MIN_ROUNDS}
                  onChange={({ target: { value } }) => {
                    const rounds = parseInteger(value);
                    setRounds(rounds);
                    if (rounds) {
                      const newObjective = {
                        ...objective,
                        rounds,
                      };
                      if (validate(newObjective)) {
                        onChange(newObjective);
                      } else {
                        setRounds(objective.rounds);
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
          <Stack gap>
            <label>
              <Stack gap start>
                <span className={labelWidthStyle}>
                  <fbt desc="Label for secret objective checkbox">Secret</fbt>
                </span>
                <input
                  checked={objective.hidden}
                  onChange={(event) =>
                    onChange({
                      ...objective,
                      hidden: event.target.checked,
                    })
                  }
                  type="checkbox"
                />
              </Stack>
            </label>
            {objective.hidden && hasLabel && (
              <p className={lightStyle}>
                <fbt desc="Description for secret objective labels">
                  Labels associated with this objective will be hidden from all
                  players.
                </fbt>
              </p>
            )}
          </Stack>
          {!isDefaultObjective && (
            <Stack gap>
              <label>
                <Stack gap start>
                  <span className={labelWidthStyle}>
                    <fbt desc="Label for optional objective checkbox">
                      Optional
                    </fbt>
                  </span>
                  <input
                    checked={isOptional}
                    onChange={(event) =>
                      onChange({
                        ...objective,
                        optional: event.target.checked,
                      })
                    }
                    type="checkbox"
                  />
                </Stack>
              </label>
              {isOptional && (
                <p className={lightStyle}>
                  <fbt desc="Description for optional objectives">
                    Achieving optional objectives does not end the game.
                  </fbt>
                </p>
              )}
            </Stack>
          )}
          {(isAdmin || isOptional) && (
            <Stack gap={16} vertical>
              <Stack alignCenter gap start>
                <span className={labelWidthStyle}>
                  <fbt desc="Label for objective reward">Reward</fbt>
                </span>
                <Stack alignCenter gap={16} start>
                  <SkillSelector
                    availableSkills={Skills}
                    currentSkill={
                      reward?.type === 'Skill' ? reward.skill : null
                    }
                    onSelect={(skill) =>
                      onChange({
                        ...objective,
                        reward: skill ? { skill, type: 'Skill' } : undefined,
                      })
                    }
                  />
                  {isAdmin && (
                    <UnitSelector
                      border
                      hasContentRestrictions={hasContentRestrictions}
                      highlight={!!selectedUnit}
                      isVisible
                      onSelect={(unit) =>
                        onChange({
                          ...objective,
                          reward: { type: 'UnitPortraits', unit },
                        })
                      }
                      selectedPlayer="self"
                      selectedUnit={selectedUnit}
                      user={user}
                      width="auto"
                    />
                  )}
                  {reward && (
                    <Icon
                      button
                      className={iconStyle}
                      icon={Close}
                      onClick={() =>
                        onChange({ ...objective, reward: undefined })
                      }
                    />
                  )}
                </Stack>
              </Stack>
              {reward && (
                <p className={noteBoxStyle}>
                  {objective.type === Criteria.Default ? (
                    <fbt desc="Explanation in the map editor of how rewards work for the default objective">
                      Players receive the reward for the default objective if
                      they win in any way.
                    </fbt>
                  ) : (
                    <fbt desc="Explanation in the map editor for how rewards work">
                      Players receive the reward if they achieve this objective.
                    </fbt>
                  )}{' '}
                  <fbt desc="Reward tags">
                    To permanently receive the reward, the map must have the
                    <fbt:param name="tag">
                      <Tag tag="reward" />
                    </fbt:param>{' '}
                    tag which can only be added by an Athena Crisis admin.
                  </fbt>
                </p>
              )}
            </Stack>
          )}
          <Stack reverse>
            <InlineLink onClick={selectEffect}>
              {
                <fbt desc="Button to define an effect for this objective">
                  Effect
                </fbt>
              }
            </InlineLink>
            {objectiveHasVectors(objective) && (
              <InlineLink onClick={selectLocation}>
                <fbt desc="Button to select objective location">
                  Select Location
                </fbt>
              </InlineLink>
            )}
          </Stack>
          {campaigns && campaigns?.length > 0 && (
            <Stack>
              <p>
                <fbt desc="Explanation for where the objective is used">
                  This objective is used in the{' '}
                  <fbt:param name="campaigns">{campaignList}</fbt:param>{' '}
                  <fbt:plural count={campaigns.length} many="campaigns">
                    campaign
                  </fbt:plural>.
                </fbt>
              </p>
            </Stack>
          )}
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

const labelWidthStyle = css`
  width: 100px;
`;

const lightStyle = css`
  opacity: 0.7;
`;

const iconStyle = css`
  cursor: pointer;
`;
