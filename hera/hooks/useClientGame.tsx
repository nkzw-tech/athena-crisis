import type { ActionResponse } from '@deities/apollo/ActionResponse.tsx';
import type { Effects } from '@deities/apollo/Effects.tsx';
import mapWithAIPlayers from '@deities/apollo/lib/mapWithAIPlayers.tsx';
import startGame from '@deities/athena/lib/startGame.tsx';
import updatePlayer from '@deities/athena/lib/updatePlayer.tsx';
import { HumanPlayer } from '@deities/athena/map/Player.tsx';
import type MapData from '@deities/athena/MapData.tsx';
import type { ClientGame } from '@deities/hermes/game/toClientGame.tsx';
import { useCallback, useState } from 'react';

const prepareMap = (map: MapData, userId: string) =>
  startGame(
    mapWithAIPlayers(
      map.copy({
        teams: updatePlayer(
          map.teams,
          HumanPlayer.from(map.getCurrentPlayer(), userId),
        ),
      }),
    ),
  );

export default function useClientGame(
  map: MapData,
  userId: string,
  effects: Effects,
  lastAction: ActionResponse | null,
): [
  game: ClientGame,
  setGame: (game: ClientGame) => void,
  undoTurn: () => void,
] {
  const [game, setGame] = useState<ClientGame>(() => {
    const state = prepareMap(map, userId);
    return {
      effects,
      ended: false,
      lastAction,
      state,
      turnState: [state, lastAction || { type: 'Start' }, effects],
    };
  });

  return [
    game,
    setGame,
    useCallback(() => {
      if (!game.turnState || !game.state.getCurrentPlayer().isHumanPlayer()) {
        return;
      }

      const [state, lastAction, effects] = game.turnState;
      setGame({
        ...game,
        effects,
        lastAction,
        state,
      });
    }, [game]),
  ];
}
