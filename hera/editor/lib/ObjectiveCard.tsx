import getCampaignRoute from '@deities/apollo/routes/getCampaignRoute.tsx';
import { Skills } from '@deities/athena/info/Skill.tsx';
import { Crystals } from '@deities/athena/invasions/Crystal.tsx';
import UnlockableBiomes from '@deities/athena/lib/UnlockableBiomes.tsx';
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
import { applyVar } from '@deities/ui/cssVar.tsx';
import Dropdown from '@deities/ui/Dropdown.tsx';
import Form from '@deities/ui/Form.tsx';
import NumberInput from '@deities/ui/form/NumberInput.tsx';
import gradient from '@deities/ui/gradient.tsx';
import useAlert from '@deities/ui/hooks/useAlert.tsx';
import Icon from '@deities/ui/Icon.tsx';
import InfoBox from '@deities/ui/InfoBox.tsx';
import InlineLink from '@deities/ui/InlineLink.tsx';
import pixelBorder from '@deities/ui/pixelBorder.tsx';
import Stack from '@deities/ui/Stack.tsx';
import Tag from '@deities/ui/Tag.tsx';
import { css, cx } from '@emotion/css';
import Close from '@iconify-icons/pixelarticons/close.js';
import { useCallback, useState } from 'react';
import { UserWithUnlocks } from '../../hooks/useUserMap.tsx';
import getCampaignTranslation from '../../i18n/getCampaignTranslation.tsx';
import getTranslatedCrystalName from '../../invasions/getTranslatedCrystalName.tsx';
import getTranslatedBiomeName from '../../lib/getTranslatedBiomeName.tsx';
import ObjectiveTitle from '../../objectives/ObjectiveTitle.tsx';
import CrystalIcon from '../../ui/CrystalIcon.tsx';
import PlayerIcon from '../../ui/PlayerIcon.tsx';
import { SkillSelector } from '../../ui/SkillDialog.tsx';
import { ManyLabelSelector } from '../selectors/LabelSelector.tsx';
import UnitSelector from './UnitSelector.tsx';

