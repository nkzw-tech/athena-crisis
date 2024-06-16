import {
  PlayerIDs,
  PlayerIDSet,
  toPlayerIDs,
} from '@deities/athena/map/Player.tsx';
import MapData from '@deities/athena/MapData.tsx';
import isPresent from '@deities/hephaestus/isPresent.tsx';
import { Action, Actions, executeEffect } from './Action.tsx';
import { ActionResponse, ActionResponseType } from './ActionResponse.tsx';
import validateAction from './actions/validateAction.tsx';
import {
  Conditions,
  evaluateCondition,
  validateCondition,
} from './Condition.tsx';
import {
  decodeActionID,
  decodeActions,
  decodeCondition,
  encodeActionID,
  encodeActions,
  encodeCondition,
  EncodedActionResponseType,
  EncodedActions,
  EncodedConditions,
} from './EncodedActions.tsx';
import transformEffectValue from './lib/transformEffectValue.tsx';
import { GameStateWithEffects } from './Types.tsx';

export type Effect = Readonly<{
  actions: Actions;
  conditions?: Conditions;
  occurrence?: 'once';
  players?: PlayerIDSet;
}>;

export type EffectTrigger = ActionResponseType;
export type Scenario = Readonly<{ effect: Effect; trigger: EffectTrigger }>;
export type Effects = ReadonlyMap<EffectTrigger, ReadonlySet<Effect>>;

type EncodedEffect = [
  actions: EncodedActions,
  conditions?: EncodedConditions | null,
  players?: PlayerIDs | null,
  occurrence?: 1 | null,
];
export type EncodedEffects = ReadonlyArray<
  [EncodedActionResponseType, ReadonlyArray<EncodedEffect>]
>;

const applyActions = (
  map: MapData | null,
  lastActionResponse: ActionResponse,
  actions: Actions,
  effects: Effects,
): GameStateWithEffects => {
  const newGameState = [];
  let actionResponse: ActionResponse | null;
  for (const action of actions) {
    try {
      [actionResponse, map] = (map &&
        executeEffect(
          map,
          map.createVisionObject(map.currentPlayer),
          transformEffectValue(map, lastActionResponse, action),
        )) || [null, null];
      if (actionResponse && map) {
        newGameState.push([actionResponse, map, effects] as const);
      } else {
        return [];
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error(`applyActions: Could not apply Effect Actions.`, error);
      }
      return [];
    }
  }
  return newGameState;
};

export function applyEffects(
  previousMap: MapData,
  activeMap: MapData,
  effects: Effects,
  actionResponse: ActionResponse,
): GameStateWithEffects | null {
  const trigger = actionResponse.type;
  const possibleEffects = effects.get(trigger);
  if (!possibleEffects) {
    return actionResponse.type === 'Start'
      ? [[{ type: 'BeginGame' }, activeMap, effects]]
      : null;
  }

  let gameState: GameStateWithEffects = [];
  for (const effect of possibleEffects) {
    const { actions, conditions, occurrence, players } = effect;
    if (
      (!players || players.has(activeMap.currentPlayer)) &&
      (!conditions?.length ||
        conditions.every((condition) =>
          evaluateCondition(previousMap, activeMap, actionResponse, condition),
        ))
    ) {
      if (occurrence === 'once') {
        const newEffects = new Map(effects);
        const list = new Set(possibleEffects);
        list.delete(effect);
        if (list.size) {
          newEffects.set(trigger, list);
        } else {
          newEffects.delete(trigger);
        }
        effects = newEffects;
      }
      gameState = [
        ...gameState,
        ...applyActions(activeMap, actionResponse, actions, effects),
      ];
      const lastMap = gameState.at(-1)?.[1];
      previousMap =
        gameState.at(-2)?.[1] || (lastMap ? activeMap : previousMap);
      activeMap = lastMap || activeMap;
    }
  }

  if (actionResponse.type === 'Start') {
    gameState = [...gameState, [{ type: 'BeginGame' }, activeMap, effects]];
  }

  return gameState?.length ? gameState : null;
}

function encodeEffect({
  actions,
  conditions,
  occurrence,
  players,
}: Effect): EncodedEffect {
  return removeNull([
    encodeActions(actions),
    conditions?.map(encodeCondition) || null,
    players?.size ? [...players] : null,
    occurrence === 'once' ? 1 : null,
  ]);
}

const removeNull = <T extends EncodedEffect>(array: T): T => {
  let index = array.length - 1;
  while (array[index as number] == null) {
    index--;
  }
  array.length = (index + 1) as typeof array.length;
  return array;
};

export function encodeEffects(effects: Effects): EncodedEffects {
  return [...effects].map(([trigger, list]) => [
    encodeActionID(trigger),
    [...list].map(encodeEffect),
  ]);
}

export function decodeEffect(encodedEffect: EncodedEffect): Effect {
  return {
    actions: decodeActions(encodedEffect[0]),
    conditions: encodedEffect[1]?.map(decodeCondition),
    occurrence: encodedEffect[3] === 1 ? 'once' : undefined,
    players: encodedEffect[2] ? new Set(encodedEffect[2]) : undefined,
  };
}

export function decodeEffects(encodedEffects: EncodedEffects): Effects {
  return new Map(
    encodedEffects.map(([trigger, list]) => [
      decodeActionID(trigger),
      new Set(list.map(decodeEffect)),
    ]),
  );
}

const spawnEffectsOnGameEnd = (trigger: EffectTrigger, action: Action) =>
  trigger !== 'GameEnd' || action.type !== 'SpawnEffect';

export function validateEffects(map: MapData, effects: Effects): Effects {
  const newEffects = new Map();

  for (const [trigger, effectList] of effects) {
    encodeActionID(trigger);

    const newEffectList = [];
    for (const { actions, conditions, occurrence, players } of effectList) {
      const newActions = actions
        .map((action) => validateAction(map, action))
        .filter(isPresent)
        .filter(spawnEffectsOnGameEnd.bind(null, trigger));

      const newConditions = conditions?.filter(
        validateCondition.bind(null, map),
      );

      if (newActions.length) {
        newEffectList.push({
          actions: newActions,
          conditions: newConditions,
          occurrence: occurrence === 'once' ? occurrence : undefined,
          players: players ? new Set(toPlayerIDs([...players])) : undefined,
        });
      }
    }

    if (newEffectList.length) {
      newEffects.set(trigger, new Set(newEffectList));
    }
  }

  return newEffects;
}
