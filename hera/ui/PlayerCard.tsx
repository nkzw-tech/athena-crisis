import {
  capturedByPlayer,
  destroyedBuildingsByPlayer,
  escortedByPlayer,
  rescuedUnitsByPlayer,
} from '@deities/apollo/lib/checkObjective.tsx';
import { getSkillConfig } from '@deities/athena/info/Skill.tsx';
import { Crystal } from '@deities/athena/invasions/Crystal.tsx';
import calculateFunds from '@deities/athena/lib/calculateFunds.tsx';
import calculateUnitValue from '@deities/athena/lib/calculateUnitValue.tsx';
import canActivatePower from '@deities/athena/lib/canActivatePower.tsx';
import matchesPlayerList from '@deities/athena/lib/matchesPlayerList.tsx';
import { Charge, TileSize } from '@deities/athena/map/Configuration.tsx';
import type Player from '@deities/athena/map/Player.tsx';
import { isBot, PlayerIDs } from '@deities/athena/map/Player.tsx';
import type MapData from '@deities/athena/MapData.tsx';
import {
  Criteria,
  Objective,
  objectiveHasAmounts,
} from '@deities/athena/Objectives.tsx';
import clipBorder from '@deities/ui/clipBorder.tsx';
import useInput from '@deities/ui/controls/useInput.tsx';
import { CSSVariables } from '@deities/ui/cssVar.tsx';
import ellipsis from '@deities/ui/ellipsis.tsx';
import getColor from '@deities/ui/getColor.tsx';
import Icon from '@deities/ui/Icon.tsx';
import Crosshair from '@deities/ui/icons/Crosshair.tsx';
import Rescue from '@deities/ui/icons/Rescue.tsx';
import {
  BackgroundRainbowAnimation,
  SlowRainbowStyle,
} from '@deities/ui/PulseStyle.tsx';
import { css, cx, keyframes } from '@emotion/css';
import Android from '@iconify-icons/pixelarticons/android.js';
import Buildings from '@iconify-icons/pixelarticons/buildings.js';
import Chart from '@iconify-icons/pixelarticons/chart.js';
import Watch from '@iconify-icons/pixelarticons/device-watch.js';
import Flag from '@iconify-icons/pixelarticons/flag.js';
import Hourglass from '@iconify-icons/pixelarticons/hourglass.js';
import HumanHandsdown from '@iconify-icons/pixelarticons/human-handsdown.js';
import Escort from '@iconify-icons/pixelarticons/human-run.js';
import Reload from '@iconify-icons/pixelarticons/reload.js';
import UnknownTypeError from '@nkzw/core/UnknownTypeError.js';
import Stack, { VStack } from '@nkzw/stack';
import { memo, useCallback, useMemo } from 'react';
import activateAction from '../behavior/activate/activateAction.tsx';
import { resetBehavior } from '../behavior/Behavior.tsx';
import SelectTargetBehavior from '../behavior/SelectTargetBehavior.tsx';
import MiniPortrait from '../character/MiniPortrait.tsx';
import { PortraitHeight, PortraitWidth } from '../character/Portrait.tsx';
import { UserLike } from '../hooks/useUserMap.tsx';
import useCrystals from '../invasions/useCrystals.tsx';
import formatDuration from '../lib/formatDuration.tsx';
import getTranslatedFactionName from '../lib/getTranslatedFactionName.tsx';
import toTransformOrigin from '../lib/toTransformOrigin.tsx';
import { PlayerEffectItem } from '../Types.tsx';
import CrystalIcon from './CrystalIcon.tsx';
import { GameCardProps } from './CurrentGameCard.tsx';
import Funds from './Funds.tsx';
import getMaxCharge from './lib/getMaxCharge.tsx';
import { SkillIcon } from './SkillDialog.tsx';
import TimeBankTimer from './TimeBankTimer.tsx';

const emptyMap = new Map();

