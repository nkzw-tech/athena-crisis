import {
  ActivateCrystalAction,
  ActivatePowerAction,
} from '@deities/apollo/action-mutators/ActionMutators.tsx';
import {
  capturedByPlayer,
  destroyedBuildingsByPlayer,
  escortedByPlayer,
  rescuedUnitsByPlayer,
} from '@deities/apollo/lib/checkObjective.tsx';
import { getSkillConfig } from '@deities/athena/info/Skill.tsx';
import { Crystal } from '@deities/athena/invasions/Crystal.tsx';
import calculateFunds from '@deities/athena/lib/calculateFunds.tsx';
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
import UnknownTypeError from '@deities/hephaestus/UnknownTypeError.tsx';
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
import Stack from '@deities/ui/Stack.tsx';
import { css, cx, keyframes } from '@emotion/css';
import Android from '@iconify-icons/pixelarticons/android.js';
import Buildings from '@iconify-icons/pixelarticons/buildings.js';
import Flag from '@iconify-icons/pixelarticons/flag.js';
import Hourglass from '@iconify-icons/pixelarticons/hourglass.js';
import HumanHandsdown from '@iconify-icons/pixelarticons/human-handsdown.js';
import Escort from '@iconify-icons/pixelarticons/human-run.js';
import Reload from '@iconify-icons/pixelarticons/reload.js';
import { memo, useCallback, useMemo } from 'react';
import activateCrystalAction from '../behavior/activateCrystal/activateCrystalAction.tsx';
import clientActivatePowerAction from '../behavior/activatePower/clientActivatePowerAction.tsx';
import { resetBehavior } from '../behavior/Behavior.tsx';
import handleRemoteAction from '../behavior/handleRemoteAction.tsx';
import MiniPortrait from '../character/MiniPortrait.tsx';
import { PortraitHeight, PortraitWidth } from '../character/Portrait.tsx';
import { UserLike } from '../hooks/useUserMap.tsx';
import useCrystals from '../invasions/useCrystals.tsx';
import getTranslatedFactionName from '../lib/getTranslatedFactionName.tsx';
import toTransformOrigin from '../lib/toTransformOrigin.tsx';
import { PlayerEffectItem } from '../Types.tsx';
import CrystalIcon from './CrystalIcon.tsx';
import { GameCardProps } from './CurrentGameCard.tsx';
import Funds from './Funds.tsx';
import getMaxCharge from './lib/getMaxCharge.tsx';
import { SkillIcon } from './SkillDialog.tsx';

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
  useFactionNamesForBots,
  user,
  vision,
  wide,
}: GameCardProps & {
  animate: boolean;
  player: Player;
  user: UserLike & { crystals?: string };
  wide?: boolean;
}) {
  const { action, showGameInfo, update } = actions;
  const { objectives } = map.config;
  const color = getColor(player.id);
  const crystalMap = useCrystals(user.crystals);
  const powerCrystals = crystalMap.get(Crystal.Power) || 0;
  const isCurrentPlayer = currentViewer === player.id;
  const canActivateCrystal = invasions && isCurrentPlayer;
  const activeCrystal =
    player.isHumanPlayer() && player.crystal != null ? player.crystal : null;
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
  const maxCharge = (shouldShow && getMaxCharge(player, availableCharges)) || 0;

  const canAction = useCallback(
    (item: PlayerEffectItem) => {
      const itemType = item.type;
      switch (itemType) {
        case 'Skill': {
          const { charges, requiresCrystal } = getSkillConfig(item.skill);
          const currentPlayer = map.getCurrentPlayer();
          return !!(
            charges &&
            currentPlayer.id === currentViewer &&
            player.id === currentPlayer.id &&
            charges * Charge <= player.charge &&
            !player.activeSkills.has(item.skill) &&
            (!requiresCrystal ||
              (player.isHumanPlayer() && player.crystal != null))
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
        action: isCurrentPlayer
          ? async (item: PlayerEffectItem) => {
              const state = await update(resetBehavior());

              const getActionMutator = (item: PlayerEffectItem) => {
                const itemType = item.type;
                switch (itemType) {
                  case 'Skill':
                    return ActivatePowerAction(item.skill);
                  case 'Crystal':
                    return ActivateCrystalAction(Crystal.Power);
                  default: {
                    itemType satisfies never;
                    throw new UnknownTypeError('PlayerCard.action', itemType);
                  }
                }
              };

              const [remoteAction, , actionResponse] = action(
                state,
                getActionMutator(item),
              );
              if (
                actionResponse.type === 'ActivatePower' ||
                actionResponse.type === 'ActivateCrystal'
              ) {
                await update({
                  ...(await (actionResponse.type === 'ActivatePower'
                    ? clientActivatePowerAction(actions, state, actionResponse)
                    : activateCrystalAction(actions, actionResponse))),
                });
                await handleRemoteAction(actions, remoteAction);
              }
            }
          : undefined,
        actionName: <fbt desc="Button to activate a skill">Activate</fbt>,
        activeCrystal,
        canAction,
        charges: availableCharges,
        crystalMap: isCurrentPlayer ? crystalMap : undefined,
        crystals: crystal != null ? [crystal] : undefined,
        currentItem,
        origin: origin || 'center center',
        showAction: (item: PlayerEffectItem) =>
          item.type === 'Skill'
            ? !!getSkillConfig(item.skill).charges
            : activeCrystal === null,
        skills: [...player.skills],
        spectatorLink: isCurrentPlayer ? spectatorLink : undefined,
        type: 'player-effect',
      });
    },
    [
      update,
      showGameInfo,
      isCurrentPlayer,
      activeCrystal,
      canAction,
      availableCharges,
      crystalMap,
      crystal,
      player.skills,
      spectatorLink,
      action,
      actions,
    ],
  );

  useInput('info', () => {
    if (wide && isCurrentPlayer) {
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
        [vars.set('items')]: player.skills.size + (crystal != null ? 1 : 0),
        opacity: map.active.includes(player.id) ? 1 : 0.3,
      }}
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
        <Stack nowrap>
          <Stack vertical>
            <div
              className={cx(
                ellipsis,
                textStyle,
                wide && wideStyle,
                marginLeftStyle,
                isCurrentPlayer && maxCharge > 0 && SlowRainbowStyle,
              )}
              onClick={
                isCurrentPlayer && maxCharge > 0 && player.skills.size
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
            <Stack className={offsetStyle} gap={16} nowrap start>
              <Funds
                className={cx(
                  ellipsis,
                  textStyle,
                  fundStyle,
                  wide && wideStyle,
                )}
                value={shouldShow ? player.funds : '???'}
              />
              <Stack gap>{objectiveList}</Stack>
            </Stack>
            {wide && (
              <Stack className={offsetStyle} gap={16} nowrap start>
                <Stack className={cx(playerStatsStyle, nowrapStyle)} nowrap>
                  <Icon className={playerStatsBeforeIconStyle} icon={Reload} />
                  <span>
                    {shouldShow ? calculateFunds(map, player) : '???'}
                  </span>
                </Stack>
                <Stack gap>
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
                      className={cx(playerStatsStyle, nowrapStyle)}
                      key={index}
                      nowrap
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
              </Stack>
            )}
          </Stack>
          {player.skills.size || invasions ? (
            <Stack className={skillStyle} nowrap>
              {[...new Set([...player.activeSkills, ...player.skills])].map(
                (skill) => {
                  const { charges, requiresCrystal } = getSkillConfig(skill);
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
                          !!charges &&
                          availableCharges >= charges &&
                          map.getCurrentPlayer().id === player.id &&
                          (!requiresCrystal ||
                            (player.isHumanPlayer() && player.crystal != null))
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
      <Stack className={nowrapStyle} gap={2} key={id} nowrap>
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

const offsetStyle = css`
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

const skillStyle = css`
  padding: 13px 0 0 8px;
  gap: 12px;
`;

const fundStyle = css`
  margin-top: -1px;
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
