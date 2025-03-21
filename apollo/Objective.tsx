import { Crystal } from '@deities/athena/invasions/Crystal.tsx';
import createBotWithName from '@deities/athena/lib/createBotWithName.tsx';
import updatePlayer from '@deities/athena/lib/updatePlayer.tsx';
import { AllowedMisses } from '@deities/athena/map/Configuration.tsx';
import type Player from '@deities/athena/map/Player.tsx';
import { Bot, PlayerID } from '@deities/athena/map/Player.tsx';
import MapData from '@deities/athena/MapData.tsx';
import {
  Criteria,
  Objective,
  ObjectiveID,
} from '@deities/athena/Objectives.tsx';
import Vision from '@deities/athena/Vision.tsx';
import UnknownTypeError from '@nkzw/core/UnknownTypeError.js';
import { EndTurnAction } from './action-mutators/ActionMutators.tsx';
import { execute } from './Action.tsx';
import {
  ActionResponse,
  AttackBuildingActionResponse,
  AttackUnitActionResponse,
  ToggleLightningActionResponse,
} from './ActionResponse.tsx';
import { ChaosStars } from './invasions/ChaosStars.tsx';
import checkObjectives, {
  pickWinningPlayer,
  shouldCheckDefaultObjectives,
} from './lib/checkObjective.tsx';
import getLosingPlayer from './lib/getLosingPlayer.tsx';
import { processRewards } from './lib/processRewards.tsx';
import { GameState, MutableGameState } from './Types.tsx';

export type AttackUnitGameOverActionResponse = Readonly<{
  fromPlayer: PlayerID;
  toPlayer: PlayerID;
  type: 'AttackUnitGameOver';
}>;

export type BeginTurnGameOverActionResponse = Readonly<{
  abandoned?: boolean;
  fromPlayer?: PlayerID;
  type: 'BeginTurnGameOver';
}>;

export type PreviousTurnGameOverActionResponse = Readonly<{
  fromPlayer: PlayerID;
  type: 'PreviousTurnGameOver';
}>;

export type CaptureGameOverActionResponse = Readonly<{
  fromPlayer: PlayerID;
  toPlayer: PlayerID;
  type: 'CaptureGameOver';
}>;

export type GameEndActionResponse = Readonly<{
  chaosStars?: ChaosStars;
  objective?: Objective;
  objectiveId?: number;
  toPlayer?: PlayerID;
  type: 'GameEnd';
}>;

export type OptionalObjectiveActionResponse = Readonly<{
  objective: Objective;
  objectiveId: number;
  toPlayer: PlayerID;
  type: 'OptionalObjective';
}>;

export type AbandonInvasionActionResponse = Readonly<{
  chaosStars?: ChaosStars;
  fromPlayer?: PlayerID;
  name: string;
  type: 'AbandonInvasion';
}>;

export type ObjectiveActionResponse =
  | AbandonInvasionActionResponse
  | AttackUnitGameOverActionResponse
  | BeginTurnGameOverActionResponse
  | CaptureGameOverActionResponse
  | GameEndActionResponse
  | PreviousTurnGameOverActionResponse
  | OptionalObjectiveActionResponse;

const toOptionalObjective = (
  objective: Objective | undefined,
  objectiveId: number | undefined,
  player: PlayerID | undefined,
): OptionalObjectiveActionResponse | null =>
  objectiveId != null &&
  objective?.type !== Criteria.Default &&
  objective?.optional === true &&
  player
    ? ({
        objective: {
          ...objective,
          completed: new Set([...(objective.completed || []), player]),
        },
        objectiveId,
        toPlayer: player,
        type: 'OptionalObjective',
      } as const)
    : null;

