import { ActionResponse } from '@deities/apollo/ActionResponse.tsx';
import { Skill } from '@deities/athena/info/Skill.tsx';
import { TileInfo } from '@deities/athena/info/Tile.tsx';
import {
  Crystal,
  CrystalMap,
  PowerCrystal,
} from '@deities/athena/invasions/Crystal.tsx';
import Building from '@deities/athena/map/Building.tsx';
import { PlayerID } from '@deities/athena/map/Player.tsx';
import {
  evaluatePlayerPerformance,
  getPowerValue,
  getStyleValue,
  hasPerformanceExpectation,
} from '@deities/athena/map/PlayerPerformance.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { Criteria } from '@deities/athena/Objectives.tsx';
import groupBy from '@deities/hephaestus/groupBy.tsx';
import isPresent from '@deities/hephaestus/isPresent.tsx';
import UnknownTypeError from '@deities/hephaestus/UnknownTypeError.tsx';
import clipBorder from '@deities/ui/clipBorder.tsx';
import useActive from '@deities/ui/controls/useActive.tsx';
import useBlockInput from '@deities/ui/controls/useBlockInput.tsx';
import useInput from '@deities/ui/controls/useInput.tsx';
import useMenuNavigation from '@deities/ui/controls/useMenuNavigation.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import Dialog, {
  DialogScrollContainer,
  DialogTab,
  DialogTabBar,
  useDialogNavigation,
} from '@deities/ui/Dialog.tsx';
import getColor from '@deities/ui/getColor.tsx';
import useAlert from '@deities/ui/hooks/useAlert.tsx';
import Icon from '@deities/ui/Icon.tsx';
import InfoBox from '@deities/ui/InfoBox.tsx';
import Portal from '@deities/ui/Portal.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { css, cx } from '@emotion/css';
import Pace from '@iconify-icons/pixelarticons/speed-fast.js';
import Subscriptions from '@iconify-icons/pixelarticons/subscriptions.js';
import Trophy from '@iconify-icons/pixelarticons/trophy.js';
import Zap from '@iconify-icons/pixelarticons/zap.js';
import { fbt } from 'fbt';
import {
  Fragment,
  memo,
  ReactElement,
  useCallback,
  useMemo,
  useState,
} from 'react';
import BuildingCard from '../card/BuildingCard.tsx';
import LeaderCard from '../card/LeaderCard.tsx';
import LeaderTitle from '../card/LeaderTitle.tsx';
import TileCard from '../card/TileCard.tsx';
import UnitCard from '../card/UnitCard.tsx';
import CrystalCard from '../invasions/CrystalCard.tsx';
import getClientViewer from '../lib/getClientViewer.tsx';
import getTranslatedPerformanceStyleTypeName from '../lib/getTranslatedPerformanceStyleTypeName.tsx';
import getTranslatedPerformanceTypeName from '../lib/getTranslatedPerformanceTypeName.tsx';
import ObjectiveDescription from '../objectives/ObjectiveDescription.tsx';
import {
  CurrentGameInfoState,
  LeaderInfoState,
  MapInfoState,
  PlayerDetails,
  PlayerEffectInfoState,
  PlayerEffectItem,
  State,
} from '../Types.tsx';
import Comparator from './Comparator.tsx';
import CrystalIcon from './CrystalIcon.tsx';
import { SkillContainer, SkillIcon } from './SkillDialog.tsx';

type GameDialogState = Pick<
  State,
  | 'currentViewer'
  | 'playerDetails'
  | 'gameInfoState'
  | 'lastActionResponse'
  | 'map'
>;

type MapInfoPanelState = Readonly<
  | { type: 'unit'; unit: Unit }
  | { type: 'leader'; unit: Unit }
  | { building: Building; type: 'building' }
  | { tile: TileInfo; type: 'tile' }
  | { type: 'none' }
>;

