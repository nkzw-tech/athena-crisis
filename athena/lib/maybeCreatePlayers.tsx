import ImmutableMap from '@nkzw/immutable-map';
import Entity from '../map/Entity.tsx';
import Player, { PlaceholderPlayer, PlayerID } from '../map/Player.tsx';
import Team, { Teams } from '../map/Team.tsx';
import Vector from '../map/Vector.tsx';
import MapData from '../MapData.tsx';
import createBotWithName from './createBotWithName.tsx';

export default function maybeCreatePlayers(
  map: MapData,
  initialTeams: Teams | undefined,
  entities: ImmutableMap<Vector, Entity>,
): Teams | undefined {
  const players = new Set<PlayerID>();
  const newPlayers = new Set<PlayerID>();
  for (const [, entity] of entities) {
    if (entity.player === 0) {
      continue;
    }

    players.add(entity.player);
    if (!map.maybeGetPlayer(entity.player)) {
      newPlayers.add(entity.player);
    }
  }

  let teams = ImmutableMap<PlayerID, Team>(
    initialTeams
      ? [...initialTeams]
          .map(([teamId, team]): [PlayerID, Team] => [
            teamId,
            team.copy({
              players: ImmutableMap<PlayerID, Player>(
                [...team.players].filter(([id]) => {
                  if (players.has(id)) {
                    newPlayers.delete(id);
                    return true;
                  }

                  return false;
                }),
              ),
            }),
          ])
          .filter(([, team]) => team.players.size > 0)
      : [],
  );

  for (const player of newPlayers) {
    const team = teams.get(player) || new Team(player, '', ImmutableMap());
    teams = teams.set(
      player,
      team.copy({
        players: team.players.set(
          player,
          createBotWithName(
            new PlaceholderPlayer(player, player, 0, undefined, new Set()),
          ),
        ),
      }),
    );
  }
  return teams.size ? teams : undefined;
}
