import matchesPlayerList from '@deities/athena/lib/matchesPlayerList.tsx';
import Entity from '@deities/athena/map/Entity.tsx';
import { PlayerID, PlayerIDSet } from '@deities/athena/map/Player.tsx';
import Unit, { TransportedUnit } from '@deities/athena/map/Unit.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import {
  Criteria,
  onlyHasDefaultWinCondition,
  WinCondition,
} from '@deities/athena/WinConditions.tsx';
import isPresent from '@deities/hephaestus/isPresent.tsx';
import { ActionResponse } from '../ActionResponse.tsx';

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
          condition.type === Criteria.Default ||
          (condition.type === Criteria.DefeatLabel &&
            matchesPlayerList(condition.players, map.currentPlayer)),
      )
    );
  } else if (actionResponse.type === 'Capture' && actionResponse.building) {
    return (
      onlyHasDefaultWinCondition(winConditions) ||
      winConditions.some(
        (condition) =>
          condition.type === Criteria.Default ||
          ((condition.type === Criteria.CaptureAmount ||
            condition.type === Criteria.CaptureLabel) &&
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

export function rescuedUnitsByPlayer(map: MapData, player: PlayerID) {
  return map.getPlayer(player).stats.rescuedUnits;
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
  const isDefault = condition.type === Criteria.Default;
  const matchesPlayer =
    !isDefault && matchesPlayerList(condition.players, player);
  const isSurvivalAndEndTurn =
    condition.type === Criteria.Survival && actionResponse.type === 'EndTurn';
  const targetPlayer = isSurvivalAndEndTurn
    ? actionResponse.next.player
    : player;
  const ignoreIfOptional = !isDefault && condition.optional;

  if (
    condition.type !== Criteria.Default &&
    condition.completed?.has(targetPlayer)
  ) {
    return false;
  }

  if (isDestructive) {
    return (
      (condition.type === Criteria.DefeatLabel &&
        matchesPlayer &&
        map.units
          .filter(filterUnitsByLabels(condition.label))
          .filter(filterEnemies(map, player)).size === 0 &&
        previousMap.units
          .filter(filterUnitsByLabels(condition.label))
          .filter(filterEnemies(previousMap, player)).size > 0) ||
      (condition.type === Criteria.DefeatOneLabel &&
        matchesPlayer &&
        map.units
          .filter(filterUnitsByLabels(condition.label))
          .filter(filterEnemies(map, player)).size <
          previousMap.units
            .filter(filterUnitsByLabels(condition.label))
            .filter(filterEnemies(previousMap, player)).size) ||
      (condition.type === Criteria.DefeatAmount &&
        matchesPlayer &&
        (condition.players?.length ? condition.players : map.active).find(
          (playerID) =>
            map.getPlayer(playerID).stats.destroyedUnits >= condition.amount,
        )) ||
      (condition.type === Criteria.EscortLabel &&
        !matchesPlayer &&
        !ignoreIfOptional &&
        map.units
          .filter(filterUnitsByLabels(condition.label))
          .filter(filterEnemies(map, player)).size <
          previousMap.units
            .filter(filterUnitsByLabels(condition.label))
            .filter(filterEnemies(map, player)).size) ||
      (condition.type === Criteria.EscortAmount &&
        condition.label?.size &&
        !matchesPlayer &&
        !ignoreIfOptional &&
        map.units
          .filter(filterUnitsByLabels(condition.label))
          .filter(filterEnemies(map, player)).size < condition.amount) ||
      (condition.type === Criteria.CaptureLabel &&
        !ignoreIfOptional &&
        map.buildings
          .filter(filterByLabels(condition.label))
          .filter(filterEnemies(map, player)).size <
          previousMap.buildings
            .filter(filterByLabels(condition.label))
            .filter(filterEnemies(map, player)).size) ||
      (actionResponse.type === 'AttackBuilding' &&
        !actionResponse.building &&
        condition.type === Criteria.DestroyLabel &&
        map.buildings
          .filter(filterByLabels(condition.label))
          .filter(filterEnemies(map, player)).size === 0 &&
        previousMap.buildings
          .filter(filterByLabels(condition.label))
          .filter(filterEnemies(previousMap, player)).size > 0) ||
      (condition.type === Criteria.RescueLabel &&
        !ignoreIfOptional &&
        map.units.filter(filterNeutral).filter(filterByLabels(condition.label))
          .size <
          previousMap.units
            .filter(filterNeutral)
            .filter(filterByLabels(condition.label)).size) ||
      (actionResponse.type === 'AttackUnit' &&
        condition.type === Criteria.RescueAmount &&
        !ignoreIfOptional &&
        map.units.filter(filterNeutral).size +
          rescuedUnitsByPlayer(map, player) <
          condition.amount) ||
      (isSurvivalAndEndTurn &&
        matchesPlayerList(condition.players, targetPlayer) &&
        condition.rounds <= actionResponse.round) ||
      (actionResponse.type === 'AttackBuilding' &&
        !actionResponse.building &&
        condition.type === Criteria.DestroyAmount &&
        matchesPlayer &&
        destroyedBuildingsByPlayer(map, player) >= condition.amount)
    );
  }

  if (isCapture) {
    return (
      (condition.type === Criteria.CaptureAmount &&
        matchesPlayer &&
        capturedByPlayer(map, player) >= condition.amount) ||
      (condition.type === Criteria.CaptureLabel &&
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
      (condition.type === Criteria.RescueLabel &&
        matchesPlayer &&
        !map.units.filter(filterNeutral).filter(filterByLabels(condition.label))
          .size &&
        previousMap.units
          .filter(filterNeutral)
          .filter(filterByLabels(condition.label)).size > 0) ||
      (condition.type === Criteria.RescueAmount &&
        matchesPlayer &&
        rescuedUnitsByPlayer(map, player) >= condition.amount)
    );
  }

  if (isMove) {
    if (condition.type === Criteria.EscortLabel && matchesPlayer) {
      const units = map.units
        .filter(filterUnitsByLabels(condition.label))
        .filter((unit) => map.matchesPlayer(unit, player));
      return (
        units.size > 0 &&
        units.filter((_, vector) => !condition.vectors.has(vector)).size === 0
      );
    }

    return (
      condition.type === Criteria.EscortAmount &&
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
