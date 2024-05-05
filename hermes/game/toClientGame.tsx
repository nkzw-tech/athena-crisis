import { ActionResponse } from '@deities/apollo/ActionResponse.tsx';
import { Effects } from '@deities/apollo/Effects.tsx';
import { GameState } from '@deities/apollo/Types.tsx';
import MapData from '@deities/athena/MapData.tsx';

export type ClientGame = Readonly<{
  effects: Effects;
  ended: boolean;
  lastAction: ActionResponse | null;
  state: MapData;
  turnState: [MapData, ActionResponse, Effects] | null;
}>;

export default function toClientGame(
  game: ClientGame,
  initialActiveMap: MapData,
  gameState: GameState,
  newEffects: Effects | null,
  actionResponse?: ActionResponse | null,
): ClientGame {
  const map = game.state;
  const [lastActionResponse, activeMap] =
    gameState && gameState.length > 0
      ? gameState.at(-1)!
      : [actionResponse, initialActiveMap];

  return {
    effects: newEffects || game.effects,
    ended: lastActionResponse?.type === 'GameEnd',
    lastAction: lastActionResponse || game.lastAction,
    state: activeMap,
    turnState:
      lastActionResponse &&
      (map.currentPlayer !== activeMap.currentPlayer ||
        map.round !== activeMap.round)
        ? [activeMap, lastActionResponse, newEffects || game.effects]
        : game?.turnState || null,
  };
}
