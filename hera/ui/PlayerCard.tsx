import { ActivatePowerAction } from '@deities/apollo/action-mutators/ActionMutators.tsx';
import {
  capturedByPlayer,
  destroyedBuildingsByPlayer,
  escortedByPlayer,
} from '@deities/apollo/lib/checkWinCondition.tsx';
import type { Skill } from '@deities/athena/info/Skill.tsx';
import { getSkillConfig } from '@deities/athena/info/Skill.tsx';
import matchesPlayerList from '@deities/athena/lib/matchesPlayerList.tsx';
import { Charge, TileSize } from '@deities/athena/map/Configuration.tsx';
import type Player from '@deities/athena/map/Player.tsx';
import type { PlayerID } from '@deities/athena/map/Player.tsx';
import { isBot, PlayerIDs } from '@deities/athena/map/Player.tsx';
import type MapData from '@deities/athena/MapData.tsx';
import type { VisionT } from '@deities/athena/Vision.tsx';
import {
  winConditionHasAmounts,
  WinCriteria,
} from '@deities/athena/WinConditions.tsx';
import sortBy from '@deities/hephaestus/sortBy.tsx';
import clipBorder from '@deities/ui/clipBorder.tsx';
import useInput from '@deities/ui/controls/useInput.tsx';
import ellipsis from '@deities/ui/ellipsis.tsx';
import getColor from '@deities/ui/getColor.tsx';
import Icon from '@deities/ui/Icon.tsx';
import Crosshair from '@deities/ui/icons/Crosshair.tsx';
import { BackgroundRainbowAnimation } from '@deities/ui/RainbowPulseStyle.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { css, cx, keyframes } from '@emotion/css';
import Android from '@iconify-icons/pixelarticons/android.js';
import Buildings from '@iconify-icons/pixelarticons/buildings.js';
import Flag from '@iconify-icons/pixelarticons/flag.js';
import Hourglass from '@iconify-icons/pixelarticons/hourglass.js';
import Escort from '@iconify-icons/pixelarticons/human-run.js';
import { memo, useCallback } from 'react';
import activatePowerAction from '../behavior/activatePower/activatePowerAction.tsx';
import { resetBehavior } from '../behavior/Behavior.tsx';
import MiniPortrait from '../character/MiniPortrait.tsx';
import { PortraitWidth } from '../character/Portrait.tsx';
import type { UserLike } from '../hooks/useUserMap.tsx';
import toTransformOrigin from '../lib/toTransformOrigin.tsx';
import type { Actions } from '../Types.tsx';
import Funds from './Funds.tsx';
import { SkillIcon } from './SkillDialog.tsx';

