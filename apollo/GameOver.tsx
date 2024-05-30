import matchesPlayerList from '@deities/athena/lib/matchesPlayerList.tsx';
import { AllowedMisses } from '@deities/athena/map/Configuration.tsx';
import type Player from '@deities/athena/map/Player.tsx';
import {
  PlayerID,
  resolveDynamicPlayerID,
} from '@deities/athena/map/Player.tsx';
import MapData from '@deities/athena/MapData.tsx';
import Vision from '@deities/athena/Vision.tsx';
import { WinCondition, WinCriteria } from '@deities/athena/WinConditions.tsx';
import UnknownTypeError from '@deities/hephaestus/UnknownTypeError.tsx';
import { EndTurnAction } from './action-mutators/ActionMutators.tsx';
import { execute } from './Action.tsx';
import {
  ActionResponse,
  AttackBuildingActionResponse,
  AttackUnitActionResponse,
  ToggleLightningActionResponse,
} from './ActionResponse.tsx';
import checkWinConditions, {
  isDestructiveAction,
  shouldCheckDefaultWinConditions,
} from './lib/checkWinCondition.tsx';
import { processRewards } from './lib/processRewards.tsx';
import { GameState, MutableGameState } from './Types.tsx';

export type AttackUnitGameOverActionResponse = Readonly<{
  fromPlayer: PlayerID;
  toPlayer: PlayerID;
  type: 'AttackUnitGameOver';
}>;

export type BeginTurnGameOverActionResponse = Readonly<{
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
  condition?: WinCondition;
  conditionId?: number;
  toPlayer?: PlayerID;
  type: 'GameEnd';
}>;

export type OptionalConditionActionResponse = Readonly<{
  condition: WinCondition;
  conditionId: number;
  toPlayer: PlayerID;
  type: 'OptionalCondition';
}>;

export type GameOverActionResponses =
  | AttackUnitGameOverActionResponse
  | BeginTurnGameOverActionResponse
  | CaptureGameOverActionResponse
  | GameEndActionResponse
  | PreviousTurnGameOverActionResponse
  | OptionalConditionActionResponse;

