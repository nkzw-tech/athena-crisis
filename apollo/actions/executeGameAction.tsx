import MapData from '@deities/athena/MapData.tsx';
import { VisionT } from '@deities/athena/Vision.tsx';
import { Action, execute, MutateActionResponseFn } from '../Action.tsx';
import { ActionResponse } from '../ActionResponse.tsx';
import { Effects } from '../Effects.tsx';
import applyConditions from '../lib/applyConditions.tsx';
import gameHasEnded from '../lib/gameHasEnded.tsx';
import { GameState } from '../Types.tsx';

type AIType = {
  act(map: MapData): MapData | null;
  retrieveEffects(): Effects;
  retrieveGameState(): GameState;
};

export type AIRegistryEntry = Readonly<{
  class: {
    new (effects: Effects): AIType;
  };
  name: string;
  published: boolean;
}>;

export type AIRegistryT = ReadonlyMap<number, AIRegistryEntry>;

export function executeAIAction(
  activeMap: MapData | null,
  AIRegistry: AIRegistryT,
  effects: Effects,
  gameState: GameState = [],
): [GameState, Effects] {
  let iterations = 0;
  const maxIterations = 100 * (activeMap?.active.length || 1);

  while (
    activeMap &&
    activeMap.active.length > 1 &&
    activeMap.getCurrentPlayer().isBot()
  ) {
    const player = activeMap.getCurrentPlayer();
    const AIClass = ((player.ai != null && AIRegistry.get(player.ai)) ||
      AIRegistry.get(0))!.class;

    const ai = new AIClass(effects);
    while (activeMap) {
      activeMap = ai.act(activeMap);
    }
    const aiGameState = ai.retrieveGameState();
    effects = ai.retrieveEffects();
    gameState = gameState.concat(aiGameState);

    if (gameHasEnded(aiGameState)) {
      break;
    }

    [, activeMap] = aiGameState.at(-1) || [null, null];

    // Escape hatch. Issue a "Draw" if the AI is in a stalemate.
    if (iterations++ >= maxIterations) {
      const state = [...gameState];
      // Prune unnecessary game states.
      for (let i = state.length - 1; i > 0; i--) {
        const [actionResponse] = state[i];
        if (
          actionResponse.type === 'EndTurn' ||
          actionResponse.type === 'CompleteUnit'
        ) {
          state.pop();
        } else {
          break;
        }
      }
      gameState = state.concat([[{ type: 'GameEnd' }, state.at(-1)![1]]]);
      break;
    }
  }
  return [gameState, effects];
}

export default function executeGameAction(
  map: MapData,
  vision: VisionT,
  effects: Effects,
  action: Action,
  AIRegistry: AIRegistryT | null,
  mutateAction?: MutateActionResponseFn,
): [ActionResponse, MapData, GameState, Effects] | [null, null, null, null] {
  const actionResult = execute(map, vision, action, mutateAction);
  if (!actionResult) {
    return [null, null, null, null];
  }
  const [actionResponse, activeMap] = actionResult;
  const [gameState, newEffects] = applyConditions(
    map,
    activeMap,
    effects,
    actionResponse,
  );
  const lastMap = gameState.at(-1)?.[1] || activeMap;
  const shouldInvokeAI = !!(
    AIRegistry &&
    !gameHasEnded(gameState) &&
    lastMap.getCurrentPlayer().isBot()
  );
  return [
    actionResponse,
    activeMap,
    ...((shouldInvokeAI &&
      executeAIAction(lastMap, AIRegistry, newEffects, gameState)) || [
      gameState,
      newEffects,
    ]),
  ];
}