const MapInfoPanel = memo(function MapInfoPanel({
  currentViewer,
  info,
  map,
  playerDetails,
}: {
  currentViewer: PlayerID | null;
  info: MapInfoState | LeaderInfoState;
  map: MapData;
  playerDetails: PlayerDetails;
}) {
  const unit = info.unit;
  const { building, tile } =
    info.type === 'map-info' ? info : { building: null, tile: null };
  const { buildingState, leaderState, states, tileState, unitState } =
    useMemo(() => {
      const unitState = unit
        ? ({
            type: 'unit',
            unit,
          } as const)
        : null;
      const leaderState = unit?.isLeader()
        ? ({
            type: 'leader',
            unit,
          } as const)
        : null;
      const buildingState = building
        ? ({
            building,
            type: 'building',
          } as const)
        : null;
      const tileState = tile
        ? ({
            tile,
            type: 'tile',
          } as const)
        : null;

      if (info.type === 'leader-info' && leaderState) {
        const states: ReadonlyArray<MapInfoPanelState> = [leaderState];
        return { leaderState, states };
      }
      const states: ReadonlyArray<MapInfoPanelState> = [
        unitState,
        leaderState,
        buildingState,
        tileState,
      ].filter(isPresent);
      return { buildingState, leaderState, states, tileState, unitState };
    }, [unit, building, tile, info.type]);
  const [panel, setPanel] = useState<MapInfoPanelState>(
    unitState || leaderState || buildingState || tileState || { type: 'none' },
  );
  useDialogNavigation(states, states.indexOf(panel), setPanel);

  useInput(
    'accept',
    useCallback(
      (event) => {
        if (info.type === 'map-info' && info.create) {
          event.preventDefault();
          info.create();
        }
      },
      [info],
    ),
    'dialog',
  );

  return (
    <>
      <DialogScrollContainer key={panel.type} navigate>
        <Stack gap={16} vertical>
          {panel.type === 'unit' ? (
            <UnitCard
              map={map}
              playerDetails={playerDetails}
              {...info}
              {...panel}
              viewer={currentViewer}
            />
          ) : panel.type === 'leader' ? (
            <LeaderCard {...info} {...panel} viewer={currentViewer} />
          ) : panel.type === 'building' ? (
            <BuildingCard
              map={map}
              playerDetails={playerDetails}
              {...info}
              {...panel}
            />
          ) : panel.type === 'tile' ? (
            <TileCard
              map={map}
              {...info}
              {...panel}
              player={currentViewer || map.getCurrentPlayer().id}
            />
          ) : null}
        </Stack>
      </DialogScrollContainer>
      <DialogTabBar>
        {unitState && (
          <DialogTab
            highlight={panel.type === 'unit'}
            onClick={() => setPanel(unitState)}
          >
            <fbt desc="Label for unit tab">Unit</fbt>
          </DialogTab>
        )}
        {leaderState && (
          <DialogTab
            highlight={panel.type === 'leader'}
            onClick={() => setPanel(leaderState)}
          >
            <LeaderTitle gender={leaderState.unit.info.gender} />
          </DialogTab>
        )}
        {buildingState && (
          <DialogTab
            highlight={panel.type === 'building'}
            onClick={() => setPanel(buildingState)}
          >
            {buildingState.building.info.isStructure() ? (
              <fbt desc="Label for structure tab">Structure</fbt>
            ) : (
              <fbt desc="Label for building tab">Building</fbt>
            )}
          </DialogTab>
        )}
        {tileState && (
          <DialogTab
            highlight={panel.type === 'tile'}
            onClick={() => setPanel(tileState)}
          >
            <fbt desc="Label for field tab">Field</fbt>
          </DialogTab>
        )}
        {info.type === 'map-info' && info.create && (unit || building) && (
          <DialogTab end onClick={info.create}>
            {unit ? (
              <fbt desc="Button to create a unit">Deploy</fbt>
            ) : building ? (
              <fbt desc="Button to create a building">Build</fbt>
            ) : null}
          </DialogTab>
        )}
      </DialogTabBar>
    </>
  );
});

