import updatePlayer from '@deities/athena/lib/updatePlayer.tsx';
import Building from '@deities/athena/map/Building.tsx';
import { PlayerID } from '@deities/athena/map/Player.tsx';
import Unit, { DryUnit } from '@deities/athena/map/Unit.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { VisionT } from '@deities/athena/Vision.tsx';
import { AttackDirection } from './attack-direction/getAttackDirection.tsx';

export type HiddenMoveActionResponse = Readonly<{
  completed?: boolean;
  fuel?: number;
  path: ReadonlyArray<Vector>;
  type: 'HiddenMove';
  unit?: Unit;
}>;

export type HiddenSourceAttackUnitActionResponse = Readonly<{
  chargeB?: number;
  direction: AttackDirection;
  hasCounterAttack: boolean;
  newPlayerB?: PlayerID;
  playerB: PlayerID;
  to: Vector;
  type: 'HiddenSourceAttackUnit';
  unitB?: DryUnit;
  weapon?: number;
}>;

export type HiddenTargetAttackUnitActionResponse = Readonly<{
  chargeA?: number;
  direction: AttackDirection;
  from: Vector;
  hasCounterAttack: boolean;
  newPlayerA?: PlayerID;
  playerA: PlayerID;
  type: 'HiddenTargetAttackUnit';
  unitA?: DryUnit;
  weapon?: number;
}>;

export type HiddenSourceAttackBuildingActionResponse = Readonly<{
  building?: Building;
  chargeB?: number;
  chargeC?: number;
  direction: AttackDirection;
  hasCounterAttack: boolean;
  playerC?: PlayerID;
  to: Vector;
  type: 'HiddenSourceAttackBuilding';
  unitC?: DryUnit;
  weapon?: number;
}>;

export type HiddenTargetAttackBuildingActionResponse = Readonly<{
  chargeA?: number;
  direction: AttackDirection;
  from: Vector;
  hasCounterAttack: boolean;
  newPlayerA?: PlayerID;
  playerA: PlayerID;
  to?: Vector;
  type: 'HiddenTargetAttackBuilding';
  unitA?: DryUnit;
  weapon?: number;
}>;

export type HiddenDestroyedBuildingActionResponse = Readonly<{
  to: Vector;
  type: 'HiddenDestroyedBuilding';
}>;

export type HiddenFundAdjustmentActionResponse = Readonly<{
  funds: number;
  type: 'HiddenFundAdjustment';
}>;

export type HiddenActionResponse =
  | HiddenDestroyedBuildingActionResponse
  | HiddenFundAdjustmentActionResponse
  | HiddenMoveActionResponse
  | HiddenSourceAttackBuildingActionResponse
  | HiddenSourceAttackUnitActionResponse
  | HiddenTargetAttackBuildingActionResponse
  | HiddenTargetAttackUnitActionResponse;

function applyHiddenMoveAction(
  map: MapData,
  vision: VisionT,
  { completed, fuel, path, unit: unitA }: HiddenMoveActionResponse,
) {
  const unit = unitA || map.units.get(path[0]);
  if (!unit) {
    return map;
  }

  const from = path[0];
  const last = path.at(-1);
  if (!last) {
    return map;
  }
  const to = last;
  const units = map.units.delete(from);

  if (unit && vision.isVisible(map, to)) {
    const unitB = units.get(to);
    const newUnit = fuel ? unit.move().setFuel(fuel) : unit.move();
    return map.copy({
      units: units.set(
        to,
        unitB
          ? unitB.load(newUnit.transport())
          : !completed && unit.info.canAct(map.getPlayer(unit))
            ? newUnit
            : newUnit.complete(),
      ),
    });
  }

  return map.copy({
    units: units.delete(to),
  });
}

function applyHiddenSourceAttackUnitAction(
  map: MapData,
  { chargeB, newPlayerB, to, unitB }: HiddenSourceAttackUnitActionResponse,
) {
  const existingUnit = map.units.get(to);
  if (!existingUnit) {
    return map;
  }

  return map.copy({
    teams:
      existingUnit.player > 0
        ? updatePlayer(
            map.teams,
            map
              .getPlayer(existingUnit)
              .modifyStatistics({
                lostUnits:
                  unitB && newPlayerB == null ? 0 : existingUnit.count(),
              })
              .maybeSetCharge(chargeB),
          )
        : map.teams,
    units: unitB
      ? map.units.set(
          to,
          existingUnit
            .copy(unitB)
            .maybeUpdateAIBehavior()
            .maybeSetPlayer(newPlayerB, 'complete')
            .deactivateShield(),
        )
      : map.units.delete(to),
  });
}