export default function ObjectiveCard({
  campaigns,
  canDelete,
  canEditPerformance,
  hasContentRestrictions,
  id,
  isAdmin,
  map,
  objective,
  onChange,
  selectEffect,
  selectLocation,
  tags,
  user,
  validate,
}: {
  campaigns: ReadonlyArray<{ name: string; slug: string }> | null;
  canDelete?: boolean;
  canEditPerformance: boolean;
  hasContentRestrictions: boolean;
  id: number;
  isAdmin?: boolean;
  map: MapData;
  objective: Objective;
  onChange: (objective: Objective | null) => void;
  selectEffect: () => void;
  selectLocation: () => void;
  tags: ReadonlyArray<string>;
  user: UserWithUnlocks;
  validate: (objective: Objective) => boolean;
}) {
  const [rounds, setRounds] = useState<number | null>(
    objectiveHasRounds(objective) ? objective.rounds : 0,
  );
  const [amount, setAmount] = useState<number | null>(
    objectiveHasAmounts(objective) ? objective.amount : 0,
  );
  const { alert } = useAlert();
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
          <fbt:list
            items={campaigns.map(({ name }) => getCampaignTranslation(name))}
            name="campaigns"
          />
          <fbt:plural count={campaigns.length} many="campaigns">
            campaign
          </fbt:plural>.
          If you want to delete the objective, you must first change the
          campaign objectives to no longer require this objective.
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
              <Stack start>
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
            </Stack>
          )}
          {objectiveHasAmounts(objective) && (
            <label>
              <Stack alignCenter gap start>
                <span className={labelWidthStyle}>
                  <fbt desc="Label for objective amount">Amount</fbt>
                </span>
                <NumberInput
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
                <NumberInput
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
                  value={rounds ?? ''}
                />
              </Stack>
            </label>
          )}
          <Stack className={lineHeightStyle} gap={16} nowrap>
            <label className={labelStyle}>
              <Stack alignCenter gap nowrap start>
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
            {objective.hidden && hasLabel && objective.label?.size ? (
              <p className={lightStyle}>
                <fbt desc="Description for secret objective labels">
                  Labels for this objective are hidden from players unless they
                  are used by a non-secret objective.
                </fbt>
              </p>
            ) : null}
          </Stack>
          {!isDefaultObjective && (
            <>
              <Stack className={lineHeightStyle} gap={16} nowrap>
                <label className={labelStyle}>
                  <Stack alignCenter gap nowrap start>
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
                          bonus: event.target.checked
                            ? objective.bonus
                            : undefined,
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
              {canEditPerformance && isOptional && (
                <Stack alignCenter className={lineHeightStyle} gap>
                  <label>
                    <Stack alignCenter gap start>
                      <span className={labelWidthStyle}>
                        <fbt desc="Label for enabling this objective to reward a bonus star">
                          Bonus
                        </fbt>
                      </span>
                      <input
                        checked={objective.bonus === 1}
                        onChange={(event) =>
                          onChange({
                            ...objective,
                            bonus: event.target.checked ? 1 : undefined,
                          })
                        }
                        type="checkbox"
                      />
                    </Stack>
                  </label>
                </Stack>
              )}
            </>
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
                    <>
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
                      <Dropdown
                        title={
                          reward?.type === 'Biome' ? (
                            <div className={cx(borderStyle, highlightStyle)}>
                              {getTranslatedBiomeName(reward.biome)}
                            </div>
                          ) : (
                            <div className={borderStyle}>
                              <fbt desc="Label to select a biome">Biome</fbt>
                            </div>
                          )
                        }
                      >
                        <Stack className={selectorStyle} gap vertical>
                          {[...UnlockableBiomes].map((biome) => (
                            <InlineLink
                              className={linkStyle}
                              key={biome}
                              onClick={() =>
                                onChange({
                                  ...objective,
                                  reward: { biome, type: 'Biome' },
                                })
                              }
                              selectedText={
                                reward?.type === 'Biome' &&
                                reward.biome === biome
                              }
                            >
                              {getTranslatedBiomeName(biome)}
                            </InlineLink>
                          ))}
                        </Stack>
                      </Dropdown>
                      <Dropdown
                        title={
                          reward?.type === 'Keyart' ? (
                            <div className={cx(borderStyle, highlightStyle)}>
                              <fbt desc="Keyart unlock">
                                Variant{' '}
                                <fbt:param name="variant">
                                  {reward.variant}
                                </fbt:param>
                              </fbt>
                            </div>
                          ) : (
                            <div className={borderStyle}>
                              <fbt desc="Label to select a keyart">Keyart</fbt>
                            </div>
                          )
                        }
                      >
                        <Stack className={selectorStyle} gap vertical>
                          {([1, 2] as const).map((variant) => (
                            <InlineLink
                              className={linkStyle}
                              key={variant}
                              onClick={() =>
                                onChange({
                                  ...objective,
                                  reward: { type: 'Keyart', variant },
                                })
                              }
                              selectedText={
                                reward?.type === 'Keyart' &&
                                reward.variant === variant
                              }
                            >
                              <fbt desc="Keyart unlock">
                                Variant{' '}
                                <fbt:param name="variant">{variant}</fbt:param>
                              </fbt>
                            </InlineLink>
                          ))}
                        </Stack>
                      </Dropdown>
                      <Dropdown
                        title={
                          reward?.type === 'SkillSlot' ? (
                            <div className={cx(borderStyle, highlightStyle)}>
                              <fbt desc="SkillSlot unlock">
                                Skill Slot{' '}
                                <fbt:param name="slot">{reward.slot}</fbt:param>
                              </fbt>
                            </div>
                          ) : (
                            <div className={borderStyle}>
                              <fbt desc="Label to select a skillslot">
                                Skill Slot
                              </fbt>
                            </div>
                          )
                        }
                      >
                        <Stack className={selectorStyle} gap vertical>
                          {([2, 3, 4] as const).map((slot) => (
                            <InlineLink
                              className={linkStyle}
                              key={slot}
                              onClick={() =>
                                onChange({
                                  ...objective,
                                  reward: { slot, type: 'SkillSlot' },
                                })
                              }
                              selectedText={
                                reward?.type === 'SkillSlot' &&
                                reward.slot === slot
                              }
                            >
                              <fbt desc="SkillSlot unlock">
                                Skill Slot{' '}
                                <fbt:param name="slot">{slot}</fbt:param>
                              </fbt>
                            </InlineLink>
                          ))}
                        </Stack>
                      </Dropdown>
                      <Dropdown
                        title={
                          reward?.type === 'Crystal' ? (
                            <Stack
                              className={cx(
                                borderStyle,
                                crystalBorderStyle,
                                highlightStyle,
                              )}
                              gap={4}
                              nowrap
                            >
                              <div className={crystalScaleStyle}>
                                <CrystalIcon animate crystal={reward.crystal} />
                              </div>
                              <div>
                                {getTranslatedCrystalName(reward.crystal)}
                              </div>
                            </Stack>
                          ) : (
                            <div className={borderStyle}>
                              <fbt desc="Label to select a crystal">
                                Crystal
                              </fbt>
                            </div>
                          )
                        }
                      >
                        <Stack className={crystalSelectorStyle} gap vertical>
                          {Crystals.map((crystal) => (
                            <InlineLink
                              className={linkStyle}
                              key={crystal}
                              onClick={() =>
                                onChange({
                                  ...objective,
                                  reward: { crystal, type: 'Crystal' },
                                })
                              }
                              selectedText={
                                reward?.type === 'Crystal' &&
                                reward.crystal === crystal
                              }
                            >
                              <Stack gap={4} nowrap>
                                <CrystalIcon animate crystal={crystal} />
                                {getTranslatedCrystalName(crystal)}
                              </Stack>
                            </InlineLink>
                          ))}
                        </Stack>
                      </Dropdown>
                    </>
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
                <InfoBox>
                  <p>
                    {objective.type === Criteria.Default ? (
                      <fbt desc="Explanation in the map editor of how rewards work for the default objective">
                        Players receive the reward for the default objective if
                        they win in any way.
                      </fbt>
                    ) : (
                      <fbt desc="Explanation in the map editor for how rewards work">
                        Players receive the reward if they achieve this
                        objective.
                      </fbt>
                    )}{' '}
                    {!tags.includes('reward') && (
                      <fbt desc="Reward tags">
                        To permanently receive the reward, the map must have the
                        <fbt:param name="tag">
                          <Tag tag="reward" />
                        </fbt:param>{' '}
                        tag which can only be added by an Athena Crisis admin.
                      </fbt>
                    )}
                  </p>
                </InfoBox>
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
                  <fbt:list
                    items={campaigns.map(({ name, slug }) => (
                      <InlineLink
                        key={slug}
                        to={getCampaignRoute(slug, 'edit')}
                      >
                        {getCampaignTranslation(name)}
                      </InlineLink>
                    ))}
                    name="campaigns"
                  />{' '}
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

const labelWidthStyle = css`
  width: 100px;
`;

const lightStyle = css`
  opacity: 0.7;
`;

const iconStyle = css`
  cursor: pointer;
`;

const borderStyle = css`
  ${pixelBorder(undefined, 2)}

  padding: 1px 4px 3px;
`;

const crystalBorderStyle = css`
  padding: 0 4px 0;
`;

const highlightStyle = css`
  ${pixelBorder(applyVar('highlight-color'), 2)}

  background-color: ${applyVar('background-color')};
`;

const linkStyle = css`
  padding: 8px;
`;

const selectorStyle = css`
  padding: 2px;
  width: 160px;
`;

const crystalSelectorStyle = css`
  padding: 2px;
  width: 260px;
`;

const lineHeightStyle = css`
  line-height: 1.4em;
`;

const crystalScaleStyle = css`
  transform: scale(0.66);
`;

const labelStyle = css`
  height: fit-content;
`;