const MapPerformance = ({
  currentViewer,
  map,
}: {
  currentViewer: PlayerID | null;
  map: MapData;
}) => {
  if (!hasPerformanceExpectation(map)) {
    return null;
  }

  const currentPlayer =
    currentViewer != null && map.maybeGetPlayer(currentViewer);
  const { performance } = map.config;
  const evaluation = currentPlayer
    ? evaluatePlayerPerformance(map, currentPlayer.id)
    : null;

  const hasPowerChallenge = performance.power != null;
  const hasAchievedPowerChallenge =
    performance.power != null &&
    evaluation != null &&
    evaluation.power === true;
  const powerNeed =
    currentPlayer && hasPowerChallenge && !hasAchievedPowerChallenge
      ? Math.ceil(currentPlayer.stats.lostUnits * performance.power) -
        currentPlayer.stats.destroyedUnits
      : null;

  return (
    <Stack gap={16} vertical>
      <h2>
        <fbt desc="Headline for performance evaluation">Challenges</fbt>
      </h2>
      <p>
        <fbt desc="Description of performance evaluation">
          Accomplish these goals to collect stars.
        </fbt>
      </p>
      <div className={gridStyle}>
        <Stack alignCenter gap start>
          <Icon className={iconStyle} icon={Trophy} />{' '}
          <fbt desc="Label for map performance goal">Goal</fbt>
        </Stack>
        <div className={alignCenter}>
          <fbt desc="Label for expected performance metric">Expected</fbt>
        </div>
        <div className={alignCenter}>
          <fbt desc="Label for current performance value">Current</fbt>
        </div>
        {performance.pace != null && (
          <>
            <Stack alignCenter gap start>
              <Icon icon={Pace} />
              <div>{getTranslatedPerformanceTypeName('pace')}</div>
            </Stack>
            <div className={alignCenter}>{performance.pace}</div>
            <div
              className={cx(
                alignCenter,
                evaluation?.pace ? achievedStyle : failedStyle,
              )}
            >
              {currentPlayer ? map.round : null}
            </div>
          </>
        )}
        {hasPowerChallenge && (
          <>
            <Stack alignCenter gap start>
              <Icon icon={Zap} />
              <div>{getTranslatedPerformanceTypeName('power')}</div>
            </Stack>
            <div className={alignCenter}>{performance.power}</div>
            <div
              className={cx(
                alignCenter,
                hasAchievedPowerChallenge ? achievedStyle : failedStyle,
              )}
            >
              {currentPlayer ? getPowerValue(currentPlayer.stats) : null}
            </div>
          </>
        )}
        {performance.style != null && (
          <>
            <Stack alignCenter gap start>
              <Icon icon={Subscriptions} />
              <div>{getTranslatedPerformanceTypeName('style')}</div>
            </Stack>
            <div className={alignCenter}>
              {getTranslatedPerformanceStyleTypeName(performance.style[0])}{' '}
              <Comparator type={performance.style[0]} /> {performance.style[1]}
            </div>
            <div
              className={cx(
                alignCenter,
                evaluation?.style ? achievedStyle : failedStyle,
              )}
            >
              {currentPlayer
                ? getStyleValue(performance.style[0], currentPlayer.stats)
                : null}
            </div>
          </>
        )}
      </div>
      {powerNeed != null && powerNeed > 0 ? (
        <p>
          <fbt desc="Explanation for the power star">
            Defeat
            <fbt:plural
              count={powerNeed}
              many="more units"
              name="number of units"
              showCount="ifMany"
            >
              one more unit
            </fbt:plural>{' '}
            without losing a unit to secure the{' '}
            <fbt:param name="starName">
              {
                <Fragment>
                  <Icon className={zapStyle} icon={Zap} />
                  <span>{getTranslatedPerformanceTypeName('power')}</span>
                </Fragment>
              }
            </fbt:param>{' '}
            star.
          </fbt>
        </p>
      ) : null}
    </Stack>
  );
};