export default memo(function PlayerCard({
  actions,
  animate,
  currentViewer,
  map,
  player,
  user,
  vision,
  wide,
}: {
  actions: Actions;
  animate: boolean;
  currentViewer: PlayerID | null;
  map: MapData;
  player: Player;
  user: UserLike;
  vision: VisionT;
  wide?: boolean;
}) {
  const { optimisticAction, showGameInfo, update } = actions;
  const { winConditions } = map.config;
  const color = getColor(player.id);

  const shouldShow =
    !map.config.fog ||
    // Visibility is determined by the Vision's 'currentViewer', which might be a spectator.
    (vision.currentViewer &&
      map.maybeGetTeam(vision.currentViewer)?.id === map.getTeam(player).id);
  const charge = shouldShow ? player.charge : 0;
  const availableCharges = Math.floor(charge / Charge);
  const remainingCharge = charge % Charge;
  const maxCharge =
    (shouldShow &&
      sortBy(
        [...player.skills].flatMap((skill) => {
          if (player.activeSkills.has(skill)) {
            return [];
          }

          const { charges } = getSkillConfig(skill);
          return charges && charges <= availableCharges ? [charges] : [];
        }),
        (charges) => charges,
      ).at(-1)) ||
    0;

  const canAction = useCallback(
    (skill: Skill) => {
      const { charges } = getSkillConfig(skill);
      const currentPlayer = map.getCurrentPlayer();
      return !!(
        charges &&
        currentPlayer.id === currentViewer &&
        player.id === currentPlayer.id &&
        charges * Charge <= player.charge &&
        !player.activeSkills.has(skill)
      );
    },
    [currentViewer, map, player.activeSkills, player.charge, player.id],
  );

  const showSkillDialog = useCallback(
    async (currentSkill: Skill, origin: string | null) => {
      const { behavior } = await update(null);
      if (behavior?.type === 'null') {
        return;
      }

      showGameInfo({
        action:
          currentViewer === player.id
            ? async (skill: Skill) => {
                const state = await update(resetBehavior());
                const actionResponse = optimisticAction(
                  state,
                  ActivatePowerAction(skill),
                );
                if (actionResponse.type === 'ActivatePower') {
                  update({
                    ...(await activatePowerAction(
                      actions,
                      state,
                      actionResponse,
                    )),
                  });
                }
              }
            : undefined,
        actionName: <fbt desc="Button to activate a skill">Activate</fbt>,
        canAction,
        currentSkill,
        origin: origin || 'center center',
        showAction: (skill: Skill) => !!getSkillConfig(skill).charges,
        skills: [...player.skills],
        type: 'skill',
      });
    },
    [
      actions,
      canAction,
      currentViewer,
      optimisticAction,
      player.id,
      player.skills,
      showGameInfo,
      update,
    ],
  );

  useInput('info', () => {
    if (currentViewer === player.id && player.skills.size > 0) {
      showSkillDialog(player.skills.values().next().value, null);
    }
  });

  return (
    <div
      className={playerStyle}
      style={{ opacity: map.active.includes(player.id) ? 1 : 0.3 }}
    >
      <Stack className={chargeStyle} nowrap start>
        {Array(availableCharges + 1)
          .fill(0)
          .map((_, index) => (
            <div
              className={cx(chargeItemStyle, maxCharge > index && rainbowStyle)}
              key={index}
              ref={
                availableCharges === index && !wide
                  ? (element) => {
                      if (element) {
                        requestAnimationFrame(() =>
                          requestAnimationFrame(() => {
                            element.style.width = `${(remainingCharge / Charge) * 20}px`;
                          }),
                        );
                      }
                    }
                  : undefined
              }
              style={{
                backgroundColor: color,
                width:
                  availableCharges === index
                    ? wide
                      ? (remainingCharge / Charge) * 20
                      : 0
                    : 20,
              }}
            />
          ))}
      </Stack>
      {user && (
        <MiniPortrait
          animate={player.id === map.getCurrentPlayer().id}
          paused={!animate}
          player={player}
          user={user}
        />
      )}
      <div
        className={cx(
          playerInfoStyle,
          charge > 0 && playerInfoWithCharges,
          wide && widePlayerInfoStyle,
        )}
      >
        <Stack alignCenter nowrap>
          <Stack vertical>
            <div
              className={cx(
                ellipsis,
                textStyle,
                wide && wideStyle,
                marginLeftStyle,
              )}
            >
              <span style={{ color }}>{player.id}.</span> {user?.displayName}
              {isBot(player) && <Icon className={iconStyle} icon={Android} />}
            </div>
            <Stack className={offsetStyle} gap nowrap stretch>
              <Funds
                className={cx(
                  ellipsis,
                  textStyle,
                  fundStyle,
                  wide && wideStyle,
                )}
                value={shouldShow ? player.funds : '???'}
              />
              {winConditions
                .filter(
                  (condition) =>
                    !condition.hidden &&
                    (winConditionHasAmounts(condition) ||
                      condition.type === WinCriteria.Survival) &&
                    matchesPlayerList(condition.players, player.id),
                )
                .map((condition, index) => {
                  const [icon, status, amount] =
                    condition.type === WinCriteria.DefeatAmount
                      ? [
                          Crosshair,
                          player.stats.destroyedUnits,
                          condition.amount,
                        ]
                      : condition.type === WinCriteria.CaptureAmount
                        ? [
                            Flag,
                            capturedByPlayer(map, player.id),
                            condition.amount,
                          ]
                        : condition.type === WinCriteria.DestroyAmount
                          ? [
                              Buildings,
                              destroyedBuildingsByPlayer(map, player.id),
                              condition.amount,
                            ]
                          : condition.type === WinCriteria.EscortAmount
                            ? [
                                Escort,
                                escortedByPlayer(
                                  map,
                                  player.id,
                                  condition.vectors,
                                  condition.label,
                                ),
                                condition.amount,
                              ]
                            : condition.type === WinCriteria.Survival
                              ? [Hourglass, map.round, condition.rounds]
                              : [null, null];

                  return (
                    (icon && status != null && (
                      <Stack className={nowrapStyle} gap={2} key={index} nowrap>
                        <div>
                          <Icon className={winConditionIconStyle} icon={icon} />
                          {status}
                        </div>
                        <div>/</div>
                        <div>{amount}</div>
                      </Stack>
                    )) ||
                    null
                  );
                })}
            </Stack>
          </Stack>
          {player.skills.size ? (
            <Stack className={skillStyle} nowrap>
              {[...new Set([...player.activeSkills, ...player.skills])].map(
                (skill) => {
                  const { charges } = getSkillConfig(skill);
                  const isActive = player.activeSkills.has(skill);
                  return (
                    <div
                      key={skill}
                      onClick={async (event) => {
                        event.stopPropagation();

                        showSkillDialog(skill, toTransformOrigin(event));
                      }}
                    >
                      <SkillIcon
                        active={isActive}
                        canActivate={
                          !isActive &&
                          !!charges &&
                          availableCharges >= charges &&
                          map.getCurrentPlayer().id === currentViewer
                        }
                        hideDialog
                        skill={skill}
                      />
                    </div>
                  );
                },
              )}
            </Stack>
          ) : null}
        </Stack>
      </div>
    </div>
  );
});

