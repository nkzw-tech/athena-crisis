import { InstantAnimationConfig } from '@deities/athena/map/Configuration.tsx';
import MapData from '@deities/athena/MapData.tsx';
import ImmutableMap from '@nkzw/immutable-map';
import { setupLocaleContext } from 'fbtee';
import { expect, test } from 'vitest';
import { setBaseClass } from '../../behavior/Behavior.tsx';
import NullBehavior from '../../behavior/NullBehavior.tsx';
import { Animations } from '../../MapAnimations.tsx';
import { Actions, State } from '../../Types.tsx';
import addEndTurnAnimations from '../addEndTurnAnimations.tsx';

setupLocaleContext({
  availableLanguages: new Map(),
  clientLocales: [],
  loadLocale: () => Promise.resolve({}),
  translations: {},
});

setBaseClass(NullBehavior);

test('does not calculate heal and supply animations for an unknown next player', async () => {
  const map = MapData.createMap({
    config: {
      fog: true,
    },
    map: [1],
    size: { height: 1, width: 1 },
    teams: [{ id: 1, name: '', players: [{ funds: 0, id: 1, userId: '1' }] }],
  });
  let state = {
    animations: ImmutableMap() as Animations,
    currentViewer: 1,
    map,
    playerDetails: new Map(),
    vision: map.createVisionObject(1),
  } as unknown as State;
  const frameCallbacks = new Array<() => Promise<void> | void>();
  const actions = {
    requestFrame: (fn) => {
      frameCallbacks.push(() => fn(0));
    },
    update: async (newState) => {
      const nextState = typeof newState === 'function' ? newState(state) : newState;
      if (nextState) {
        state = { ...state, ...nextState };
      }
      return state;
    },
  } as Actions;

  const result = addEndTurnAnimations(
    actions,
    {
      current: { funds: 0, player: 1 },
      next: { funds: 0, player: 2 },
      round: 1,
      type: 'EndTurn',
    },
    state,
    null,
    (state) => state,
  );
  const [, animation] = result.animations!.entries().next().value!;

  expect(animation?.type).toBe('banner');
  if (animation?.type !== 'banner') {
    throw new Error('Expected a banner animation.');
  }

  animation.onComplete({
    ...state,
    animationConfig: InstantAnimationConfig,
    animations: result.animations || state.animations,
  });

  await expect(Promise.all(frameCallbacks.map((callback) => callback()))).resolves.toEqual([
    undefined,
  ]);
});
