import MapData from '../MapData.tsx';
import getActivePlayers from './getActivePlayers.tsx';

export default function dropInactivePlayers(map: MapData) {
  const active = getActivePlayers(map);
  const activeSet = new Set(active);
  return map.copy({
    active,
    teams: map.teams
      .map((team) =>
        team.copy({
          players: team.players.filter(({ id }) => activeSet.has(id)),
        }),
      )
      .filter((team) => team.players.size)
      .sortBy(({ id }) => active.indexOf(id)),
  });
}