const objectivesPanel = Symbol('objectives');

const GameInfoPanel = memo(function GameInfoPanel({
  currentViewer,
  endGame,
  gameInfoState,
  lastActionResponse,
  map,
  playerDetails,
}: {
  currentViewer: PlayerID | null;
  endGame?: () => void;
  gameInfoState: CurrentGameInfoState;
  lastActionResponse: ActionResponse | null;
  map: MapData;
  playerDetails: PlayerDetails;
}) {
  const {
    config: { objectives },
  } = map;

  const player =
    currentViewer != null ? map.maybeGetPlayer(currentViewer) : null;
  const isCurrentPlayer = player?.id === map.getCurrentPlayer().id;
  const canAbandon =
    player?.isHumanPlayer() &&
    player.crystal != null &&
    player.crystal !== PowerCrystal;
  const hasEnded = lastActionResponse?.type === 'GameEnd';
  const [panel, setPanel] = useState<symbol | string>(objectivesPanel);

  const states = useMemo(
    () => [objectivesPanel, ...(gameInfoState.panels?.keys() || [])],
    [gameInfoState.panels],
  );
  useDialogNavigation(states, states.indexOf(panel), setPanel);

  const { alert } = useAlert();
  const onGiveUp = useCallback(() => {
    if (isCurrentPlayer && !hasEnded && endGame) {
      alert({
        onAccept: endGame,
        text: canAbandon
          ? fbt(
              'Are you sure you want to abandon this map? You will not receive any Chaos Stars.',
              'Confirmation dialog to abandon (give up) a map.',
            )
          : fbt(
              'Are you sure you want to give up and restart this map?',
              'Confirmation dialog to give up.',
            ),
      });
    }
  }, [isCurrentPlayer, hasEnded, endGame, alert, canAbandon]);

  useInput(
    'secondary',
    (event) => {
      event.preventDefault();
      onGiveUp();
    },
    'dialog',
  );

  const visibleConditions = objectives.filter(({ hidden }) => !hidden);
  const partition = groupBy(visibleConditions, ([, objective]) =>
    objective.type === Criteria.Default || !objective.optional
      ? 'required'
      : 'optional',
  );
  const requiredObjectives = partition.get('required');
  const optionalObjectives = partition.get('optional');
  const Component =
    typeof panel === 'string' && gameInfoState.panels?.get(panel)?.content;
  return (
    <>
      <DialogScrollContainer key={panel.toString()} navigate>
        {(Component && (
          <Component lastActionResponse={lastActionResponse} map={map} />
        )) || (
          <Stack gap={24} vertical>
            <Stack gap={16} vertical>
              <h1>
                <fbt desc="Headline for describing how to win">How to win</fbt>
              </h1>
              <p>
                {visibleConditions.size ? (
                  <fbt desc="Description of how to win">
                    Complete any objective to win the game.
                  </fbt>
                ) : (
                  <fbt desc="Objectives are all secret">
                    Objectives for this game are secret.
                  </fbt>
                )}
              </p>
              {requiredObjectives?.map(([id, objective]) => (
                <ObjectiveDescription
                  key={id}
                  objective={objective}
                  playerDetails={playerDetails}
                  round={map.round}
                />
              ))}
              {optionalObjectives && optionalObjectives.length > 0 && (
                <>
                  <p>
                    <fbt desc="Description of how to win">
                      Complete optional objectives for extra rewards:
                    </fbt>
                  </p>
                  {optionalObjectives.map(([id, objective]) => (
                    <ObjectiveDescription
                      key={id}
                      objective={objective}
                      playerDetails={playerDetails}
                      round={map.round}
                    />
                  ))}
                </>
              )}
            </Stack>
            <MapPerformance currentViewer={currentViewer} map={map} />
          </Stack>
        )}
      </DialogScrollContainer>
      <DialogTabBar>
        <DialogTab
          highlight={panel === objectivesPanel}
          onClick={() => setPanel(objectivesPanel)}
        >
          <fbt desc="Label for win condition tab">Objectives</fbt>
        </DialogTab>
        {gameInfoState.panels &&
          [...gameInfoState.panels].map(([panelName, { title }]) => (
            <DialogTab
              highlight={panel === panelName}
              key={panelName}
              onClick={() => setPanel(panelName)}
            >
              {title}
            </DialogTab>
          ))}
        {!hasEnded && endGame && (
          <DialogTab disabled={!isCurrentPlayer} end onClick={onGiveUp}>
            {canAbandon ? (
              <fbt desc="Button to abandon (give up)">Abandon</fbt>
            ) : (
              <fbt desc="Button to give up">Give Up</fbt>
            )}
          </DialogTab>
        )}
      </DialogTabBar>
    </>
  );
});

