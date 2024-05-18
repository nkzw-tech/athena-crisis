import type ImmutableMap from '@nkzw/immutable-map';
import type { PlainPlayer, PlayerID } from './Player.tsx';
import type Player from './Player.tsx';

export type PlainTeam = Readonly<{
  id: PlayerID;
  name: string;
  players: ReadonlyArray<PlainPlayer>;
}>;

export type Teams = ImmutableMap<PlayerID, Team>;
export type PlainTeams = ReadonlyArray<PlainTeam>;

export function toTeamArray(teams: Teams) {
  return teams
    .map(({ id, players }) => ({
      id,
      players: [...players.map(({ id }) => id).valueSeq()],
    }))
    .valueSeq()
    .toArray();
}

export default class Team {
  constructor(
    public readonly id: PlayerID,
    public readonly name: string,
    public readonly players: ImmutableMap<PlayerID, Player>,
  ) {}

  toJSON(): PlainTeam {
    const { id, name, players } = this;
    return {
      id,
      name,
      players: [...players].map(([, player]) => player.toJSON()),
    };
  }

  copy({
    id,
    name,
    players,
  }: {
    id?: PlayerID;
    name?: string;
    players?: ImmutableMap<PlayerID, Player>;
  }): Team {
    return new Team(id ?? this.id, name ?? this.name, players ?? this.players);
  }
}
