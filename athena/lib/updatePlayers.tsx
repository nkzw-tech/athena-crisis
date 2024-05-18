import type Player from '../map/Player.tsx';
import type { Teams } from '../map/Team.tsx';
import updatePlayer from './updatePlayer.tsx';

export default function updatePlayers(
  teams: Teams,
  players: ReadonlyArray<Player | null>,
): Teams {
  return players.reduce(
    (teams, player) => (player ? updatePlayer(teams, player) : teams),
    teams,
  );
}