const GameDialogPanel = memo(function GameDialogPanel({
  endGame,
  gameInfoState,
  spectatorCodes,
  state: { currentViewer, lastActionResponse, map, playerDetails },
}: {
  endGame?: () => void;
  gameInfoState: CurrentGameInfoState | LeaderInfoState | MapInfoState;
  spectatorCodes?: ReadonlyArray<string>;
  state: GameDialogState;
}) {
  useBlockInput('dialog');

  const { type } = gameInfoState;
  switch (type) {
    case 'game-info': {
      return (
        <GameInfoPanel
          currentViewer={getClientViewer(map, currentViewer, spectatorCodes)}
          endGame={endGame}
          gameInfoState={gameInfoState}
          lastActionResponse={lastActionResponse || null}
          map={map}
          playerDetails={playerDetails}
        />
      );
    }
    case 'leader-info':
    case 'map-info':
      return (
        <MapInfoPanel
          currentViewer={currentViewer}
          info={gameInfoState}
          map={map}
          playerDetails={playerDetails}
        />
      );
    default: {
      gameInfoState satisfies never;
      throw new UnknownTypeError('GameInfoPanel', type);
    }
  }
});

const GamePlayerEffectDialog = ({
  gameInfoState: {
    action,
    actionName,
    activeCrystal,
    canAction,
    charges,
    crystalMap,
    crystals,
    currentItem: initialItem,
    origin,
    showAction,
    showCost,
    skills,
    spectatorLink,
  },
  onClose,
}: {
  gameInfoState: PlayerEffectInfoState;
  onClose: () => void | Promise<void>;
}) => {
  const [currentItem, setCurrentItem] = useState(initialItem);
  const items = useMemo(
    () =>
      [
        ...(skills?.map((skill) => ({ skill, type: 'Skill' }) as const) || []),
        ...(crystals?.map(
          (crystal) => ({ crystal, type: 'Crystal' }) as const,
        ) || []),
      ] as const,
    [skills, crystals],
  );

  useDialogNavigation(
    items,
    items?.findIndex(
      (item) =>
        (item.type === 'Skill' &&
          item.type === currentItem.type &&
          item.skill === currentItem.skill) ||
        (item.type === 'Crystal' &&
          item.type === currentItem.type &&
          item.crystal === currentItem.crystal),
    ) ?? -1,
    setCurrentItem,
  );

  useBlockInput('dialog');

  const onSkillAction = useCallback(
    async (skill: Skill | null) => {
      await onClose();
      if (skill) {
        action?.({ skill, type: 'Skill' });
      }
    },
    [action, onClose],
  );

  const onAction = useCallback(
    async (item: PlayerEffectItem) => {
      await onClose();
      action?.(item);
    },
    [action, onClose],
  );

  const tabs = useMemo(
    () => [
      ...(skills?.map((skill, index) => (
        <DialogTab
          highlight={
            currentItem.type === 'Skill' && currentItem.skill === skill
          }
          isIcon
          key={`skill-${index}`}
          onClick={() => setCurrentItem({ skill, type: 'Skill' })}
        >
          <SkillIcon hideDialog skill={skill} />
        </DialogTab>
      )) || []),
      ...(crystals?.map((crystal, index) => (
        <DialogTab
          highlight={
            currentItem.type === 'Crystal' && currentItem.crystal === crystal
          }
          isIcon
          key={`crystal-${index}`}
          onClick={() => setCurrentItem({ crystal, type: 'Crystal' })}
        >
          <CrystalIcon animate={false} crystal={crystal} />
        </DialogTab>
      )) || []),
    ],
    [crystals, currentItem, skills],
  );

  const currentSkill = currentItem.type === 'Skill' ? currentItem.skill : null;
  const currentCrystal =
    currentItem.type === 'Crystal' ? currentItem.crystal : null;

  return (
    <Dialog
      onClose={onClose}
      size={currentSkill ? 'small' : 'medium'}
      transformOrigin={origin}
    >
      {currentSkill != null ? (
        <SkillContainer
          actionName={actionName}
          availableSkills={new Set([currentSkill])}
          canAction={
            canAction
              ? (skill) => canAction({ skill, type: 'Skill' })
              : undefined
          }
          currentSkill={currentSkill}
          focus
          onAction={action ? onSkillAction : undefined}
          onClose={onClose}
          onSelect={action ? onSkillAction : undefined}
          showCost={showCost}
        >
          {charges != null && (
            <InfoBox gap vertical>
              <p>
                <fbt desc="Number of current available charges">
                  You currently have{' '}
                  <fbt:param name="charges">{charges}</fbt:param>{' '}
                  <fbt:plural
                    count={charges}
                    many="charges"
                    name="number of charges"
                  >
                    charge
                  </fbt:plural>. Your charge bar fills up through attacks during
                  battle.
                </fbt>
              </p>
            </InfoBox>
          )}
        </SkillContainer>
      ) : currentCrystal != null ? (
        <CrystalContainer
          activeCrystal={activeCrystal}
          canAction={canAction}
          crystal={currentCrystal}
          crystalMap={crystalMap}
          onAction={onAction}
          onClose={onClose}
          spectatorLink={spectatorLink || null}
        />
      ) : null}
      <DialogTabBar>
        {tabs}
        {(!showAction || showAction(currentItem)) && (
          <DialogTab
            disabled={canAction ? !canAction(currentItem) : false}
            end
            onClick={() => onAction(currentItem)}
          >
            {actionName}
          </DialogTab>
        )}
      </DialogTabBar>
    </Dialog>
  );
};