export function applyObjectives(
  previousMap: MapData,
  activeMap: MapData,
  lastActionResponse: ActionResponse,
): GameState | null {
  let [objectiveId, objective] =
    checkObjectives(previousMap, activeMap, lastActionResponse) || [];
  const actionResponses =
    !objective || (objective.type !== Criteria.Default && objective.optional)
      ? checkDefaultObjectives(previousMap, activeMap, lastActionResponse)
      : null;
  if (!actionResponses && !objective) {
    return null;
  }

  const gameState: MutableGameState = [];
  let map = activeMap;

  const player =
    objective && pickWinningPlayer(map, lastActionResponse, objective);

  let reevaluate = false;
  let optionalObjective = toOptionalObjective(objective, objectiveId, player);
  while (optionalObjective) {
    map = applyObjectiveActionResponse(map, optionalObjective);
    gameState.push([optionalObjective, map]);

    let newGameState: GameState = [];
    [newGameState, map] = processRewards(map, optionalObjective);
    gameState.push(...newGameState);

    optionalObjective = null;
    reevaluate = true;

    const [objectiveId, objective] =
      checkObjectives(previousMap, map, lastActionResponse) || [];
    const player =
      objective && pickWinningPlayer(map, lastActionResponse, objective);
    optionalObjective = toOptionalObjective(objective, objectiveId, player);
  }

  if (!actionResponses && reevaluate) {
    [objectiveId, objective] =
      checkObjectives(previousMap, map, lastActionResponse) || [];
  }

  if (actionResponses) {
    for (const actionResponse of actionResponses) {
      map = applyObjectiveActionResponse(map, actionResponse);
      gameState.push([actionResponse, map]);
    }
  }

  return checkGameEndCondition(
    activeMap,
    map,
    player,
    objective,
    objectiveId,
    actionResponses,
    gameState,
  );
}

export function checkGameEndCondition(
  initialMap: MapData,
  map: MapData,
  player: PlayerID | undefined,
  objective: Objective | undefined,
  objectiveId: ObjectiveID | undefined,
  actionResponses: ReadonlyArray<ActionResponse> | null,
  gameState: MutableGameState,
): GameState {
  const gameEndResponse =
    objective?.type === Criteria.Default || objective?.optional === false
      ? ({
          objective,
          objectiveId,
          toPlayer: player,
          type: 'GameEnd',
        } as const)
      : checkGameEnd(map);

  if (gameEndResponse) {
    let newGameState: GameState = [];
    [newGameState, map] = processRewards(map, gameEndResponse);
    return [
      ...gameState,
      ...newGameState,
      [gameEndResponse, applyObjectiveActionResponse(map, gameEndResponse)],
    ];
  }

  if (actionResponses) {
    for (const actionResponse of actionResponses) {
      if (
        actionResponse?.type === 'AttackUnitGameOver' ||
        actionResponse?.type === 'BeginTurnGameOver'
      ) {
        // If the user self-destructs, issue an `EndTurnAction`.
        const fromPlayer = actionResponse.fromPlayer
          ? map.getPlayer(actionResponse.fromPlayer)
          : map.getCurrentPlayer();
        if (map.isCurrentPlayer(fromPlayer)) {
          const [endTurnActionResponse, newMap] =
            execute(
              map.copy({ active: initialMap.active }),
              new Vision(fromPlayer.id),
              EndTurnAction(),
            ) || [];
          if (
            newMap &&
            endTurnActionResponse &&
            endTurnActionResponse.type == 'EndTurn'
          ) {
            map = newMap.copy({ active: map.active });
            gameState.push([endTurnActionResponse, map]);
          }
        }
      }
    }
  }

  return gameState;
}

