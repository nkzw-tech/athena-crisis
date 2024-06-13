import { ActionResponse } from '@deities/apollo/ActionResponse.tsx';
import { Effects } from '@deities/apollo/Effects.tsx';
import { GameState } from '@deities/apollo/Types.tsx';
import MapData from '@deities/athena/MapData.tsx';
import getTurnState, { PreviousGameState } from './getTurnState.tsx';

export type ClientGame = Readonly<{
  effects: Effects;
  ended: boolean;
  lastAction: ActionResponse | null;
  state: MapData;
  turnState: PreviousGameState<MapData> | null;
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
  const ended = lastActionResponse?.type === 'GameEnd';

  return {
    effects: newEffects || game.effects,
    ended,
    lastAction: lastActionResponse || game.lastAction,
    state: activeMap,
    turnState: getTurnState(
      map,
      activeMap,
      newEffects || game.effects,
      game.turnState || null,
      actionResponse?.type === 'Start',
      ended,
      lastActionResponse || null,
    ),
  };
}
