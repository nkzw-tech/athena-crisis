import type Player from '../map/Player.tsx';
import type { Teams } from '../map/Team.tsx';

export default function updatePlayer(teams: Teams, player: Player): Teams {
  const team = teams.get(player.teamId);
  return team
    ? teams.set(
        player.teamId,
        team.copy({ players: team.players.set(player.id, player) }),
      )
    : teams;
}