const CrystalContainer = ({
  activeCrystal,
  canAction,
  crystal,
  crystalMap,
  onAction,
  onClose,
  spectatorLink,
}: {
  activeCrystal: Crystal | null | undefined;
  canAction: ((item: PlayerEffectItem) => boolean) | undefined;
  crystal: Crystal;
  crystalMap?: CrystalMap;
  onAction: (item: PlayerEffectItem) => void;
  onClose: () => void | Promise<void>;
  spectatorLink: ReactElement | null;
}) => {
  const isPowerCrystal = crystal === PowerCrystal;

  const onSelect = useCallback(() => {
    if (!canAction || canAction({ crystal, type: 'Crystal' })) {
      onAction({ crystal, type: 'Crystal' });
    }
  }, [canAction, crystal, onAction]);

  useInput(
    'accept',
    useCallback(
      (event) => {
        event.preventDefault();
        onSelect();
      },
      [onSelect],
    ),
    'dialog',
  );

  useInput(
    'cancel',
    useCallback(
      (event) => {
        event.preventDefault();

        onClose();
      },
      [onClose],
    ),
    // Has to be on top in order not to interfere with the Map.
    'top',
  );

  useBlockInput('dialog');

  const [selected, active] = useMenuNavigation(1, 'dialog');
  useActive(active === 0, onSelect);

  return (
    <DialogScrollContainer key={`crystal-${crystal}`} navigate>
      <Stack gap={16} vertical>
        <h2>
          {activeCrystal === crystal ? (
            <fbt desc="Headline for crystal dialog">Active Crystal</fbt>
          ) : (
            <fbt desc="Headline for crystal dialog">Crystal</fbt>
          )}
        </h2>
        <div
          className={cx(
            crystalBoxStyle,
            selected === 0 && crystalSelectedBoxStyle,
          )}
          onClick={onSelect}
        >
          <CrystalCard crystal={crystal} />
        </div>
        {isPowerCrystal && spectatorLink}
        {activeCrystal == null && crystalMap != null && (
          <InfoBox>
            <p>
              <fbt desc="Number of current available crystals">
                You currently have{' '}
                <fbt:param name="crystals">
                  {crystalMap.get(crystal) || 0}
                </fbt:param>{' '}
                <fbt:plural
                  count={crystalMap.get(crystal) || 0}
                  many="crystals"
                  name="number of crystals"
                >
                  crystal
                </fbt:plural>{' '}
                of this type. You can buy more crystals in the shop.
              </fbt>
            </p>
          </InfoBox>
        )}
        {isPowerCrystal && (
          <InfoBox style={{ backgroundColor: getColor('orange', 0.3) }}>
            <p>
              <fbt desc="Explanation for invasion mechanics">
                This game turns into a realtime game if another player invades
                your world.
              </fbt>
            </p>
          </InfoBox>
        )}
      </Stack>
    </DialogScrollContainer>
  );
};

