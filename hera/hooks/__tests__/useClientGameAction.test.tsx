import { CompleteUnitAction, MoveAction } from '@deities/apollo/action-mutators/ActionMutators.tsx';
import { execute } from '@deities/apollo/Action.tsx';
import applyActionResponse from '@deities/apollo/actions/applyActionResponse.tsx';
import { decodeEffects, Effects, encodeEffects } from '@deities/apollo/Effects.tsx';
import { decodeAction, encodeActionResponse } from '@deities/apollo/EncodedActions.tsx';
import { encodeGameState } from '@deities/apollo/GameState.tsx';
import type { GameActionResponse, GameState } from '@deities/apollo/Types.tsx';
import { Infantry } from '@deities/athena/info/Unit.tsx';
import { InstantAnimationConfig } from '@deities/athena/map/Configuration.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import type { ClientGame } from '@deities/hermes/game/toClientGame.tsx';
import ImmutableMap from '@nkzw/immutable-map';
import type { RefObject } from 'react';
import { beforeEach, expect, test, vi } from 'vitest';
import { setBaseClass } from '../../behavior/Behavior.tsx';
import moveAction from '../../behavior/move/moveAction.tsx';
import type { Actions, State } from '../../Types.tsx';
import type { ClientGameActionRequest, ClientGameActionResponse } from '../../workers/Types.tsx';
import useClientGameAction from '../useClientGameAction.tsx';

type Request = { message: ClientGameActionRequest; port: MessagePort };

const harness = vi.hoisted(() => ({
  cursor: 0,
  effects: [] as Array<() => void>,
  refs: [] as Array<RefObject<unknown>>,
  requests: [] as Array<Request>,
  rerender: false,
}));

vi.mock('react', async () => ({
  ...(await vi.importActual('react')),
  useCallback: (callback: unknown) => callback,
  useLayoutEffect: (effect: () => void) => harness.effects.push(effect),
  useRef: (value: unknown) => {
    const index = harness.cursor++;
    return harness.refs[index] || (harness.refs[index] = { current: value });
  },
  useState: (initialValue: unknown) => {
    const index = harness.cursor++;
    const state =
      harness.refs[index] ||
      (harness.refs[index] = {
        current: typeof initialValue === 'function' ? initialValue() : initialValue,
      });
    return [
      state.current,
      (value: unknown) => {
        state.current = typeof value === 'function' ? value(state.current) : value;
        harness.rerender = true;
      },
    ];
  },
}));
vi.mock('@deities/ui/lib/captureException.tsx', () => ({ default: vi.fn() }));
vi.mock('../../workers/gameAction.tsx?worker', () => ({
  default: class Worker {
    postMessage(message: ClientGameActionRequest, [port]: [MessagePort]) {
      harness.requests.push({ message, port });
    }
  },
}));

beforeEach(() => {
  harness.cursor = 0;
  harness.effects = [];
  harness.refs = [];
  harness.requests = [];
  setBaseClass(
    class Base {
      public readonly type = 'base' as const;
    },
  );
});

function createGame(): ClientGame {
  const map = MapData.createMap({
    map: Array(5 * 3).fill(1),
    size: { height: 3, width: 5 },
    teams: [
      { id: 1, name: '', players: [{ funds: 1000, id: 1, userId: '1' }] },
      { id: 2, name: '', players: [{ funds: 1000, id: 2, userId: '2' }] },
    ],
    units: [
      [1, 1, Infantry.create(1).toJSON()],
      [3, 1, Infantry.create(1).toJSON()],
      [5, 1, Infantry.create(1).toJSON()],
      [5, 3, Infantry.create(2).toJSON()],
    ],
  });
  return {
    effects: new Map(),
    ended: false,
    lastAction: { type: 'Start' },
    state: map,
    turnState: [map, { type: 'Start' }, new Map(), []],
  };
}

