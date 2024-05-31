import { Skill } from '@deities/athena/info/Skill.tsx';
import { TileInfo } from '@deities/athena/info/Tile.tsx';
import Building from '@deities/athena/map/Building.tsx';
import { PlayerID } from '@deities/athena/map/Player.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { WinCriteria } from '@deities/athena/WinConditions.tsx';
import groupBy from '@deities/hephaestus/groupBy.tsx';
import isPresent from '@deities/hephaestus/isPresent.tsx';
import UnknownTypeError from '@deities/hephaestus/UnknownTypeError.tsx';
import useBlockInput from '@deities/ui/controls/useBlockInput.tsx';
import useInput from '@deities/ui/controls/useInput.tsx';
import Dialog, {
  DialogScrollContainer,
  DialogTab,
  DialogTabBar,
  useDialogNavigation,
} from '@deities/ui/Dialog.tsx';
import useAlert from '@deities/ui/hooks/useAlert.tsx';
import Portal from '@deities/ui/Portal.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { fbt } from 'fbt';
import { memo, ReactNode, useCallback, useMemo, useState } from 'react';
import BuildingCard from '../card/BuildingCard.tsx';
import LeaderCard from '../card/LeaderCard.tsx';
import LeaderTitle from '../card/LeaderTitle.tsx';
import TileCard from '../card/TileCard.tsx';
import UnitCard from '../card/UnitCard.tsx';
import {
  CurrentGameInfoState,
  FactionNames,
  MapInfoState,
  SkillInfoState,
  State,
} from '../Types.tsx';
import WinConditionDescription from '../win-conditions/WinConditionDescription.tsx';
import SkillDialog, { SkillIcon } from './SkillDialog.tsx';

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
  info: MapInfoState;
  map: MapData;
}) {
  const { building, tile, unit } = info;
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
      const states: ReadonlyArray<MapInfoPanelState> = [
        unitState,
        leaderState,
        buildingState,
        tileState,
      ].filter(isPresent);
      return { buildingState, leaderState, states, tileState, unitState };
    }, [unit, building, tile]);
  const [panel, setPanel] = useState<MapInfoPanelState>(
    unitState || buildingState || tileState || { type: 'none' },
  );
  useDialogNavigation(states, states.indexOf(panel), setPanel);

  useInput(
    'accept',
    useCallback(
      (event) => {
        if (info.create) {
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
      <DialogScrollContainer>
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
        {info.create && (unit || building) && (
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

const winConditionsPanel = Symbol('win-conditions');

const GameInfoPanel = memo(function GameInfoPanel({
  endGame,
  factionNames,
  gameInfoState,
  map,
}: {
  endGame?: () => void;
  factionNames: FactionNames;
  gameInfoState: CurrentGameInfoState;
  map: MapData;
}) {
  const {
    config: { winConditions },
  } = map;

  const [panel, setPanel] = useState<symbol | string>(winConditionsPanel);

  const states = useMemo(
    () => [winConditionsPanel, ...(gameInfoState.panels?.keys() || [])],
    [gameInfoState.panels],
  );
  useDialogNavigation(states, states.indexOf(panel), setPanel);

  const { alert } = useAlert();
  const onGiveUp = useCallback(() => {
    if (endGame) {
      alert({
        onAccept: endGame,
        text: fbt(
          'Are you sure you want to give up and restart this map?',
          'Confirmation dialog to give up.',
        ),
      });
    }
  }, [endGame, alert]);

  useInput(
    'secondary',
    (event) => {
      event.preventDefault();
      onGiveUp();
    },
    'dialog',
  );

  const visibleConditions = winConditions.filter(({ hidden }) => !hidden);
  const partition = groupBy(visibleConditions, (condition) =>
    condition.type === WinCriteria.Default || !condition.optional
      ? 'required'
      : 'optional',
  );
  const requiredConditions = partition.get('required');
  const optionalConditions = partition.get('optional');
  return (
    <>
      <DialogScrollContainer>
        {(typeof panel === 'string' &&
          gameInfoState.panels?.get(panel)?.content) || (
          <Stack gap={16} vertical>
            <h1>
              <fbt desc="Headline for describing how to win">How to win</fbt>
            </h1>
            <p>
              {visibleConditions.length ? (
                <fbt desc="Description of how to win">
                  Complete any win condition to win the game.
                </fbt>
              ) : (
                <fbt desc="Win conditions are all secret">
                  Win conditions for this game are secret.
                </fbt>
              )}
            </p>
            {requiredConditions?.map((condition, index) => (
              <WinConditionDescription
                condition={condition}
                factionNames={factionNames}
                key={index}
                round={map.round}
              />
            ))}
            {optionalConditions && optionalConditions.length > 0 && (
              <>
                <p>
                  <fbt desc="Description of how to win">
                    Complete optional conditions for extra rewards:
                  </fbt>
                </p>
                {optionalConditions.map((condition, index) => (
                  <WinConditionDescription
                    condition={condition}
                    factionNames={factionNames}
                    key={index}
                    round={map.round}
                  />
                ))}
              </>
            )}
          </Stack>
        )}
      </DialogScrollContainer>
      <DialogTabBar>
        <MapInfoTab
          highlight={panel === winConditionsPanel}
          onClick={() => setPanel(winConditionsPanel)}
        >
          <fbt desc="Label for win condition tab">Conditions</fbt>
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
        {endGame && (
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
  state: { currentViewer, factionNames, map },
}: {
  endGame?: () => void;
  gameInfoState: CurrentGameInfoState | MapInfoState;
  state: Pick<
    State,
    'currentViewer' | 'factionNames' | 'gameInfoState' | 'map'
  >;
}) {
  useBlockInput('dialog');

  const { type } = gameInfoState;
  switch (type) {
    case 'game-info': {
      return (
        <GameInfoPanel
          endGame={endGame}
          factionNames={factionNames}
          gameInfoState={gameInfoState}
          map={map}
        />
      );
    }
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

  return (
    <SkillDialog
      actionName={actionName}
      availableSkills={new Set([currentSkill])}
      canAction={canAction}
      currentSkill={currentSkill}
      focus
      onAction={
        action
          ? async (skill: Skill) => {
              await onClose();
              action?.(skill);
            }
          : undefined
      }
      onClose={onClose}
      showAction={showAction}
      showCost={showCost}
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
    />
  );
};

export default memo(function GameDialog({
  endGame,
  onClose,
  state,
}: {
  endGame?: (type: 'Lose') => void;
  onClose: () => void | Promise<void>;
  state: Pick<
    State,
    'currentViewer' | 'factionNames' | 'gameInfoState' | 'map'
  >;
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
            state={state}
          />
        </Dialog>
      )}
    </Portal>
  ) : null;
});
