import { getUnitInfo } from '@deities/athena/info/Unit.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { WinCriteria } from '@deities/athena/WinConditions.tsx';
import UnknownTypeError from '@deities/hephaestus/UnknownTypeError.tsx';
import { ActionResponse } from './ActionResponse.tsx';
import transformEffectValue from './lib/transformEffectValue.tsx';

export type WinConditionID = 'win' | 'lose' | 'draw' | number;
const WinConditionIDs = new Set<WinConditionID>(['win', 'lose', 'draw']);

export type PlainWinConditionID = number;

type UnitEqualsCondition = Readonly<{
  from: Vector;
  target: ReadonlyArray<number>;
  type: 'UnitEquals';
}>;

export type GameEndCondition = Readonly<{
  type: 'GameEnd';
  value: WinConditionID;
}>;

export type OptionalObjectiveCondition = Readonly<{
  type: 'OptionalObjective';
  value: number;
}>;

export type Condition =
  | GameEndCondition
  | OptionalObjectiveCondition
  | UnitEqualsCondition;

export type Conditions = ReadonlyArray<Condition>;

const equalsUnit = (
  previousMap: MapData,
  activeMap: MapData,
  actionResponse: ActionResponse,
  originalCondition: UnitEqualsCondition,
) => {
  const { from, target } = transformEffectValue(
    activeMap,
    actionResponse,
    originalCondition,
  );
  const unit = activeMap.contains(from) && activeMap.units.get(from);
  return !!(unit && target.includes(unit.id));
};

const gameEnd = (
  previousMap: MapData,
  activeMap: MapData,
  actionResponse: ActionResponse,
  { value }: GameEndCondition,
) => {
  if (actionResponse.type !== 'GameEnd') {
    return false;
  }

  if (!actionResponse.toPlayer) {
    return value === 'draw';
  }

  if (
    activeMap.getCurrentPlayer().teamId ===
    activeMap.getTeam(actionResponse.toPlayer).id
  ) {
    return (
      (value === 'win' && !actionResponse.condition) ||
      (typeof value === 'number' && value === actionResponse.conditionId)
    );
  }

  return value === 'lose';
};

const optionalObjective = (
  previousMap: MapData,
  activeMap: MapData,
  actionResponse: ActionResponse,
  { value }: OptionalObjectiveCondition,
) =>
  actionResponse.type === 'OptionalObjective' &&
  activeMap.getCurrentPlayer().teamId ===
    activeMap.getTeam(actionResponse.toPlayer).id &&
  value === actionResponse.conditionId;

export function evaluateCondition(
  previousMap: MapData,
  activeMap: MapData,
  actionResponse: ActionResponse,
  condition: Condition,
): boolean {
  const { type } = condition;
  switch (type) {
    case 'UnitEquals':
      return equalsUnit(previousMap, activeMap, actionResponse, condition);
    case 'GameEnd':
      return gameEnd(previousMap, activeMap, actionResponse, condition);
    case 'OptionalObjective':
      return optionalObjective(
        previousMap,
        activeMap,
        actionResponse,
        condition,
      );
    default: {
      condition satisfies never;
      throw new UnknownTypeError('evaluateCondition', type);
    }
  }
}

export function encodeWinConditionID(id: WinConditionID): PlainWinConditionID {
  switch (id) {
    case 'win':
      return -1;
    case 'lose':
      return -2;
    case 'draw':
      return -3;
    default:
      return id;
  }
}

export function decodeWinConditionID(id: PlainWinConditionID): WinConditionID {
  switch (id) {
    case -1:
      return 'win';
    case -2:
      return 'lose';
    case -3:
      return 'draw';
    default:
      return id;
  }
}

export function validateCondition(map: MapData, condition: Condition) {
  const { type } = condition;
  switch (type) {
    case 'UnitEquals': {
      if (condition.target.some((id) => !getUnitInfo(id))) {
        return false;
      }
      return true;
    }
    case 'OptionalObjective':
    case 'GameEnd': {
      const {
        config: { winConditions },
      } = map;
      const { value } = condition;
      return (
        (type === 'GameEnd' && WinConditionIDs.has(value)) ||
        (typeof value === 'number' &&
          winConditions[value] &&
          winConditions[value].type !== WinCriteria.Default)
      );
    }
    default: {
      condition satisfies never;
      throw new UnknownTypeError('validateCondition', type);
    }
  }
}