export function applyObjectiveActionResponse(
  map: MapData,
  actionResponse: ObjectiveActionResponse,
) {
  const { type } = actionResponse;
  switch (type) {
    case 'AbandonInvasion': {
      const currentPlayer = actionResponse.fromPlayer
        ? map.getPlayer(actionResponse.fromPlayer)
        : map.getCurrentPlayer();
      return currentPlayer.isHumanPlayer() &&
        currentPlayer.crystal === Crystal.Command
        ? map.copy({
            teams: updatePlayer(
              map.teams,
              Bot.from(currentPlayer, actionResponse.name),
            ),
          })
        : map;
    }
    case 'AttackUnitGameOver':
    case 'PreviousTurnGameOver':
    case 'BeginTurnGameOver': {
      const playerID = getLosingPlayer(map, actionResponse);
      const fromPlayer = playerID != null && map.maybeGetPlayer(playerID);
      if (!fromPlayer) {
        return map;
      }

      return removePlayer(
        map.copy({
          buildings: convertBuildings(map, fromPlayer, 0),
          units: deleteUnits(map, fromPlayer),
        }),
        fromPlayer,
      );
    }
    case 'CaptureGameOver': {
      const fromPlayer = map.getPlayer(actionResponse.fromPlayer);
      const toPlayer = map.getPlayer(actionResponse.toPlayer);
      const captured = map.buildings.filter((building) =>
        map.matchesPlayer(building, fromPlayer),
      ).size;
      return updateCapture(
        removePlayer(
          map.copy({
            buildings: convertBuildings(map, fromPlayer, toPlayer.id),
            teams: updatePlayer(
              map.teams,
              toPlayer.modifyStatistics({
                captured,
              }),
            ),
            units: deleteUnits(map, fromPlayer),
          }),
          fromPlayer,
        ),
        toPlayer,
      );
    }
    case 'GameEnd':
      return map;
    case 'OptionalObjective': {
      const { config } = map;
      const { objective, objectiveId } = actionResponse;
      if (objective.type === Criteria.Default) {
        return map;
      }

      return map.copy({
        config: config.copy({
          objectives: config.objectives.set(objectiveId, {
            ...objective,
            hidden: false,
          }),
        }),
      });
    }
    default: {
      actionResponse satisfies never;
      throw new UnknownTypeError('applyObjectiveActionResponse', type);
    }
  }
}

export function checkCapture(
  previousMap: MapData,
  map: MapData,
  action: ActionResponse,
) {
  if (action.type === 'Capture' && action.building && action.player) {
    const fromPlayer = map.getPlayer(action.player);
    const building = map.buildings.get(action.from);
    const previousBuilding = previousMap.buildings.get(action.from);
    const toPlayer = building ? map.getPlayer(building).id : null;
    if (
      toPlayer &&
      previousBuilding?.info.isHQ() &&
      toPlayer !== previousBuilding.player
    ) {
      return [
        {
          fromPlayer: fromPlayer.id,
          toPlayer,
          type: 'CaptureGameOver',
        } as const,
      ];
    }
  }
  return null;
}

export function checkAttackUnit(
  map: MapData,
  {
    from,
    hasCounterAttack,
    playerA,
    playerB,
    to,
    unitA,
    unitB,
  }: AttackUnitActionResponse,
) {
  const fromPlayer = map.getPlayer(playerA);
  const toPlayer = map.getPlayer(playerB);
  return (
    (hasCounterAttack && (!unitA || playerA !== map.units.get(from)?.player)
      ? checkHasUnits(map, fromPlayer, toPlayer)
      : null) ||
    (playerB > 0 && (!unitB || playerB !== map.units.get(to)?.player)
      ? checkHasUnits(map, toPlayer, fromPlayer)
      : null)
  );
}

export function checkActivatePower(previousMap: MapData, activeMap: MapData) {
  const currentPlayer = activeMap.getCurrentPlayer();
  const opponents = activeMap
    .getPlayers()
    .filter((player) => activeMap.isOpponent(player, currentPlayer));

  const actionResponses = [];
  for (const opponent of opponents) {
    const opponentHasLost =
      hasUnits(previousMap, opponent) &&
      checkHasUnits(activeMap, opponent, currentPlayer)?.[0];

    if (opponentHasLost) {
      actionResponses.push(opponentHasLost);
    }
  }

  return actionResponses.length ? actionResponses : null;
}

export function checkToggleLightning(
  previousMap: MapData,
  activeMap: MapData,
  { from, player, to }: ToggleLightningActionResponse,
) {
  const playerA = player || (from && previousMap.buildings.get(from)?.player);
  const unitB = previousMap.units.get(to);
  if (!playerA || !unitB) {
    return null;
  }

  return !activeMap.units.has(to)
    ? checkHasUnits(
        activeMap,
        previousMap.getPlayer(unitB.player),
        previousMap.getPlayer(playerA),
      )
    : null;
}

