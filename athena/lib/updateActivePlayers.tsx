import Player, { Bot, HumanPlayer, PlayerID } from '../map/Player.tsx';
import MapData from '../MapData.tsx';
import updatePlayers from './updatePlayers.tsx';

export default function updateActivePlayers(
  map: MapData,
  createBot = (player: Player) => Bot.from(player, `Bot ${player.id}`),
  currentPlayerID?: PlayerID,
  userId?: string,
) {
  const currentPlayer =
    currentPlayerID && map.active.includes(currentPlayerID)
      ? currentPlayerID
      : map.active[0];

  return map.copy({
    currentPlayer,
    teams: updatePlayers(
      map.teams,
      map
        .getPlayers()
        .map((player) =>
          player.id === currentPlayer && userId
            ? HumanPlayer.from(player, userId)
            : createBot(player),
        ),
    ).sortBy(({ id }) => map.active.indexOf(id)),
  });
}
