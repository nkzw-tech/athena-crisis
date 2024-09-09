import { ActionResponse } from '@deities/apollo/ActionResponse.tsx';
import { Skill } from '@deities/athena/info/Skill.tsx';
import { TileInfo } from '@deities/athena/info/Tile.tsx';
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
import useBlockInput from '@deities/ui/controls/useBlockInput.tsx';
import useInput from '@deities/ui/controls/useInput.tsx';
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
  ReactNode,
  useCallback,
  useMemo,
  useState,
} from 'react';
import BuildingCard from '../card/BuildingCard.tsx';
import LeaderCard from '../card/LeaderCard.tsx';
import LeaderTitle from '../card/LeaderTitle.tsx';
import TileCard from '../card/TileCard.tsx';
import UnitCard from '../card/UnitCard.tsx';
import getClientViewer from '../lib/getClientViewer.tsx';
import getTranslatedPerformanceStyleTypeName from '../lib/getTranslatedPerformanceStyleTypeName.tsx';
import getTranslatedPerformanceTypeName from '../lib/getTranslatedPerformanceTypeName.tsx';
import ObjectiveDescription from '../objectives/ObjectiveDescription.tsx';
import {
  CurrentGameInfoState,
  FactionNames,
  LeaderInfoState,
  MapInfoState,
  SkillInfoState,
  State,
} from '../Types.tsx';
import Comparator from './Comparator.tsx';
import SkillDialog, { SkillIcon } from './SkillDialog.tsx';

type GameDialogState = Pick<
  State,
  | 'currentViewer'
  | 'factionNames'
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

const MapInfoTab = ({
  children,
  end,
  highlight,
  onClick,
}: {
  children: ReactNode;
  end?: boolean;
  highlight?: boolean;
  onClick?: () => void;
}) => (
  <DialogTab end={end} highlight={highlight} onClick={onClick}>
    {children}
  </DialogTab>
);

const MapInfoPanel = memo(function MapInfoPanel({
  currentViewer,
  factionNames,
  info,
  map,
}: {
  currentViewer: PlayerID | null;
  factionNames: FactionNames;
  info: MapInfoState | LeaderInfoState;
  map: MapData;
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
              factionNames={factionNames}
              map={map}
              {...info}
              {...panel}
              viewer={currentViewer}
            />
          ) : panel.type === 'leader' ? (
            <LeaderCard {...info} {...panel} viewer={currentViewer} />
          ) : panel.type === 'building' ? (
            <BuildingCard
              factionNames={factionNames}
              map={map}
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
          <MapInfoTab
            highlight={panel.type === 'unit'}
            onClick={() => setPanel(unitState)}
          >
            <fbt desc="Label for unit tab">Unit</fbt>
          </MapInfoTab>
        )}
        {leaderState && (
          <MapInfoTab
            highlight={panel.type === 'leader'}
            onClick={() => setPanel(leaderState)}
          >
            <LeaderTitle gender={leaderState.unit.info.gender} />
          </MapInfoTab>
        )}
        {buildingState && (
          <MapInfoTab
            highlight={panel.type === 'building'}
            onClick={() => setPanel(buildingState)}
          >
            {buildingState.building.info.isStructure() ? (
              <fbt desc="Label for structure tab">Structure</fbt>
            ) : (
              <fbt desc="Label for building tab">Building</fbt>
            )}
          </MapInfoTab>
        )}
        {tileState && (
          <MapInfoTab
            highlight={panel.type === 'tile'}
            onClick={() => setPanel(tileState)}
          >
            <fbt desc="Label for field tab">Field</fbt>
          </MapInfoTab>
        )}
        {info.type === 'map-info' && info.create && (unit || building) && (
          <MapInfoTab end onClick={info.create}>
            {unit ? (
              <fbt desc="Button to create a unit">Deploy</fbt>
            ) : building ? (
              <fbt desc="Button to create a building">Build</fbt>
            ) : null}
          </MapInfoTab>
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
  factionNames,
  gameInfoState,
  lastActionResponse,
  map,
}: {
  currentViewer: PlayerID | null;
  endGame?: () => void;
  factionNames: FactionNames;
  gameInfoState: CurrentGameInfoState;
  lastActionResponse: ActionResponse | null;
  map: MapData;
}) {
  const {
    config: { objectives },
  } = map;

  const hasEnded = lastActionResponse?.type === 'GameEnd';
  const [panel, setPanel] = useState<symbol | string>(objectivesPanel);

  const states = useMemo(
    () => [objectivesPanel, ...(gameInfoState.panels?.keys() || [])],
    [gameInfoState.panels],
  );
  useDialogNavigation(states, states.indexOf(panel), setPanel);

  const { alert } = useAlert();
  const onGiveUp = useCallback(() => {
    if (!hasEnded && endGame) {
      alert({
        onAccept: endGame,
        text: fbt(
          'Are you sure you want to give up and restart this map?',
          'Confirmation dialog to give up.',
        ),
      });
    }
  }, [hasEnded, endGame, alert]);

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
                  factionNames={factionNames}
                  key={id}
                  objective={objective}
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
                      factionNames={factionNames}
                      key={id}
                      objective={objective}
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
        <MapInfoTab
          highlight={panel === objectivesPanel}
          onClick={() => setPanel(objectivesPanel)}
        >
          <fbt desc="Label for win condition tab">Objectives</fbt>
        </MapInfoTab>
        {gameInfoState.panels &&
          [...gameInfoState.panels].map(([panelName, { title }]) => (
            <MapInfoTab
              highlight={panel === panelName}
              key={panelName}
              onClick={() => setPanel(panelName)}
            >
              {title}
            </MapInfoTab>
          ))}
        {!hasEnded && endGame && (
          <MapInfoTab end onClick={onGiveUp}>
            <fbt desc="Button to give up">Give Up</fbt>
          </MapInfoTab>
        )}
      </DialogTabBar>
    </>
  );
});