export function checkAttackBuilding(
  map: MapData,
  {
    building,
    from,
    hasCounterAttack,
    playerA,
    playerC,
    unitA,
    unitC,
  }: AttackBuildingActionResponse,
) {
  if (playerC == null || playerC === 0) {
    return null;
  }
  const toPlayer = map.getPlayer(playerC);
  const fromPlayer = map.getPlayer(playerA);
  return (
    (hasCounterAttack && (!unitA || playerA !== map.units.get(from)?.player)
      ? checkHasUnits(map, fromPlayer, toPlayer)
      : null) ||
    (!building && !unitC ? checkHasUnits(map, toPlayer, fromPlayer) : null)
  );
}

const checkDefaultObjectives = (
  previousMap: MapData,
  activeMap: MapData,
  actionResponse: ActionResponse,
): ReadonlyArray<ObjectiveActionResponse> | null => {
  if (shouldCheckDefaultObjectives(previousMap, actionResponse)) {
    switch (actionResponse.type) {
      case 'ActivatePower':
        return checkActivatePower(previousMap, activeMap);
      case 'AttackUnit':
        return checkAttackUnit(activeMap, actionResponse);
      case 'AttackBuilding':
        return checkAttackBuilding(activeMap, actionResponse);
      case 'Capture':
        return checkCapture(previousMap, activeMap, actionResponse);
      case 'ToggleLightning':
        return checkToggleLightning(previousMap, activeMap, actionResponse);
      case 'EndTurn':
        return checkEndTurn(previousMap, activeMap);
    }
  }
  return null;
};

const checkEndTurn = (previousMap: MapData, activeMap: MapData) => {
  const previousPlayer = activeMap.getPlayer(previousMap.getCurrentPlayer().id);
  if (
    previousPlayer.isHumanPlayer() &&
    previousPlayer.misses >= AllowedMisses
  ) {
    return [
      previousPlayer.crystal === Crystal.Command
        ? ({
            fromPlayer: previousPlayer.id,
            name: createBotWithName(previousPlayer).name,
            type: 'AbandonInvasion',
          } as const)
        : ({
            fromPlayer: previousPlayer.id,
            type: 'PreviousTurnGameOver',
          } as const),
    ];
  }

  const currentPlayer = activeMap.getCurrentPlayer();
  return hasUnits(previousMap, currentPlayer) &&
    !hasUnits(activeMap, currentPlayer)
    ? [{ fromPlayer: currentPlayer.id, type: 'BeginTurnGameOver' } as const]
    : null;
};

const checkHasUnits = (map: MapData, fromPlayer: Player, toPlayer: Player) => {
  return !hasUnits(map, fromPlayer)
    ? [
        {
          fromPlayer: fromPlayer.id,
          toPlayer: toPlayer.id,
          type: 'AttackUnitGameOver',
        } as const,
      ]
    : null;
};

const checkGameEnd = (map: MapData) => {
  const teams = new Set(map.active.map((playerId) => map.getTeam(playerId)));
  return teams.size === 1
    ? ({
        toPlayer: [...teams][0].players.first()!.id,
        type: 'GameEnd',
      } as const)
    : null;
};

const convertBuildings = (
  map: MapData,
  fromPlayer: Player,
  toPlayer: PlayerID,
) =>
  map.buildings.map((building) =>
    map.matchesPlayer(building, fromPlayer)
      ? building.capture(map, toPlayer)
      : building,
  );

const deleteUnits = (map: MapData, fromPlayer: Player) =>
  map.units.filter((unit) => !map.matchesPlayer(unit, fromPlayer));

const updateCapture = (map: MapData, toPlayer: Player) =>
  map.copy({
    units: map.units.map((unit, vector) => {
      const building = map.buildings.get(vector);
      return building &&
        unit.isCapturing() &&
        map.matchesPlayer(building, toPlayer) &&
        !map.isOpponent(unit, toPlayer)
        ? unit.stopCapture()
        : unit;
    }),
  });

const hasUnits = (map: MapData, player: Player) =>
  map.units.some((unit) => map.matchesPlayer(unit, player));

const removePlayer = (map: MapData, player: Player) =>
  map.copy({
    active: map.active.filter((playerId) => playerId !== player.id),
  });