const crystalBoxStyle = css`
  cursor: pointer;
  padding: 8px 4px;
  transition: background-color 150ms ease;

  &:hover {
    ${clipBorder()}
    background-color: ${applyVar('background-color')};
  }
`;

const crystalSelectedBoxStyle = css`
  ${clipBorder()}

  background-color: ${applyVar('background-color')};
`;

export default memo(function GameDialog({
  endGame,
  onClose,
  spectatorCodes,
  state,
}: {
  endGame?: (type: 'Lose') => void;
  onClose: () => void | Promise<void>;
  spectatorCodes?: ReadonlyArray<string>;
  state: GameDialogState;
}) {
  const { gameInfoState } = state;
  const create = gameInfoState?.type === 'map-info' && gameInfoState.create;
  return gameInfoState ? (
    <Portal>
      {gameInfoState.type === 'player-effect' ? (
        <GamePlayerEffectDialog
          gameInfoState={gameInfoState}
          onClose={onClose}
        />
      ) : (
        <Dialog onClose={onClose} transformOrigin={gameInfoState.origin}>
          <GameDialogPanel
            endGame={
              endGame
                ? async () => {
                    await onClose();
                    endGame('Lose');
                  }
                : undefined
            }
            gameInfoState={
              create
                ? {
                    ...gameInfoState,
                    create: async () => {
                      await onClose();
                      create();
                    },
                  }
                : gameInfoState
            }
            spectatorCodes={spectatorCodes}
            state={state}
          />
        </Dialog>
      )}
    </Portal>
  ) : null;
});

const gridStyle = css`
  ${clipBorder()}

  background-color: ${applyVar('background-color')};
  column-gap: 8px;
  display: grid;
  grid-template-columns: auto auto auto;
  padding: 12px;
  row-gap: 12px;
`;

const alignCenter = css`
  text-align: center;
`;

const iconStyle = css`
  margin: 1px 0 -1px 0;
`;

const achievedStyle = css`
  color: ${getColor('green')};
`;

const failedStyle = css`
  color: ${getColor('red')};
`;

const zapStyle = css`
  margin: -2px 4px 2px 0;
`;