const GameDialogPanel = memo(function GameDialogPanel({
  endGame,
  gameInfoState,
  spectatorCodes,
  state: { currentViewer, factionNames, lastActionResponse, map },
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
          factionNames={factionNames}
          gameInfoState={gameInfoState}
          lastActionResponse={lastActionResponse || null}
          map={map}
        />
      );
    }
    case 'leader-info':
    case 'map-info':
      return (
        <MapInfoPanel
          currentViewer={currentViewer}
          factionNames={factionNames}
          info={gameInfoState}
          map={map}
        />
      );
    default: {
      gameInfoState satisfies never;
      throw new UnknownTypeError('GameInfoPanel', type);
    }
  }
});

const GameSkillDialog = ({
  gameInfoState: {
    action,
    actionName,
    canAction,
    charges,
    currentSkill: initialSkill,
    origin,
    showAction,
    showCost,
    skills,
  },
  onClose,
}: {
  gameInfoState: SkillInfoState;
  onClose: () => void | Promise<void>;
}) => {
  const [currentSkill, setCurrentSkill] = useState(initialSkill);
  useDialogNavigation(
    skills,
    skills?.indexOf(currentSkill) ?? -1,
    setCurrentSkill,
  );

  const onAction = useCallback(
    async (skill: Skill | null) => {
      await onClose();
      action?.(skill);
    },
    [action, onClose],
  );

  return (
    <SkillDialog
      actionName={actionName}
      availableSkills={new Set([currentSkill])}
      canAction={canAction}
      currentSkill={currentSkill}
      focus
      onAction={action ? onAction : undefined}
      onClose={onClose}
      onSelect={action ? onAction : undefined}
      showAction={showAction}
      showCost={showCost}
      size="small"
      tabs={skills?.map((skill, index) => (
        <DialogTab
          highlight={currentSkill === skill}
          isIcon
          key={index}
          onClick={() => setCurrentSkill(skill)}
        >
          <SkillIcon hideDialog skill={skill} />
        </DialogTab>
      ))}
      transformOrigin={origin}
    >
      {charges != null && (
        <Stack className={boxStyle} gap vertical>
          <p>
            <fbt desc="Number of current available charges">
              You currently have <fbt:param name="charges">{charges}</fbt:param>{' '}
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
        </Stack>
      )}
    </SkillDialog>
  );
};

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
      {gameInfoState.type === 'skill' ? (
        <GameSkillDialog gameInfoState={gameInfoState} onClose={onClose} />
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

const boxStyle = css`
  ${clipBorder()}

  background: ${applyVar('background-color')};
  padding: 12px;
`;
