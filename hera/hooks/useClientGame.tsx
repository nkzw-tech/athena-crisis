import { ActionResponse } from '@deities/apollo/ActionResponse.tsx';
import { Effects } from '@deities/apollo/Effects.tsx';
import mapWithAIPlayers from '@deities/apollo/lib/mapWithAIPlayers.tsx';
import startGame from '@deities/athena/lib/startGame.tsx';
import updatePlayer from '@deities/athena/lib/updatePlayer.tsx';
import { HumanPlayer } from '@deities/athena/map/Player.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { ClientGame } from '@deities/hermes/game/toClientGame.tsx';
import undo, { UndoType } from '@deities/hermes/game/undo.tsx';
import { useCallback, useState } from 'react';

const prepareMap = (map: MapData, userId: string) =>
  startGame(
    mapWithAIPlayers(
      map.copy({
        teams: updatePlayer(map.teams, HumanPlayer.from(map.getCurrentPlayer(), userId)),
      }),
    ),
  );

export default function useClientGame(
  map: MapData,
  userId: string,
  effects: Effects,
  lastAction: ActionResponse | null,
): [game: ClientGame, setGame: (game: ClientGame) => void, undo: (type: UndoType) => void] {
  const [game, setGame] = useState<ClientGame>(() => {
    const state = prepareMap(map, userId);
    return {
      effects,
      ended: false,
      lastAction,
      state,
      turnState: [state, lastAction || { type: 'Start' }, effects, []],
    };
  });

  return [game, setGame, useCallback((type: UndoType) => setGame(undo(game, type)), [game])];
}
