import matchesPlayerList from '@deities/athena/lib/matchesPlayerList.tsx';
import type Entity from '@deities/athena/map/Entity.tsx';
import type { PlayerID, PlayerIDSet } from '@deities/athena/map/Player.tsx';
import type { TransportedUnit } from '@deities/athena/map/Unit.tsx';
import type Unit from '@deities/athena/map/Unit.tsx';
import type Vector from '@deities/athena/map/Vector.tsx';
import type MapData from '@deities/athena/MapData.tsx';
import type { WinCondition } from '@deities/athena/WinConditions.tsx';
import {
  onlyHasDefaultWinCondition,
  WinCriteria,
} from '@deities/athena/WinConditions.tsx';
import isPresent from '@deities/hephaestus/isPresent.tsx';
import type { ActionResponse } from '../ActionResponse.tsx';

const destructiveActions = new Set([
  'AttackUnit',
  'AttackBuilding',
  'EndTurn',
  'ToggleLightning',
]);

const moveActions = new Set(['CreateUnit', 'DropUnit', 'Move', 'Spawn']);

export function isDestructiveAction(actionResponse: ActionResponse) {
  return destructiveActions.has(actionResponse.type);
}

export function shouldCheckDefaultWinConditions(
  map: MapData,
  actionResponse: ActionResponse,
) {
  const { winConditions } = map.config;
  if (isDestructiveAction(actionResponse)) {
    return (
      onlyHasDefaultWinCondition(winConditions) ||
      winConditions.some(
        (condition) =>
          condition.type === WinCriteria.Default ||
          (condition.type === WinCriteria.DefeatLabel &&
            matchesPlayerList(condition.players, map.currentPlayer)),
      )
    );
  } else if (actionResponse.type === 'Capture' && actionResponse.building) {
    return (
      onlyHasDefaultWinCondition(winConditions) ||
      winConditions.some(
        (condition) =>
          condition.type === WinCriteria.Default ||
          ((condition.type === WinCriteria.CaptureAmount ||
            condition.type === WinCriteria.CaptureLabel) &&
            matchesPlayerList(condition.players, map.currentPlayer)),
      )
    );
  }
  return false;
}

const filterByLabels = (label: PlayerIDSet) => (entity: Entity) =>
  entity.label != null && label.has(entity.label);

const filterUnitsByLabels = (label: PlayerIDSet | undefined) => {
  if (!label?.size) {
    return Boolean;
  }

  return (unit: Unit | TransportedUnit): boolean =>
    (unit.label != null && label?.has(unit.label)) ||
    (unit.isTransportingUnits() &&
      unit.transports.some(
        (unit) =>
          (unit.label != null && label?.has(unit.label)) ||
          filterUnitsByLabels(label)(unit),
      ));
};

const filterNeutral = (entity: Entity) => entity.player === 0;

const filterEnemies = (map: MapData, player: PlayerID) => (entity: Entity) =>
  map.isOpponent(entity, player);

export function capturedByPlayer(map: MapData, player: PlayerID) {
  return map.buildings.filter((building) => map.matchesPlayer(building, player))
    .size;
}

export function destroyedBuildingsByPlayer(map: MapData, player: PlayerID) {
  return map.getPlayer(player).stats.destroyedBuildings;
}

export function escortedByPlayer(
  map: MapData,
  player: PlayerID,
  vectors: ReadonlySet<Vector>,
  label: PlayerIDSet | undefined,
) {
  return [...vectors]
    .map((vector) => {
      const unit = map.units.get(vector);
      return unit && map.matchesPlayer(unit, player) ? unit : null;
    })
    .filter(isPresent)
    .filter(filterUnitsByLabels(label)).length;
}

