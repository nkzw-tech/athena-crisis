import { Infantry } from '@deities/athena/info/Unit.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import vec from '@deities/athena/map/vec.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import { SizeVector } from '@deities/athena/MapData.tsx';
import ImmutableMap from '@nkzw/immutable-map';
import { expect, test } from 'vitest';
import { MoveAction } from '../action-mutators/ActionMutators.tsx';
import type { Action } from '../Action.tsx';
import type { Effects } from '../Effects.tsx';
import resizeEffects from '../lib/resizeEffects.tsx';
import { RelativeVectors } from '../lib/transformEffectValue.tsx';

const getAction = (effects: Effects): Action => {
  const effect = effects.get('Start')?.values().next().value;
  const action = effect?.actions[0];
  if (!action) {
    throw new Error('Expected a resized action.');
  }
  return action;
};

test('resizeEffects drops cropped spawn positions without treating them as relative vectors', () => {
  const unit = Infantry.create(1);
  const relativeUnit = Infantry.create(2);
  const effects = new Map([
    [
      'Start',
      new Set([
        {
          actions: [
            {
              type: 'SpawnEffect',
              units: ImmutableMap<Vector, Unit>()
                .set(RelativeVectors.Source, relativeUnit)
                .set(vec(1, 1), unit)
                .set(vec(1, 4), unit)
                .set(vec(3, 3), unit),
            },
          ],
        },
      ]),
    ],
  ]) satisfies Effects;

  const action = getAction(
    resizeEffects(effects, new SizeVector(4, 4), new SizeVector(2, 2), new Set(['left', 'top'])),
  );

  expect(action).toMatchObject({ type: 'SpawnEffect' });
  if (action.type !== 'SpawnEffect') {
    throw new Error('Expected SpawnEffect action.');
  }
  expect(action.units.has(vec(-1, 2))).toBe(false);
  expect(action.units.size).toBe(2);
  expect(action.units.get(vec(1, 1))).toBe(unit);
  expect(action.units.get(RelativeVectors.Source)).toBe(relativeUnit);
});

test('resizeEffects resizes stored Move paths with their endpoints', () => {
  const effects = new Map([
    [
      'Start',
      new Set([
        {
          actions: [MoveAction(vec(2, 2), vec(4, 2), [vec(3, 2), vec(4, 2)])],
        },
      ]),
    ],
  ]) satisfies Effects;

  const action = getAction(
    resizeEffects(effects, new SizeVector(4, 4), new SizeVector(3, 3), new Set(['left', 'top'])),
  );

  expect(action).toMatchObject({
    from: vec(1, 1),
    path: [vec(2, 1), vec(3, 1)],
    to: vec(3, 1),
    type: 'Move',
  });
});
