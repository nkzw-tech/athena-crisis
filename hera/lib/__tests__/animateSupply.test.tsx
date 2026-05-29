import { Infantry } from '@deities/athena/info/Unit.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import ImmutableMap from '@nkzw/immutable-map';
import { setupLocaleContext } from 'fbtee';
import { expect, test } from 'vitest';
import { Animations } from '../../MapAnimations.tsx';
import { State } from '../../Types.tsx';
import animateSupply from '../animateSupply.tsx';

setupLocaleContext({
  availableLanguages: new Map(),
  clientLocales: [],
  loadLocale: () => Promise.resolve({}),
  translations: {},
});

test('continues supply animations when a queued unit is missing', () => {
  const missingPosition = vec(1, 1);
  const nextPosition = vec(2, 1);
  const map = MapData.createMap({
    map: [1, 1],
    size: { height: 1, width: 2 },
    teams: [{ id: 1, name: '', players: [{ funds: 0, id: 1, userId: '1' }] }],
  });
  const state = {
    animations: ImmutableMap() as Animations,
    map,
  } as State;
  const result = animateSupply(state, [
    [missingPosition, Infantry.create(1)],
    [nextPosition, Infantry.create(1)],
  ]);
  const [scrollKey, scrollAnimation] = result.animations!.entries().next().value!;

  expect(scrollAnimation.type).toBe('scrollIntoView');
  if (scrollAnimation.type !== 'scrollIntoView') {
    throw new Error('Expected a scroll animation.');
  }

  const withFlash = scrollAnimation.onComplete({
    ...state,
    animations: result.animations!.delete(scrollKey),
  })!;
  const [flashKey, flashAnimation] = withFlash.animations!.entries().next().value!;

  expect(flashAnimation.type).toBe('flash');
  if (flashAnimation.type !== 'flash') {
    throw new Error('Expected a flash animation.');
  }

  expect(
    flashAnimation.onComplete({
      ...state,
      animations: withFlash.animations!.delete(flashKey),
    } as State),
  ).toEqual(
    expect.objectContaining({
      animations: expect.anything(),
    }),
  );
});