function checkWinCondition(
  previousMap: MapData,
  map: MapData,
  actionResponse: ActionResponse,
  isDestructive: boolean,
  isCapture: boolean,
  isRescue: boolean,
  isMove: boolean,
  condition: WinCondition,
) {
  const player = previousMap.currentPlayer;
  const matchesPlayer =
    condition.type !== WinCriteria.Default &&
    matchesPlayerList(condition.players, player);

  if (isDestructive) {
    return (
      (condition.type === WinCriteria.DefeatLabel &&
        matchesPlayer &&
        map.units
          .filter(filterUnitsByLabels(condition.label))
          .filter(filterEnemies(map, player)).size === 0 &&
        previousMap.units
          .filter(filterUnitsByLabels(condition.label))
          .filter(filterEnemies(previousMap, player)).size > 0) ||
      (condition.type === WinCriteria.DefeatOneLabel &&
        matchesPlayer &&
        map.units
          .filter(filterUnitsByLabels(condition.label))
          .filter(filterEnemies(map, player)).size <
          previousMap.units
            .filter(filterUnitsByLabels(condition.label))
            .filter(filterEnemies(previousMap, player)).size) ||
      (condition.type === WinCriteria.DefeatAmount &&
        matchesPlayer &&
        (condition.players?.length ? condition.players : map.active).find(
          (playerID) =>
            map.getPlayer(playerID).stats.destroyedUnits >= condition.amount,
        )) ||
      (condition.type === WinCriteria.EscortLabel &&
        !matchesPlayer &&
        map.units
          .filter(filterUnitsByLabels(condition.label))
          .filter(filterEnemies(map, player)).size <
          previousMap.units
            .filter(filterUnitsByLabels(condition.label))
            .filter(filterEnemies(map, player)).size) ||
      (condition.type === WinCriteria.EscortAmount &&
        condition.label?.size &&
        !matchesPlayer &&
        map.units
          .filter(filterUnitsByLabels(condition.label))
          .filter(filterEnemies(map, player)).size < condition.amount) ||
      (condition.type === WinCriteria.CaptureLabel &&
        map.buildings
          .filter(filterByLabels(condition.label))
          .filter(filterEnemies(map, player)).size <
          previousMap.buildings
            .filter(filterByLabels(condition.label))
            .filter(filterEnemies(map, player)).size) ||
      (actionResponse.type === 'AttackBuilding' &&
        !actionResponse.building &&
        condition.type === WinCriteria.DestroyLabel &&
        map.buildings
          .filter(filterByLabels(condition.label))
          .filter(filterEnemies(map, player)).size === 0 &&
        previousMap.buildings
          .filter(filterByLabels(condition.label))
          .filter(filterEnemies(previousMap, player)).size > 0) ||
      (condition.type === WinCriteria.RescueLabel &&
        map.units.filter(filterNeutral).filter(filterByLabels(condition.label))
          .size <
          previousMap.units
            .filter(filterNeutral)
            .filter(filterByLabels(condition.label)).size) ||
      (actionResponse.type === 'EndTurn' &&
        condition.type === WinCriteria.Survival &&
        matchesPlayerList(condition.players, actionResponse.next.player) &&
        condition.rounds <= actionResponse.round) ||
      (actionResponse.type === 'AttackBuilding' &&
        !actionResponse.building &&
        condition.type === WinCriteria.DestroyAmount &&
        matchesPlayer &&
        destroyedBuildingsByPlayer(map, player) >= condition.amount)
    );
  }

  if (isCapture) {
    return (
      (condition.type === WinCriteria.CaptureAmount &&
        matchesPlayer &&
        capturedByPlayer(map, player) >= condition.amount) ||
      (condition.type === WinCriteria.CaptureLabel &&
        matchesPlayer &&
        !map.buildings
          .filter(filterByLabels(condition.label))
          .filter(filterEnemies(map, player)).size &&
        previousMap.buildings
          .filter(filterByLabels(condition.label))
          .filter(filterEnemies(map, player)).size > 0)
    );
  }

  if (isRescue) {
    return (
      condition.type === WinCriteria.RescueLabel &&
      matchesPlayer &&
      !map.units.filter(filterNeutral).filter(filterByLabels(condition.label))
        .size &&
      previousMap.units
        .filter(filterNeutral)
        .filter(filterByLabels(condition.label)).size > 0
    );
  }

  if (isMove) {
    if (condition.type === WinCriteria.EscortLabel && matchesPlayer) {
      const units = map.units
        .filter(filterUnitsByLabels(condition.label))
        .filter((unit) => map.matchesPlayer(unit, player));
      return (
        units.size > 0 &&
        units.filter((_, vector) => !condition.vectors.has(vector)).size === 0
      );
    }

    return (
      condition.type === WinCriteria.EscortAmount &&
      matchesPlayer &&
      escortedByPlayer(map, player, condition.vectors, condition.label) >=
        condition.amount
    );
  }

  return false;
}

export default function checkWinConditions(
  previousMap: MapData,
  map: MapData,
  actionResponse: ActionResponse,
) {
  const { winConditions } = map.config;
  if (onlyHasDefaultWinCondition(winConditions)) {
    return null;
  }

  const isDestructive = isDestructiveAction(actionResponse);
  const isCapture =
    !!(actionResponse.type === 'Capture' && actionResponse.building) ||
    actionResponse.type === 'CreateBuilding';

  const isMove = moveActions.has(actionResponse.type);
  const isRescue =
    actionResponse.type === 'Rescue' &&
    map.units.get(actionResponse.to)?.player === actionResponse.player;

  if (isDestructive || isCapture || isMove || isRescue) {
    const check = checkWinCondition.bind(
      null,
      previousMap,
      map,
      actionResponse,
      isDestructive,
      isCapture,
      isRescue,
      isMove,
    );
    if (winConditions.length === 1) {
      const condition = winConditions[0];
      if (check(condition)) {
        return condition;
      }
    }

    if (winConditions.length === 2) {
      const conditionA = winConditions[0];
      if (check(conditionA)) {
        return conditionA;
      }

      const conditionB = winConditions[1];
      if (check(conditionB)) {
        return conditionB;
      }
    } else {
      for (const condition of winConditions) {
        if (check(condition)) {
          return condition;
        }
      }
    }
  }

  return null;
}