function applyHiddenSourceAttackBuildingAction(
  map: MapData,
  {
    building,
    chargeB,
    chargeC,
    to,
    unitC,
  }: HiddenSourceAttackBuildingActionResponse,
) {
  const existingBuilding = map.buildings.get(to);
  if (!existingBuilding) {
    return map;
  }

  // Update statistics first because `playerB` (building) might match `playerC` (unit).
  if (existingBuilding.player > 0) {
    map = map.copy({
      teams: updatePlayer(
        map.teams,
        map
          .getPlayer(existingBuilding)
          .modifyStatistics({
            lostBuildings: building ? 0 : 1,
          })
          .maybeSetCharge(chargeB),
      ),
    });
  }

  const existingUnit = unitC && map.units.get(to);
  if (!building) {
    return map.copy({
      buildings: map.buildings.delete(to),
      teams:
        existingUnit && existingUnit.player > 0
          ? updatePlayer(
              map.teams,
              map
                .getPlayer(existingUnit)
                .modifyStatistics({
                  lostUnits: existingUnit.count(),
                })
                .maybeSetCharge(chargeC),
            )
          : map.teams,
      units: map.units.delete(to),
    });
  }

  return map.copy({
    buildings: map.buildings.set(
      to,
      existingBuilding.setHealth(building.health),
    ),
    units: existingUnit
      ? map.units.set(to, existingUnit.copy(unitC).maybeUpdateAIBehavior())
      : map.units,
  });
}

function applyHiddenTargetAttackUnitAction(
  map: MapData,
  {
    chargeA,
    from,
    hasCounterAttack,
    newPlayerA,
    unitA,
  }: HiddenTargetAttackUnitActionResponse,
) {
  const unit = map.units.get(from);
  return unit
    ? map.copy({
        teams:
          unitA && newPlayerA == null
            ? map.teams
            : updatePlayer(
                map.teams,
                map
                  .getPlayer(unit)
                  .modifyStatistics({
                    lostUnits: unit.count(),
                  })
                  .maybeSetCharge(chargeA),
              ),
        units: unitA
          ? map.units.set(
              from,
              (hasCounterAttack ? unit.deactivateShield() : unit)
                .copy(unitA)
                .maybeUpdateAIBehavior()
                .complete()
                .maybeSetPlayer(newPlayerA, 'recover'),
            )
          : map.units.delete(from),
      })
    : map;
}

function applyHiddenTargetAttackBuildingAction(
  map: MapData,
  {
    chargeA,
    from,
    hasCounterAttack,
    newPlayerA,
    to,
    unitA,
  }: HiddenTargetAttackBuildingActionResponse,
) {
  const unit = map.units.get(from);
  if (!unit) {
    return map;
  }

  const units = unitA
    ? map.units.set(
        from,
        (hasCounterAttack ? unit.deactivateShield() : unit)
          .copy(unitA)
          .maybeUpdateAIBehavior()
          .complete()
          .maybeSetPlayer(newPlayerA, 'recover'),
      )
    : map.units.delete(from);

  if (to) {
    return map.copy({
      buildings: map.buildings.delete(to),
      units,
    });
  }

  return map.copy({
    teams:
      unitA && newPlayerA == null
        ? map.teams
        : updatePlayer(
            map.teams,
            map
              .getPlayer(unit)
              .modifyStatistics({
                lostUnits: unit.count(),
              })
              .maybeSetCharge(chargeA),
          ),
    units,
  });
}

function applyHiddenDestroyedBuildingAction(
  map: MapData,
  { to }: HiddenDestroyedBuildingActionResponse,
) {
  return map.copy({
    buildings: map.buildings.delete(to),
  });
}

function applyHiddenFundAdjustmentAction(
  map: MapData,
  { funds }: HiddenFundAdjustmentActionResponse,
) {
  return map.copy({
    teams: updatePlayer(map.teams, map.getCurrentPlayer().setFunds(funds)),
  });
}

export function applyHiddenActionResponse(
  map: MapData,
  vision: VisionT,
  actionResponse: HiddenActionResponse,
) {
  switch (actionResponse.type) {
    case 'HiddenMove':
      return applyHiddenMoveAction(map, vision, actionResponse);
    case 'HiddenSourceAttackUnit':
      return applyHiddenSourceAttackUnitAction(map, actionResponse);
    case 'HiddenTargetAttackUnit':
      return applyHiddenTargetAttackUnitAction(map, actionResponse);
    case 'HiddenSourceAttackBuilding':
      return applyHiddenSourceAttackBuildingAction(map, actionResponse);
    case 'HiddenTargetAttackBuilding':
      return applyHiddenTargetAttackBuildingAction(map, actionResponse);
    case 'HiddenDestroyedBuilding':
      return applyHiddenDestroyedBuildingAction(map, actionResponse);
    case 'HiddenFundAdjustment':
      return applyHiddenFundAdjustmentAction(map, actionResponse);
    default: {
      const _exhaustiveCheck: never = actionResponse;
      return _exhaustiveCheck;
    }
  }
}
