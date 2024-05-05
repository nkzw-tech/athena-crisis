import MapData from '../MapData.tsx';
import getActivePlayers from './getActivePlayers.tsx';

export default function dropInactivePlayers(map: MapData) {
  const active = new Set(getActivePlayers(map));
  return map.copy({
    active: [...active],
    teams: map.teams
      .map((team) =>
        team.copy({
          players: team.players.filter(({ id }) => active.has(id)),
        }),
      )
      .filter((team) => team.players.size),
  });
}
