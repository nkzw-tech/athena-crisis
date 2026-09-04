import type { MoveActionResponse } from '@deities/apollo/ActionResponse.tsx';
import applyActionResponse from '@deities/apollo/actions/applyActionResponse.tsx';
import type { GameActionResponse } from '@deities/apollo/Types.tsx';
import { Plain } from '@deities/athena/info/Tile.tsx';
import { Infantry, SmallTank } from '@deities/athena/info/Unit.tsx';
import { InstantAnimationConfig } from '@deities/athena/map/Configuration.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { beforeEach, expect, test, vi } from 'vitest';
import { RadiusType } from '../../Radius.tsx';
import type { Actions, State } from '../../Types.tsx';
import attackAction from '../attack/attackAction.tsx';
import { setBaseClass } from '../Behavior.tsx';
import Move from '../Move.tsx';
import type { OnCompleteMoveAction } from '../move/clientMoveAction.tsx';
import getMoveableFields from '../move/getMoveableFields.tsx';
import moveAction from '../move/moveAction.tsx';

vi.mock('@deities/ui/controls/useInput.tsx', () => ({ default: vi.fn() }));
vi.mock('../attack/attackAction.tsx', () => ({ default: vi.fn() }));
vi.mock('../attack/AttackSelector.tsx', () => ({ default: () => null }));
vi.mock('../confirm/ConfirmAction.tsx', () => ({ default: () => null }));
vi.mock('../Menu.tsx', () => ({
  default: class Menu {
    type = 'menu' as const;
  },
}));
vi.mock('../move/moveAction.tsx', () => ({ default: vi.fn() }));
vi.mock('../move/syncMoveAction.tsx', () => ({ default: vi.fn() }));
vi.mock('../swap/TeleportIndicator.tsx', () => ({ default: () => null }));
vi.mock('../Transport.tsx', () => ({ default: class Transport {} }));
vi.mock('../../Radius.tsx', () => ({ RadiusType: { Move: 11 } }));

class BaseBehavior {
  type = 'base' as const;
}

setBaseClass(BaseBehavior);

const createState = () => {
  const attackerPosition = vec(2, 2);
  const targetPosition = vec(4, 2);
  const map = MapData.createMap({
    active: [8, 1],
    currentPlayer: 8,
    map: Array(6 * 6).fill(Plain.id),
    size: { height: 6, width: 6 },
    teams: [
      { id: 8, name: 'Dark Athena', players: [{ funds: 0, id: 8, userId: 'User-2' }] },
      { id: 1, name: 'Opposition', players: [{ funds: 0, id: 1, name: 'Bot' }] },
    ],
    units: [
      [attackerPosition.x, attackerPosition.y, SmallTank.create(8).toJSON()],
      [targetPosition.x, targetPosition.y, Infantry.create(1).toJSON()],
    ],
  });
  const attacker = map.units.get(attackerPosition)!;
  const vision = map.createVisionObject(8);
  const radius = {
    fields: getMoveableFields(map, vision, attacker, attackerPosition),
    path: null,
    type: RadiusType.Move,
  } as const;
  const move = new Move();
  const baseState = {
    animationConfig: InstantAnimationConfig,
    currentViewer: 8,
    map,
    radius,
    selectedPosition: attackerPosition,
    selectedUnit: attacker,
    vision,
  } as unknown as State;
  const state = {
    ...baseState,
    ...move.activate(baseState),
  } as State;

  return { attackerPosition, map, move, state, targetPosition };
};

const getMoveResponse = (
  map: MapData,
  from: ReturnType<typeof vec>,
  to: ReturnType<typeof vec>,
): MoveActionResponse => ({
  from,
  fuel: map.units.get(from)!.fuel - 1,
  to,
  type: 'Move',
});

const getResponse = (
  move: MoveActionResponse,
  others: NonNullable<GameActionResponse['others']> = [],
): GameActionResponse => ({
  others,
  self: { actionResponse: move },
});

const captureMoveCompletion = () => {
  let onComplete: OnCompleteMoveAction | null = null;
  vi.mocked(moveAction).mockImplementation((...parameters) => {
    onComplete = parameters[5];
    return {};
  });
  return () => {
    if (!onComplete) {
      throw new Error('Expected a move continuation.');
    }
    return onComplete;
  };
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

test('selecting an attack target in Move behavior keeps the Dark Athena unit selected', () => {
  const { move, state, targetPosition } = createState();
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn(() => 1),
  );

  expect(state.attackable?.has(targetPosition)).toBe(true);
  expect(move.select(targetPosition, state, {} as Actions, undefined, undefined, false)).toEqual({
    confirmAction: null,
  });
});

