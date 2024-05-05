import { getUnitInfoOrThrow } from '@deities/athena/info/Unit.tsx';
import getDeployableVectors from '@deities/athena/lib/getDeployableVectors.tsx';
import vec from '@deities/athena/map/vec.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import randomEntry from '@deities/hephaestus/randomEntry.tsx';
import { Action } from '../Action.tsx';
import { ActionResponse } from '../ActionResponse.tsx';
import { Condition } from '../Condition.tsx';

type Mutable<T> = {
  -readonly [Key in keyof T]: T[Key];
};

export const RelativeVectors = {
  Any: vec(-2, -2),
  Source: vec(-1, -1),
  Target: vec(-2, -1),
} as const;

const transformVector = <T extends Action | Condition>(
  map: MapData,
  actionResponse: ActionResponse,
  value: T,
  vector: Vector | null,
): Vector | null => {
  if (
    'from' in actionResponse &&
    vector === RelativeVectors.Source &&
    actionResponse.from
  ) {
    return actionResponse.from;
  } else if (
    vector === RelativeVectors.Target &&
    'to' in actionResponse &&
    actionResponse.to
  ) {
    return actionResponse.to;
  }

  if (
    vector === RelativeVectors.Any &&
    'to' in actionResponse &&
    'from' in actionResponse &&
    actionResponse.from
  ) {
    if (value.type === 'CreateUnit') {
      return (
        getDeployableVectors(
          map,
          getUnitInfoOrThrow(value.id),
          actionResponse.from,
          map.getCurrentPlayer().id,
        )[0] || null
      );
    }

    return randomEntry(actionResponse.from.expand());
  }

  return vector;
};

export default function transformEffectValue<T extends Action | Condition>(
  map: MapData,
  actionResponse: ActionResponse,
  value: T,
): T {
  const newValue = { ...value } as Mutable<T>;
  const from = 'from' in value ? value.from : null;
  const to = 'to' in value ? value.to : null;
  if ('from' in newValue) {
    newValue.from = transformVector(map, actionResponse, value, from);
  }
  if ('to' in newValue) {
    newValue.to = transformVector(map, actionResponse, value, to);
  }

  if (value.type === 'SpawnEffect' && 'units' in newValue) {
    newValue.units = value.units.mapKeys((vector) =>
      transformVector(map, actionResponse, value, vector),
    );
  }

  return newValue;
}