function check(
  previousMap: MapData,
  activeMap: MapData,
  actionResponse: ActionResponse,
) {
  if (shouldCheckDefaultWinConditions(previousMap, actionResponse)) {
    switch (actionResponse.type) {
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
}

const pickWinningPlayer = (
  previousMap: MapData,
  activeMap: MapData,
  actionResponse: ActionResponse,
  condition: WinCondition,
) => {
  if (condition.type === WinCriteria.DefeatAmount) {
    return (
      condition.players?.length ? condition.players : activeMap.active
    ).find(
      (playerID) =>
        (!condition.optional || !condition.completed?.has(playerID)) &&
        activeMap.getPlayer(playerID).stats.destroyedUnits >= condition.amount,
    );
  }

  if (
    actionResponse.type === 'EndTurn' &&
    condition.type !== WinCriteria.Survival
  ) {
    return previousMap.currentPlayer;
  }

  if (
    (condition.type === WinCriteria.RescueLabel ||
      condition.type === WinCriteria.CaptureLabel) &&
    isDestructiveAction(actionResponse) &&
    matchesPlayerList(condition.players, activeMap.currentPlayer)
  ) {
    return resolveDynamicPlayerID(activeMap, 'opponent');
  }

  return activeMap.currentPlayer;
};

export function checkGameOverConditions(
  previousMap: MapData,
  activeMap: MapData,
  lastActionResponse: ActionResponse,
): GameState | null {
  const condition = checkWinConditions(
    previousMap,
    activeMap,
    lastActionResponse,
  );
  const actionResponse = !condition
    ? check(previousMap, activeMap, lastActionResponse)
    : null;
  if (!actionResponse && !condition) {
    return null;
  }

  let map = actionResponse
    ? applyGameOverActionResponse(activeMap, actionResponse)
    : activeMap;
  const gameState: MutableGameState = actionResponse
    ? [[actionResponse, map]]
    : [];

  const winningPlayer = condition
    ? pickWinningPlayer(previousMap, activeMap, lastActionResponse, condition)
    : undefined;

  const gameEndResponse =
    condition?.type === WinCriteria.Default || condition?.optional === false
      ? ({
          condition,
          conditionId: activeMap.config.winConditions.indexOf(condition),
          toPlayer: winningPlayer,
          type: 'GameEnd',
        } as const)
      : checkGameEnd(map);

  if (gameEndResponse) {
    let newGameState: GameState = [];
    [newGameState, map] = processRewards(map, gameEndResponse);
    return [
      ...gameState,
      ...newGameState,
      [gameEndResponse, applyGameOverActionResponse(map, gameEndResponse)],
    ];
  }

  const optionalConditionResponse =
    condition?.type !== WinCriteria.Default &&
    condition?.optional === true &&
    winningPlayer &&
    !condition.completed?.has(winningPlayer)
      ? ({
          condition,
          conditionId: activeMap.config.winConditions.indexOf(condition),
          toPlayer: winningPlayer,
          type: 'OptionalCondition',
        } as const)
      : null;

  if (optionalConditionResponse) {
    let newGameState: GameState = [];
    [newGameState, map] = processRewards(map, optionalConditionResponse);
    map = applyGameOverActionResponse(map, optionalConditionResponse);
    return [
      ...gameState,
      ...newGameState,
      [
        // update `optionalConditionResponse.condition` with the new `map.config` updated in `applyGameOverActionResponse()`
        {
          ...optionalConditionResponse,
          condition:
            map.config.winConditions[optionalConditionResponse.conditionId],
        },
        map,
      ],
    ];
  }

  if (
    actionResponse?.type === 'AttackUnitGameOver' ||
    actionResponse?.type === 'BeginTurnGameOver'
  ) {
    // If the user self-destructs, issue an `EndTurnAction`.
    const fromPlayer =
      actionResponse.type === 'AttackUnitGameOver'
        ? map.getPlayer(actionResponse.fromPlayer)
        : map.getCurrentPlayer();
    if (map.isCurrentPlayer(fromPlayer)) {
      const [endTurnActionResponse, newMap] =
        execute(
          map.copy({ active: activeMap.active }),
          new Vision(fromPlayer.id),
          EndTurnAction(),
        ) || [];
      if (
        newMap &&
        endTurnActionResponse &&
        endTurnActionResponse.type == 'EndTurn'
      ) {
        return [
          ...gameState,
          [endTurnActionResponse, newMap.copy({ active: map.active })],
        ];
      }
    }
  }

  return gameState;
}

export function applyGameOverActionResponse(
  map: MapData,
  actionResponse: GameOverActionResponses,
) {
  const { type } = actionResponse;
  switch (type) {
    case 'AttackUnitGameOver':
    case 'PreviousTurnGameOver':
    case 'BeginTurnGameOver': {
      const fromPlayer =
        actionResponse.type === 'AttackUnitGameOver' ||
        actionResponse.type === 'PreviousTurnGameOver'
          ? map.getPlayer(actionResponse.fromPlayer)
          : map.getCurrentPlayer();
      return removePlayer(
        map.copy({
          buildings: convertBuildings(map, fromPlayer, 0),
        }),
        fromPlayer,
      );
    }
    case 'CaptureGameOver': {
      const fromPlayer = map.getPlayer(actionResponse.fromPlayer);
      const toPlayer = map.getPlayer(actionResponse.toPlayer);
      return updateCapture(
        removePlayer(
          map.copy({
            buildings: convertBuildings(map, fromPlayer, toPlayer),
            units: deleteUnits(map, fromPlayer),
          }),
          fromPlayer,
        ),
        toPlayer,
      );
    }
    case 'GameEnd':
      return map;
    case 'OptionalCondition': {
      const { condition, conditionId, toPlayer } = actionResponse;
      if (condition.type === WinCriteria.Default) {
        return map;
      }
      const winConditions = Array.from(map.config.winConditions);
      winConditions[conditionId] = {
        ...condition,
        completed: condition.completed
          ? new Set([...condition.completed, toPlayer])
          : new Set([toPlayer]),
      };
      return map.copy({
        config: map.config.copy({
          winConditions,
        }),
      });
    }
    default: {
      actionResponse satisfies never;
      throw new UnknownTypeError('applyGameOverActionResponse', type);
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
    if (previousBuilding?.info.isHQ() && building && !building.info.isHQ()) {
      return {
        fromPlayer: fromPlayer.id,
        toPlayer: map.getPlayer(building).id,
        type: 'CaptureGameOver',
      } as const;
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

export function checkToggleLightning(
  previousMap: MapData,
  map: MapData,
  { from, player, to }: ToggleLightningActionResponse,
) {
  const playerA = player || (from && previousMap.buildings.get(from)?.player);
  const unitB = previousMap.units.get(to);
  if (!playerA || !unitB) {
    return null;
  }

  return !map.units.has(to)
    ? checkHasUnits(
        map,
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

const checkEndTurn = (previousMap: MapData, activeMap: MapData) => {
  const previousPlayer = activeMap.getPlayer(previousMap.getCurrentPlayer().id);
  if (previousPlayer.misses >= AllowedMisses) {
    return {
      fromPlayer: previousPlayer.id,
      type: 'PreviousTurnGameOver',
    } as const;
  }

  const currentPlayer = activeMap.getCurrentPlayer();
  return hasUnits(previousMap, currentPlayer) &&
    !hasUnits(activeMap, currentPlayer)
    ? ({ type: 'BeginTurnGameOver' } as const)
    : null;
};

const checkHasUnits = (map: MapData, fromPlayer: Player, toPlayer: Player) => {
  return !hasUnits(map, fromPlayer)
    ? ({
        fromPlayer: fromPlayer.id,
        toPlayer: toPlayer.id,
        type: 'AttackUnitGameOver',
      } as const)
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
  toPlayer: Player | 0,
) =>
  map.buildings.map((building) =>
    map.matchesPlayer(building, fromPlayer)
      ? building.capture(toPlayer)
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