export default memo(function PlayerCard({
  actions,
  animate,
  currentViewer,
  hideIfNoCrystals,
  invasions,
  map,
  player,
  spectatorLink,
  timeout,
  useFactionNamesForBots,
  user,
  vision,
  wide,
}: GameCardProps & {
  animate: boolean;
  player: Player;
  timeout: number | null;
  user: UserLike & { crystals?: string };
  wide?: boolean;
}) {
  const { showGameInfo, update } = actions;
  const { objectives } = map.config;
  const color = getColor(player.id);
  const crystalMap = useCrystals(user.crystals);
  const powerCrystals = crystalMap.get(Crystal.Power) || 0;
  const isViewer = currentViewer === player.id;
  const canActivateCrystal = invasions && isViewer;
  const activeCrystal = player.isHumanPlayer() ? player.crystal : null;
  const crystal =
    activeCrystal != null
      ? activeCrystal
      : canActivateCrystal && (!hideIfNoCrystals || powerCrystals > 0)
        ? Crystal.Power
        : undefined;
  const shouldShow =
    !map.config.fog ||
    // Visibility is determined by the Vision's 'currentViewer', which might be a spectator.
    (vision.currentViewer &&
      map.maybeGetTeam(vision.currentViewer)?.id === map.getTeam(player).id);
  const charge = shouldShow ? player.charge : 0;
  const availableCharges = Math.floor(charge / Charge);
  const remainingCharge = charge % Charge;
  const maxCharge = (shouldShow && getMaxCharge(player)) || 0;

  const canAction = useCallback(
    (item: PlayerEffectItem) => {
      const itemType = item.type;
      switch (itemType) {
        case 'Skill': {
          const currentPlayer = map.getCurrentPlayer();
          return !!(
            currentPlayer.id === currentViewer &&
            player.id === currentPlayer.id &&
            canActivatePower(player, item.skill)
          );
        }
        case 'Crystal':
          return (
            canActivateCrystal &&
            player.isHumanPlayer() &&
            player.crystal === null &&
            powerCrystals > 0
          );
        default: {
          itemType satisfies never;
          throw new UnknownTypeError('PlayerCard.canAction', itemType);
        }
      }
    },
    [canActivateCrystal, player, powerCrystals, map, currentViewer],
  );

  const showPlayerEffectDialog = useCallback(
    async (currentItem: PlayerEffectItem, origin: string | null) => {
      const { behavior } = await update(null);
      if (behavior?.type === 'null') {
        return;
      }

      showGameInfo({
        action: isViewer
          ? async (item: PlayerEffectItem) => {
              const state = await update(resetBehavior());

              if (
                item.type === 'Skill' &&
                getSkillConfig(item.skill).requiresTarget
              ) {
                await update({
                  behavior: new SelectTargetBehavior(item.skill),
                });
                return;
              }

              await activateAction(actions, state, item, null);
            }
          : undefined,
        actionName: <fbt desc="Button to activate a skill">Activate</fbt>,
        activeCrystal,
        canAction,
        charges: availableCharges,
        crystalMap: isViewer ? crystalMap : undefined,
        crystals: crystal != null ? [crystal] : undefined,
        currentItem,
        origin: origin || 'center center',
        showAction: (item: PlayerEffectItem) =>
          item.type === 'Skill'
            ? !!getSkillConfig(item.skill).charges
            : activeCrystal === null,
        skills: [...player.skills],
        spectatorLink: isViewer ? spectatorLink : undefined,
        type: 'player-effect',
      });
    },
    [
      update,
      showGameInfo,
      isViewer,
      activeCrystal,
      canAction,
      availableCharges,
      crystalMap,
      crystal,
      player.skills,
      spectatorLink,
      actions,
    ],
  );

  useInput('info', () => {
    if (wide && isViewer) {
      const item =
        player.skills.size > 0
          ? ({
              skill: player.skills.values().next().value!,
              type: 'Skill',
            } as const)
          : crystal != null
            ? ({ crystal, type: 'Crystal' } as const)
            : null;

      if (item) {
        showPlayerEffectDialog(item, null);
      }
    }
  });

  const objectiveList = useMemo(() => {
    const list = [];
    for (const [id, objective] of objectives) {
      if (
        !objective.hidden &&
        (objectiveHasAmounts(objective) ||
          objective.type === Criteria.Survival) &&
        matchesPlayerList(objective.players, player.id) &&
        !objective.completed?.has(player.id)
      ) {
        list.push(
          <PlayerCardObjective
            id={id}
            key={id}
            map={map}
            objective={objective}
            player={player}
          />,
        );
      }
    }
    return list;
  }, [map, objectives, player]);

  return (
    <div
      className={cx(playerStyle, wide && playerWideStyle)}
      style={{
        opacity: map.active.includes(player.id) ? 1 : 0.3,
        [vars.set('items')]: player.skills.size + (crystal != null ? 1 : 0),
      }}
    >
      <Stack className={chargeStyle}>
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
        <Stack between>
          <VStack between wrap>
            <div
              className={cx(
                ellipsis,
                textStyle,
                wide && wideStyle,
                marginLeftStyle,
                isViewer && maxCharge > 0 && SlowRainbowStyle,
              )}
              onClick={
                isViewer && maxCharge > 0 && player.skills.size
                  ? (event) => {
                      event.stopPropagation();

                      showPlayerEffectDialog(
                        {
                          skill: player.skills.values().next().value!,
                          type: 'Skill',
                        },
                        null,
                      );
                    }
                  : undefined
              }
            >
              <span style={{ color }}>{player.id}.</span>{' '}
              {isBot(player) && useFactionNamesForBots
                ? getTranslatedFactionName(emptyMap, player.id)
                : user?.displayName}
              {isBot(player) && <Icon className={iconStyle} icon={Android} />}
            </div>
            <Stack alignCenter between className={infoStyle} gap>
              <Funds
                className={cx(
                  ellipsis,
                  textStyle,
                  shrinkStyle,
                  wide && wideStyle,
                )}
                value={shouldShow ? player.funds : '???'}
              />
              {timeout && player.isHumanPlayer() && player.time != null && (
                <Stack
                  alignCenter
                  between
                  className={cx(shrinkStyle, nowrapStyle)}
                  gap={4}
                >
                  <Icon icon={Watch} />
                  {map.isCurrentPlayer(player.id) ? (
                    <TimeBankTimer key={timeout} time={timeout} />
                  ) : (
                    formatDuration(player.time)
                  )}
                </Stack>
              )}
              {objectiveList}
            </Stack>
            {wide && (
              <Stack alignCenter between className={infoStyle} gap>
                <Stack between className={cx(playerStatsStyle, nowrapStyle)}>
                  <Icon className={playerStatsBeforeIconStyle} icon={Reload} />
                  <span>
                    {shouldShow ? calculateFunds(map, player) : '???'}
                  </span>
                </Stack>
                <Stack between className={cx(playerStatsStyle, nowrapStyle)}>
                  <Icon className={playerStatsBeforeIconStyle} icon={Chart} />
                  <span>
                    {shouldShow ? calculateUnitValue(map, player) : '???'}
                  </span>
                </Stack>
                {(
                  [
                    [
                      HumanHandsdown,
                      () =>
                        map.units.reduce(
                          (count, unit) =>
                            count +
                            (map.matchesPlayer(unit, player)
                              ? unit.count()
                              : 0),
                          0,
                        ),
                    ],
                    [
                      Buildings,
                      () =>
                        map.buildings.filter((building) =>
                          map.matchesPlayer(building, player),
                        ).size,
                    ],
                  ] as const
                ).map(([icon, getValue], index) => (
                  <Stack
                    between
                    className={cx(playerStatsStyle, nowrapStyle)}
                    key={index}
                  >
                    <Icon
                      className={playerStatsBeforeIconStyle}
                      icon={icon}
                      key="icon"
                    />
                    <span>{shouldShow ? getValue() : '???'}</span>
                  </Stack>
                ))}
              </Stack>
            )}
          </VStack>
          {player.skills.size || invasions ? (
            <Stack
              between
              className={cx(
                skillBoxStyle,
                charge > 0 && skillBoxWithChargeStyle,
              )}
            >
              {[...new Set([...player.activeSkills, ...player.skills])].map(
                (skill) => {
                  const isActive = player.activeSkills.has(skill);
                  return (
                    <div
                      className={pointerStyle}
                      key={skill}
                      onClick={async (event) => {
                        event.stopPropagation();

                        showPlayerEffectDialog(
                          { skill, type: 'Skill' },
                          toTransformOrigin(event),
                        );
                      }}
                    >
                      <SkillIcon
                        active={isActive}
                        canActivate={
                          !isActive &&
                          canActivatePower(player, skill) &&
                          map.getCurrentPlayer().id === player.id
                        }
                        hideDialog
                        skill={skill}
                      />
                    </div>
                  );
                },
              )}
              {crystal != null && (
                <div
                  className={cx(
                    crystal === Crystal.Power &&
                      crystal !== activeCrystal &&
                      powerCrystals <= 0 &&
                      grayscaleStyle,
                  )}
                >
                  <CrystalIcon
                    active={crystal === activeCrystal}
                    animate={false}
                    crystal={crystal}
                    onClick={async (event) => {
                      event.stopPropagation();

                      showPlayerEffectDialog(
                        { crystal, type: 'Crystal' },
                        toTransformOrigin(event),
                      );
                    }}
                  />
                </div>
              )}
            </Stack>
          ) : null}
        </Stack>
      </div>
    </div>
  );
});