test('opens the moved unit menu when effects follow the Move response', () => {
  const { attackerPosition, map, move, state } = createState();
  const target = vec(2, 3);
  const getOnComplete = captureMoveCompletion();

  move.select(target, state, {} as Actions, undefined, undefined, false);

  const moveResponse = getMoveResponse(map, attackerPosition, target);
  const finalMap = applyActionResponse(map, state.vision, moveResponse);
  const gameActionResponse = getResponse(moveResponse, [
    {
      actionResponse: { player: 8, time: 100, type: 'SetPlayerTime' },
    },
  ]);
  const result = getOnComplete()(
    {
      ...state,
      lastActionResponse: gameActionResponse.others![0].actionResponse,
      map: finalMap,
    },
    moveResponse,
    gameActionResponse,
  ) as State;

  expect(result.behavior?.type).toBe('menu');
  expect(result.selectedPosition).toEqual(target);
  expect(result.selectedUnit).toBe(finalMap.units.get(target));
});

test('deselects the moved unit after a Swap effect', () => {
  const { attackerPosition, map, move, state } = createState();
  const target = vec(2, 3);
  const swappedTarget = vec(5, 5);
  const getOnComplete = captureMoveCompletion();

  move.select(target, state, {} as Actions, undefined, undefined, false);

  const moveResponse = getMoveResponse(map, attackerPosition, target);
  const movedMap = applyActionResponse(map, state.vision, moveResponse);
  const swapResponse = {
    source: target,
    sourceUnit: movedMap.units.get(target)!,
    target: swappedTarget,
    type: 'Swap',
  } as const;
  const finalMap = applyActionResponse(movedMap, state.vision, swapResponse);
  const gameActionResponse = getResponse(moveResponse, [
    { actionResponse: swapResponse },
    { actionResponse: { player: 8, time: 100, type: 'SetPlayerTime' } },
  ]);
  const result = getOnComplete()(
    { ...state, map: finalMap },
    moveResponse,
    gameActionResponse,
  ) as State;

  expect(result.behavior?.type).toBe('base');
  expect(result.selectedPosition).toBeNull();
  expect(result.selectedUnit).toBeNull();
});

test('does not open a move continuation after the game ends', () => {
  const { attackerPosition, map, move, state } = createState();
  const target = vec(2, 3);
  const getOnComplete = captureMoveCompletion();

  move.select(target, state, {} as Actions, undefined, undefined, false);

  const moveResponse = getMoveResponse(map, attackerPosition, target);
  const finalMap = applyActionResponse(map, state.vision, moveResponse);
  const gameActionResponse = getResponse(moveResponse, [{ actionResponse: { type: 'GameEnd' } }]);
  const result = getOnComplete()(
    { ...state, map: finalMap },
    moveResponse,
    gameActionResponse,
  ) as State;

  expect(result.behavior?.type).toBe('base');
  expect(result.selectedUnit).toBeNull();
});

test('revalidates a move-and-attack against the final map', async () => {
  const { attackerPosition, map, move, state, targetPosition } = createState();
  const getOnComplete = captureMoveCompletion();
  const actions = { update: vi.fn() } as unknown as Actions;
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    }),
  );

  move.select(targetPosition, state, actions, undefined, undefined, false);

  const moveTarget = vec(3, 2);
  const moveResponse = getMoveResponse(map, attackerPosition, moveTarget);
  const movedMap = applyActionResponse(map, state.vision, moveResponse);
  const gameActionResponse = getResponse(moveResponse, [
    { actionResponse: { player: 8, time: 100, type: 'SetPlayerTime' } },
  ]);
  const finalState = { ...state, map: movedMap };

  const result = getOnComplete()(finalState, moveResponse, gameActionResponse) as State;
  await vi.waitFor(() => expect(attackAction).toHaveBeenCalledOnce());

  expect(result.selectedPosition).toEqual(moveTarget);
  expect(attackAction).toHaveBeenCalledWith(
    actions,
    moveTarget,
    movedMap.units.get(moveTarget),
    targetPosition,
    movedMap.units.get(targetPosition),
    finalState,
  );
});

test('cancels a move-and-attack when an effect removes the target', async () => {
  const { attackerPosition, map, move, state, targetPosition } = createState();
  const getOnComplete = captureMoveCompletion();
  const actions = { update: vi.fn() } as unknown as Actions;
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    }),
  );

  move.select(targetPosition, state, actions, undefined, undefined, false);

  const moveTarget = vec(3, 2);
  const moveResponse = getMoveResponse(map, attackerPosition, moveTarget);
  const movedMap = applyActionResponse(map, state.vision, moveResponse).copy({
    units: map.units
      .delete(attackerPosition)
      .delete(targetPosition)
      .set(moveTarget, applyActionResponse(map, state.vision, moveResponse).units.get(moveTarget)!),
  });
  const result = getOnComplete()(
    { ...state, map: movedMap },
    moveResponse,
    getResponse(moveResponse),
  ) as State;
  await Promise.resolve();

  expect(result.behavior?.type).toBe('base');
  expect(attackAction).not.toHaveBeenCalled();
});
