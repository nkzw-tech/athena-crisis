import { getUnitInfo } from '@deities/athena/info/Unit.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { Criteria } from '@deities/athena/Objectives.tsx';
import UnknownTypeError from '@deities/hephaestus/UnknownTypeError.tsx';
import { ActionResponse } from './ActionResponse.tsx';
import transformEffectValue from './lib/transformEffectValue.tsx';

export type DynamicEffectObjectiveID = 'win' | 'lose' | 'draw' | number;
const DynamicEffectObjectiveIDs = new Set<DynamicEffectObjectiveID>([
  'win',
  'lose',
  'draw',
]);

export type PlainDynamicEffectObjectiveID = number;

type UnitEqualsCondition = Readonly<{
  from: Vector;
  target: ReadonlyArray<number>;
  type: 'UnitEquals';
}>;

export type GameEndCondition = Readonly<{
  type: 'GameEnd';
  value: DynamicEffectObjectiveID;
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
      (value === 'win' && !actionResponse.objective) ||
      (typeof value === 'number' && value === actionResponse.objectiveId)
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
  value === actionResponse.objectiveId;

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

export function encodeDynamicEffectObjectiveID(
  id: DynamicEffectObjectiveID,
): PlainDynamicEffectObjectiveID {
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

export function decodeDynamicEffectObjectiveID(
  id: PlainDynamicEffectObjectiveID,
): DynamicEffectObjectiveID {
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
      const { value } = condition;

      if (type === 'GameEnd' && DynamicEffectObjectiveIDs.has(value)) {
        return true;
      }

      const objective =
        typeof value === 'number' && map.config.objectives.get(value);
      return objective && objective.type !== Criteria.Default;
    }
    default: {
      condition satisfies never;
      throw new UnknownTypeError('validateCondition', type);
    }
  }
}
