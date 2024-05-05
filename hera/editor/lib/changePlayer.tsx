import updatePlayers from '@deities/athena/lib/updatePlayers.tsx';
import {
  HumanPlayer,
  PlaceholderPlayer,
  PlayerID,
} from '@deities/athena/map/Player.tsx';
import Team from '@deities/athena/map/Team.tsx';
import ImmutableMap from '@nkzw/immutable-map';
import { Actions, State } from '../../Types.tsx';

export default async function changePlayer(
  state: State,
  { update }: Actions,
  id: PlayerID,
): Promise<State> {
  const { map } = state;
  let { teams } = map;

  const current = map.getCurrentPlayer();
  const userId = (current.isHumanPlayer() && current.userId) || String(-id);
  const newCurrentPlayer = PlaceholderPlayer.from(map.getCurrentPlayer());
  const existingPlayer = map.maybeGetPlayer(id);
  const player = new HumanPlayer(
    id,
    userId,
    existingPlayer?.teamId || id,
    0,
    existingPlayer?.skills || new Set(),
    new Set(),
    existingPlayer?.charge || 0,
    null,
    0,
  );

  if (id === 0 || !existingPlayer || !teams.get(player.teamId)) {
    teams = teams.set(
      player.teamId,
      new Team(player.teamId, '', ImmutableMap()),
    );
  }

  const newState = update({
    currentViewer: player.id,
    map: map.copy({
      currentPlayer: player.id,
      teams: updatePlayers(teams, [newCurrentPlayer, player]),
    }),
  });

  return newState;
}