function createHook(game: ClientGame) {
  const setGame = vi.fn<(game: ClientGame) => void>();
  const onError = vi.fn();
  const onGameAction = vi.fn(async () => null);
  const render = (game: ClientGame | null) => {
    let onAction: ReturnType<typeof useClientGameAction>;
    do {
      harness.cursor = 0;
      harness.effects = [];
      harness.rerender = false;
      // oxlint-disable-next-line react-hooks/rules-of-hooks -- This harness preserves hook state and flushes layout effects at commit.
      onAction = useClientGameAction(game, setGame, onGameAction, onError);
    } while (harness.rerender);
    for (const effect of harness.effects.splice(0)) {
      effect();
    }
    return onAction;
  };
  return { onAction: render(game), onError, onGameAction, render, setGame };
}

async function getRequest(index: number) {
  await vi.waitFor(() => expect(harness.requests.length).toBeGreaterThan(index));
  return harness.requests[index];
}

function finish(request: Request, effects?: Effects, followUp?: (map: MapData) => GameState) {
  const map = MapData.fromObject(request.message[0]);
  const result = execute(map, map.createVisionObject(1), decodeAction(request.message[2]));
  expect(result).not.toBeNull();
  const [response, newMap] = result!;
  request.port.postMessage([
    encodeActionResponse(response),
    newMap.toJSON(),
    encodeGameState(followUp?.(newMap) || []),
    effects ? encodeEffects(effects) : null,
  ] satisfies ClientGameActionResponse);
  request.port.close();
}

test.each([false, true])(
  'Move & Wait stays optimistic and preserves queued moves (render: %s)',
  async (render) => {
    const game = createGame();
    const hook = createHook(game);
    if (render) {
      hook.setGame.mockImplementation((game) => {
        hook.render(game);
      });
    }
    let state = {
      animationConfig: InstantAnimationConfig,
      animations: ImmutableMap(),
      map: game.state,
      vision: game.state.createVisionObject(1),
    } as unknown as State;
    const responses: Array<Promise<GameActionResponse>> = [];
    const actions = {
      action: (state, action) => {
        const [response, map] = execute(state.map, state.vision, action)!;
        const pending = hook.onAction(action);
        responses.push(pending);
        return [pending, map, response];
      },
      processGameActionResponse: async () => state,
      requestFrame: (callback) => queueMicrotask(() => callback(0)),
      throwError: hook.onError,
      update: async (change) => {
        state = { ...state, ...(typeof change === 'function' ? change(state) : change) };
        return state;
      },
    } satisfies Partial<Actions> as unknown as Actions;
    await actions.update(
      moveAction(
        actions,
        vec(1, 1),
        vec(1, 2),
        new Map(),
        state,
        () => null,
        [vec(1, 2)],
        undefined,
        undefined,
        true,
      ),
    );
    const first = await getRequest(0);
    const animation = state.animations.get(vec(1, 1))!;
    if (animation.type !== 'move') {
      throw new Error('Expected a movement animation.');
    }
    await actions.update(animation.onComplete!({ ...state, animations: ImmutableMap() }));
    expect(state.behavior?.type).toBe('base');
    expect(hook.setGame).not.toHaveBeenCalled();

    const [, optimisticMap] = actions.action(state, MoveAction(vec(3, 1), vec(3, 2), [vec(3, 2)]));
    await actions.update({ map: optimisticMap });
    expect(state.map.units.has(vec(1, 2))).toBe(true);
    expect(state.map.units.has(vec(3, 2))).toBe(true);
    expect(harness.requests).toHaveLength(1);

    finish(first);
    const second = await getRequest(1);
    finish(second);
    await Promise.all(responses);
    expect(hook.onError).not.toHaveBeenCalled();
    const result = hook.setGame.mock.calls.at(-1)![0];
    expect(result.state.units.toJSON()).toEqual(state.map.units.toJSON());
    expect(result.turnState?.[3]).toHaveLength(2);
  },
);

test('a burst of Wait commands accumulates without requiring a React render', async () => {
  const hook = createHook(createGame());
  const pending = [1, 3, 5].map((x) => hook.onAction(CompleteUnitAction(vec(x, 1))));
  for (let i = 0; i < pending.length; i++) {
    finish(await getRequest(i));
    await pending[i];
  }
  const result = hook.setGame.mock.calls.at(-1)![0];
  expect([1, 3, 5].map((x) => result.state.units.get(vec(x, 1))?.isCompleted())).toEqual([
    true,
    true,
    true,
  ]);
  expect(result.turnState?.[3]).toHaveLength(3);
  expect(hook.onError).not.toHaveBeenCalled();
});

