import Building from '@deities/athena/map/Building.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import Vector, { isVector } from '@deities/athena/map/Vector.tsx';
import { SizeVector } from '@deities/athena/MapData.tsx';
import ImmutableMap from '@nkzw/immutable-map';
import type { Action, SpawnEffectAction } from '../Action.tsx';
import type { Condition } from '../Condition.tsx';
import { Effects } from '../Effects.tsx';
import type { ResizeOrigin } from './resizeMap.tsx';
import { RelativeVectors } from './transformEffectValue.tsx';

type Mutable<T> = { -readonly [Key in keyof T]: T[Key] };
type ValueWithVectors<T> = Mutable<T> & {
  from?: Vector | null;
  path?: ReadonlyArray<Vector>;
  to?: Vector | null;
};

const RelativeVectorSet = new Set<Vector>(Object.values(RelativeVectors));

const isRelativeVector = (vector: Vector) => RelativeVectorSet.has(vector);

const resizeVector = (vector: Vector, offsetX: number, offsetY: number) =>
  isRelativeVector(vector) ? vector : vector.left(offsetX).up(offsetY);

const resizeEntityMap = <T extends Unit | Building>(
  entities: ImmutableMap<Vector, T>,
  size: SizeVector,
  offsetX: number,
  offsetY: number,
) => {
  let newEntities = ImmutableMap<Vector, T>();

  for (const [vector, entity] of entities) {
    if (isRelativeVector(vector)) {
      newEntities = newEntities.set(vector, entity);
      continue;
    }

    const newVector = resizeVector(vector, offsetX, offsetY);
    if (size.contains(newVector)) {
      newEntities = newEntities.set(newVector, entity);
    }
  }

  return newEntities;
};

const resizeValue = <T extends Action | Condition>(
  value: T,
  size: SizeVector,
  offsetX: number,
  offsetY: number,
): T => {
  const newValue = { ...value } as ValueWithVectors<T>;

  if (isVector(newValue.from)) {
    newValue.from = resizeVector(newValue.from, offsetX, offsetY);
  }

  if (isVector(newValue.to)) {
    newValue.to = resizeVector(newValue.to, offsetX, offsetY);
  }

  if (value.type === 'Move' && newValue.type === 'Move' && value.path) {
    newValue.path = value.path.map((vector) => resizeVector(vector, offsetX, offsetY));
  }

  if (value.type === 'SpawnEffect' && newValue.type === 'SpawnEffect') {
    const spawnEffect = value as SpawnEffectAction;
    const newSpawnEffect = newValue as unknown as Mutable<SpawnEffectAction>;
    newSpawnEffect.units = resizeEntityMap(spawnEffect.units, size, offsetX, offsetY);
    if (spawnEffect.buildings) {
      newSpawnEffect.buildings = resizeEntityMap(spawnEffect.buildings, size, offsetX, offsetY);
    }
  }

  return newValue;
};

export default function resizeEffects(
  effects: Effects,
  previousSize: SizeVector,
  size: SizeVector,
  origin: Set<ResizeOrigin>,
) {
  const offsetX = origin.has('left') ? previousSize.width - size.width : 0;
  const offsetY = origin.has('top') ? previousSize.height - size.height : 0;
  return new Map(
    [...effects].map(([trigger, effectList]) => [
      trigger,
      new Set(
        [...effectList].map((effect) => ({
          ...effect,
          actions: [...effect.actions].map((action) => resizeValue(action, size, offsetX, offsetY)),
          conditions: effect.conditions?.map((condition) =>
            resizeValue(condition, size, offsetX, offsetY),
          ),
        })),
      ),
    ]),
  );
}