const PlayerCardObjective = ({
  id,
  map,
  objective,
  player,
}: {
  id: number;
  map: MapData;
  objective: Objective;
  player: Player;
}) => {
  const [icon, status, amount] = useMemo(
    () =>
      objective.type === Criteria.DefeatAmount
        ? [Crosshair, player.stats.destroyedUnits, objective.amount]
        : objective.type === Criteria.CaptureAmount
          ? [Flag, capturedByPlayer(map, player.id), objective.amount]
          : objective.type === Criteria.DestroyAmount
            ? [
                Buildings,
                destroyedBuildingsByPlayer(map, player.id),
                objective.amount,
              ]
            : objective.type === Criteria.EscortAmount
              ? [
                  Escort,
                  escortedByPlayer(
                    map,
                    player.id,
                    objective.vectors,
                    objective.label,
                  ),
                  objective.amount,
                ]
              : objective.type === Criteria.RescueAmount
                ? [
                    Rescue,
                    rescuedUnitsByPlayer(map, player.id),
                    objective.amount,
                  ]
                : objective.type === Criteria.Survival
                  ? [Hourglass, map.round, objective.rounds]
                  : [null, null],
    [objective, map, player.id, player.stats.destroyedUnits],
  );

  return (
    (icon && status != null && (
      <Stack between className={nowrapStyle} gap={2} key={id}>
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
};

const vars = new CSSVariables<'items'>('pc');

const width = PortraitWidth / 2;
const playerStyle = css`
  ${vars.set('items', 0)}

  position: relative;
  max-height: ${PortraitHeight / 2}px;
`;

const playerWideStyle = css`
  height: ${PortraitHeight * 0.75}px;
  max-height: ${PortraitHeight}px;
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

const infoStyle = css`
  margin-top: -2px;
`;

const textStyle = css`
  max-width: 140px;
`;

const wideStyle = css`
  max-width: calc(
    min(calc(440px - ${vars.apply('items')} * ${TileSize}px), 100vw) - 128px
  );
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

const skillBoxStyle = css`
  padding: 9px 0 0 8px;
  gap: 12px;
`;

const skillBoxWithChargeStyle = css`
  padding-top: 13px;
`;

const shrinkStyle = css`
  flex-shrink: 0;
`;

const playerStatsStyle = css`
  margin-top: -1px;
`;

const playerStatsBeforeIconStyle = css`
  margin: 3px 4px 0 0;
`;

const grayscaleStyle = css`
  filter: grayscale(100%);
`;

const pointerStyle = css`
  cursor: pointer;
`;