const width = PortraitWidth / 2;
const playerStyle = css`
  position: relative;
`;

const playerInfoStyle = css`
  left: ${width + 8}px;
  position: absolute;
  top: -3px;
  transition:
    width 150ms ease-in-out,
    top 150ms ease-in-out;
  width: calc(100% - ${width + 8}px);
`;

const playerInfoWithCharges = css`
  top: -7px;
`;

const chargeStyle = css`
  bottom: -2px;
  gap: 3px;
  height: 4px;
  left: ${width + 8}px;
  position: absolute;
  right: 0;
`;

const chargeItemStyle = css`
  ${clipBorder(1)}

  height: 4px;
  position: relative;
  transition: width 300ms ease-in-out;
  z-index: 1;
`;

const colors = PlayerIDs.slice(2);
const rainbowStyle = css`
  background-color: ${getColor(1)};
  animation:
    ${BackgroundRainbowAnimation} ${colors.length * 1.5}s infinite,
    ${keyframes`
    0%, 100% {
      transform: translate3d(0, 0, 0);
    }

    25% {
      transform: translate3d(0, -2px, 0);
    }

    50% {
      transform: translate3d(0, 1px, 0);
    }

    75% {
      transform: translate3d(0, -2px, 0);
    }
  `} 1.5s infinite ease-in-out;
`;

const widePlayerInfoStyle = css`
  width: calc(100% - ${TileSize * 2 + width + 8}px);
`;

const offsetStyle = css`
  margin-top: -2px;
`;

const textStyle = css`
  max-width: 140px;
`;

const wideStyle = css`
  max-width: calc(min(440px, 100vw) - 128px);
`;

const marginLeftStyle = css`
  margin-left: 2px;
`;

const nowrapStyle = css`
  white-space: nowrap;
`;

const iconStyle = css`
  margin: 2px 0 0 4px;
`;

const winConditionIconStyle = css`
  margin: 3px 6px 0 0;
`;

const skillStyle = css`
  padding: 8px 0 0 8px;
  gap: 12px;
`;

const fundStyle = css`
  margin-top: -1px;
`;