test('delayed renders of previously published games do not rewind the queue', async () => {
  const initialGame = createGame();
  const hook = createHook(initialGame);
  const first = hook.onAction(CompleteUnitAction(vec(1, 1)));
  finish(await getRequest(0));
  await first;
  const firstGame = hook.setGame.mock.calls[0][0];
  const second = hook.onAction(CompleteUnitAction(vec(3, 1)));
  finish(await getRequest(1));
  await second;
  hook.render(initialGame);
  const third = hook.render(firstGame)(CompleteUnitAction(vec(5, 1)));
  finish(await getRequest(2));
  await third;
  const result = hook.setGame.mock.calls.at(-1)![0];
  expect([1, 3, 5].map((x) => result.state.units.get(vec(x, 1))?.isCompleted())).toEqual([
    true,
    true,
    true,
  ]);
});

test('a replacement game cannot be overwritten by an old worker response', async () => {
  const hook = createHook(createGame());
  const oldAction = hook.onAction(CompleteUnitAction(vec(1, 1)));
  const oldRequest = await getRequest(0);
  const queuedOldAction = hook.onAction(CompleteUnitAction(vec(3, 1)));
  const replacement = createGame();
  const newAction = hook.render(replacement)(CompleteUnitAction(vec(5, 1)));
  const newRequest = await getRequest(1);
  finish(newRequest);
  await newAction;
  finish(oldRequest);
  await oldAction;
  finish(await getRequest(2));
  await queuedOldAction;
  expect(hook.setGame).toHaveBeenCalledOnce();
  expect(hook.onGameAction).toHaveBeenCalledOnce();
  const result = hook.setGame.mock.calls[0][0];
  expect(result.state.units.get(vec(1, 1))?.isCompleted()).toBe(false);
  expect(result.state.units.get(vec(5, 1))?.isCompleted()).toBe(true);
  expect(hook.onError).not.toHaveBeenCalled();
});

test('queued commands inherit effects, funds, and turn history from the previous result', async () => {
  const hook = createHook(createGame());
  const first = hook.onAction(MoveAction(vec(1, 1), vec(1, 2), [vec(1, 2)], true));
  const second = hook.onAction(CompleteUnitAction(vec(3, 1)));
  const effects: Effects = new Map([
    ['Move', new Set([{ actions: [{ funds: 25, player: 1, type: 'IncreaseFundsEffect' }] }])],
  ]);
  finish(await getRequest(0), effects, (map) => {
    const response = { funds: 500, player: 1, type: 'IncreaseFunds' } as const;
    return [[response, applyActionResponse(map, map.createVisionObject(1), response)]];
  });
  await first;
  const request = await getRequest(1);
  expect(MapData.fromObject(request.message[0]).getCurrentPlayer().funds).toBe(1500);
  expect(decodeEffects(request.message[1])).toEqual(effects);
  expect(request.message[4]).toBe(true);
  finish(request, effects);
  await second;
  const result = hook.setGame.mock.calls.at(-1)![0];
  expect(result.effects).toEqual(effects);
  expect(result.turnState?.[3]).toHaveLength(2);
});

test('replacing the game while postprocessing is pending suppresses the old publication', async () => {
  const hook = createHook(createGame());
  let release!: () => void;
  hook.onGameAction.mockImplementationOnce(
    () =>
      new Promise<null>((resolve) => {
        release = () => resolve(null);
      }),
  );
  const pending = hook.onAction(CompleteUnitAction(vec(1, 1)));
  finish(await getRequest(0));
  await vi.waitFor(() => expect(hook.onGameAction).toHaveBeenCalledOnce());
  hook.render(createGame());
  release();
  await pending;
  expect(hook.setGame).not.toHaveBeenCalled();
  expect(hook.onError).not.toHaveBeenCalled();
});
