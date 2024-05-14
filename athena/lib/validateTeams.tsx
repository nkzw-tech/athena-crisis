import ImmutableMap from '@nkzw/immutable-map';
import { Skills } from '../info/Skill.tsx';
import { DefaultMapSkillSlots } from '../map/Configuration.tsx';
import { PlaceholderPlayer, PlayerID, toPlayerID } from '../map/Player.tsx';
import Team from '../map/Team.tsx';
import MapData from '../MapData.tsx';
import validateSkills from './validateSkills.tsx';

export type TeamsList = ReadonlyArray<
  Readonly<{ id: number; players: ReadonlyArray<number> }>
>;

export default function validateTeams(
  map: MapData,
  teams: TeamsList,
): [MapData, null] | [null, 'invalid-teams'] {
  if (teams.length > map?.getPlayers().length) {
    return [null, 'invalid-teams'];
  }

  const validatedTeams = teams.map(({ id, players }) => ({
    id: toPlayerID(id),
    players: players.map(toPlayerID),
  }));

  const uniquePlayers = new Set<PlayerID>();
  if (
    validatedTeams.filter(({ players }) => players.length).length < 2 ||
    !validatedTeams.every(({ players }) =>
      players.every((player) => {
        if (uniquePlayers.has(player)) {
          return false;
        }
        uniquePlayers.add(player);
        return true;
      }),
    ) ||
    uniquePlayers.size !== map.active.length
  ) {
    return [null, 'invalid-teams'];
  }

  for (const active of map.active) {
    uniquePlayers.delete(active);
  }

  if (uniquePlayers.size) {
    return [null, 'invalid-teams'];
  }

  return [
    map.copy({
      teams: ImmutableMap(
        validatedTeams
          .filter(({ players }) => players.length)
          .map(({ id: teamId, players }) => [
            teamId,
            new Team(
              teamId,
              '',
              ImmutableMap(
                players.map(
                  (id) =>
                    [
                      id,
                      new PlaceholderPlayer(
                        id,
                        teamId,
                        0,
                        undefined,
                        validateSkills(
                          { skillSlots: DefaultMapSkillSlots, skills: Skills },
                          map.getPlayer(id).skills,
                          map,
                          true,
                        ),
                      ),
                    ] as const,
                ),
              ).sortBy(({ id }) => id),
            ),
          ]),
      ).sortBy(({ id }) => id),
    }),
    null,
  ];
}
