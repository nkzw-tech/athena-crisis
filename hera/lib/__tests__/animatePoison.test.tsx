import { Infantry } from '@deities/athena/info/Unit.tsx';
import { PoisonDamage } from '@deities/athena/map/Configuration.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import ImmutableMap from '@nkzw/immutable-map';
import { setupLocaleContext } from 'fbtee';
import { expect, test } from 'vitest';
import { setBaseClass } from '../../behavior/Behavior.tsx';
import NullBehavior from '../../behavior/NullBehavior.tsx';
import { State, StateLike } from '../../Types.tsx';
import animatePoison from '../animatePoison.tsx';

setBaseClass(NullBehavior);

setupLocaleContext({
  availableLanguages: new Map(),
  clientLocales: [],
  loadLocale: () => Promise.resolve({}),
  translations: {},
});

const applyStateLike = (state: State, stateLike: StateLike | null | undefined): State =>
  stateLike ? ({ ...state, ...stateLike } as State) : state;

const completeNextAnimation = (state: State): State => {
  const item = state.animations.entries().next().value;
  expect(item).toBeDefined();

  const [position, animation] = item!;
  if (!('onComplete' in animation) || !animation.onComplete) {
    throw new Error(`Animation '${animation.type}' does not have an onComplete callback.`);
  }

  const nextState = {
    ...state,
    animations: state.animations.delete(position),
  } as State;
  return applyStateLike(nextState, animation.onComplete(nextState));
};

test('animatePoison continues when a unit is missing before the flash completes', () => {
  const position = vec(1, 1);
  const unit = Infantry.create(1).setHealth(50);
  const map = MapData.createMap({
    map: [1],
    size: { height: 1, width: 1 },
    teams: [{ id: 1, name: '', players: [{ funds: 0, id: 1, userId: '1' }] }],
  }).copy({
    units: ImmutableMap([[position, unit]]),
  });
  const state = {
    animations: ImmutableMap(),
    map,
    vision: map.createVisionObject(1),
  } as State;
  let completed = false;

  const stateWithScroll = applyStateLike(
    state,
    animatePoison(state, [[position, unit]], () => {
      completed = true;
      return null;
    }),
  );
  const stateWithFlash = completeNextAnimation(stateWithScroll);
  const stateWithoutUnit = {
    ...stateWithFlash,
    map: stateWithFlash.map.copy({
      units: stateWithFlash.map.units.delete(position),
    }),
  } as State;
  const finalState = completeNextAnimation(stateWithoutUnit);

  expect(completed).toBe(true);
  expect(finalState.map.units.get(position)).toBeUndefined();
});

test('animatePoison damages a unit that is still present', () => {
  const position = vec(1, 1);
  const unit = Infantry.create(1).setHealth(50);
  const map = MapData.createMap({
    map: [1],
    size: { height: 1, width: 1 },
    teams: [{ id: 1, name: '', players: [{ funds: 0, id: 1, userId: '1' }] }],
  }).copy({
    units: ImmutableMap([[position, unit]]),
  });
  const state = {
    animations: ImmutableMap(),
    map,
    vision: map.createVisionObject(1),
  } as State;

  const stateWithScroll = applyStateLike(state, animatePoison(state, [[position, unit]]));
  const stateWithFlash = completeNextAnimation(stateWithScroll);
  const finalState = completeNextAnimation(stateWithFlash);

  expect(finalState.map.units.get(position)?.health).toBe(50 - PoisonDamage);
});
