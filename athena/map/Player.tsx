import { Skill } from '../info/Skill.tsx';
import MapData from '../MapData.tsx';
import { Charge, MaxCharges } from './Configuration.tsx';
import {
  encodePlayerStatistics,
  InitialPlayerStatistics,
  PlainPlayerStatistics,
  PlayerStatistics,
} from './PlayerStatistics.tsx';

export type PlainPlayerID = number;
export type PlayerID = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type PlayerIDs = ReadonlyArray<PlayerID>;
export type PlayerIDSet = ReadonlySet<PlayerID>;
export type DynamicPlayerID = PlayerID | 'self' | 'team' | 'opponent';
export type PlainDynamicPlayerID = PlayerID | -1 | -2 | -3;

// This tuple must start with `0`.
export const PlayerIDs = [0, 1, 2, 3, 4, 5, 6, 7] as const;
export const DynamicPlayerIDs = new Set([
  'self',
  'team',
  'opponent',
  ...PlayerIDs,
] as const);

type BasePlainPlayerType = Readonly<{
  activeSkills: ReadonlyArray<Skill>;
  ai: number | undefined;
  charge: number | undefined;
  funds: number;
  id: PlayerID;
  misses: number | undefined;
  skills: ReadonlyArray<Skill> | undefined;
  stats: PlainPlayerStatistics | null;
}>;

export type PlainPlayerType = BasePlainPlayerType &
  Readonly<{
    userId: string;
  }>;

type PlainBotType = BasePlainPlayerType &
  Readonly<{
    name: string;
  }>;

type PlaceholderPlayerType = Readonly<{
  activeSkills?: undefined;
  ai?: number;
  funds: number;
  id: PlayerID;
  skills?: ReadonlyArray<Skill>;
}>;

export type PlainPlayer =
  | PlainBotType
  | PlainPlayerType
  | PlaceholderPlayerType;

export default abstract class Player {
  public readonly stats: PlayerStatistics;
  public abstract readonly type: 'human' | 'bot' | 'placeholder';

  constructor(
    public readonly id: PlayerID,
    public readonly teamId: PlayerID,
    public readonly funds: number,
    public readonly ai: number | undefined,
    public readonly skills: ReadonlySet<Skill>,
    public readonly activeSkills: ReadonlySet<Skill>,
    public readonly charge: number,
    stats: PlayerStatistics | null,
    public readonly misses: number,
  ) {
    this.stats = stats || InitialPlayerStatistics;
  }

  modifyFunds(change: number): this {
    return this.copy({ funds: Math.max(0, this.funds + change) });
  }

  setFunds(funds: number): this {
    return this.copy({ funds });
  }

  setCharge(charge: number): this {
    return this.copy({
      charge: Math.max(0, Math.min(MaxCharges * Charge, charge)),
    });
  }

  maybeSetCharge(charge: number | undefined): this {
    return charge != null ? this.setCharge(charge) : this;
  }

  activateSkill(skill: Skill): this {
    return this.skills.has(skill)
      ? this.copy({
          activeSkills: new Set([...this.activeSkills, skill]),
        })
      : this;
  }

  disableActiveSkills() {
    return this.copy({ activeSkills: new Set() });
  }

  modifyStatistic(key: keyof PlayerStatistics, change: number): this {
    return this.copy({
      stats: { ...this.stats, [key]: Math.max(0, this.stats[key] + change) },
    });
  }

  modifyStatistics(stats: Partial<PlayerStatistics>): this {
    return this.copy({
      stats: {
        captured: Math.max(0, this.stats.captured + (stats.captured || 0)),
        createdBuildings: Math.max(
          0,
          this.stats.createdBuildings + (stats.createdBuildings || 0),
        ),
        createdUnits: Math.max(
          0,
          this.stats.createdUnits + (stats.createdUnits || 0),
        ),
        damage: Math.max(0, this.stats.damage + (stats.damage || 0)),
        destroyedBuildings: Math.max(
          0,
          this.stats.destroyedBuildings + (stats.destroyedBuildings || 0),
        ),
        destroyedUnits: Math.max(
          0,
          this.stats.destroyedUnits + (stats.destroyedUnits || 0),
        ),
        lostBuildings: Math.max(
          0,
          this.stats.lostBuildings + (stats.lostBuildings || 0),
        ),
        lostUnits: Math.max(0, this.stats.lostUnits + (stats.lostUnits || 0)),
        oneShots: Math.max(0, this.stats.oneShots + (stats.oneShots || 0)),
        rescuedUnits: Math.max(
          0,
          this.stats.rescuedUnits + (stats.rescuedUnits || 0),
        ),
      },
    });
  }

  resetStatistics(): this {
    return this.copy({ stats: InitialPlayerStatistics });
  }

  isHumanPlayer(): this is HumanPlayer {
    return this.type === 'human';
  }

  isBot(): this is Bot {
    return this.type === 'bot';
  }

  isPlaceholder(): this is PlaceholderPlayer {
    return this.type === 'placeholder';
  }

  abstract copy(_: {
    activeSkills?: ReadonlySet<Skill>;
    ai?: number;
    charge?: number;
    funds?: number;
    id?: PlayerID;
    misses?: number;
    skills?: ReadonlySet<Skill>;
    stats?: PlayerStatistics;
    teamId?: PlayerID;
  }): this;
  abstract toJSON(): PlainPlayer;
}

export class PlaceholderPlayer extends Player {
  public readonly type = 'placeholder';

  constructor(
    id: PlayerID,
    teamId: PlayerID,
    funds: number,
    ai: number | undefined,
    skills: ReadonlySet<Skill>,
  ) {
    super(id, teamId, funds, ai, skills, new Set(), 0, null, 0);
  }

  copy({
    ai,
    funds,
    id,
    skills,
    teamId,
  }: {
    ai?: number | undefined;
    funds?: number;
    id?: PlayerID;
    skills?: ReadonlySet<Skill>;
    teamId?: PlayerID;
  }): this {
    return new PlaceholderPlayer(
      id ?? this.id,
      teamId ?? this.teamId,
      funds ?? this.funds,
      ai ?? this.ai,
      skills ?? this.skills,
    ) as this;
  }

  toJSON(): PlaceholderPlayerType {
    const { ai, funds, id, skills } = this;
    return { ai, funds, id, skills: [...skills] };
  }

  static from(player: Player): PlaceholderPlayer {
    return player.isPlaceholder()
      ? player
      : new PlaceholderPlayer(
          player.id,
          player.teamId,
          player.funds,
          player.isBot() ? player.ai : undefined,
          player.skills,
        );
  }
}

export class Bot extends Player {
  public readonly type = 'bot';

  constructor(
    id: PlayerID,
    public readonly name: string,
    teamId: PlayerID,
    funds: number,
    ai: number | undefined,
    skills: ReadonlySet<Skill>,
    activeSkills: ReadonlySet<Skill>,
    charge: number,
    stats: PlayerStatistics | null,
    misses: number,
  ) {
    super(id, teamId, funds, ai, skills, activeSkills, charge, stats, misses);
  }

  copy({
    activeSkills,
    ai,
    charge,
    funds,
    id,
    misses,
    name,
    skills,
    stats,
    teamId,
  }: {
    activeSkills?: ReadonlySet<Skill>;
    ai?: number | undefined;
    charge?: number;
    funds?: number;
    id?: PlayerID;
    misses?: number;
    name?: string;
    skills?: ReadonlySet<Skill>;
    stats?: PlayerStatistics;
    teamId?: PlayerID;
  }): this {
    return new Bot(
      id ?? this.id,
      name ?? this.name,
      teamId ?? this.teamId,
      funds ?? this.funds,
      ai ?? this.ai,
      skills ?? this.skills,
      activeSkills ?? this.activeSkills,
      charge ?? this.charge,
      stats ?? this.stats,
      misses ?? this.misses,
    ) as this;
  }

  toJSON(): PlainBotType {
    const { activeSkills, ai, charge, funds, id, misses, name, skills, stats } =
      this;
    return {
      activeSkills: [...activeSkills],
      ai,
      charge,
      funds,
      id,
      misses,
      name,
      skills: [...skills],
      stats: encodePlayerStatistics(stats),
    };
  }

  static from(player: Player, name: string): Bot {
    return player.isBot() && player.name === name
      ? player
      : new Bot(
          player.id,
          name,
          player.teamId,
          player.funds,
          player.isPlaceholder() ? player.ai : undefined,
          player.skills,
          player.activeSkills,
          player.charge,
          player.stats,
          player.misses,
        );
  }
}

export class HumanPlayer extends Player {
  public readonly type = 'human';

  constructor(
    id: PlayerID,
    public readonly userId: string,
    teamId: PlayerID,
    funds: number,
    ai: number | undefined,
    skills: ReadonlySet<Skill>,
    activeSkills: ReadonlySet<Skill>,
    charge: number,
    stats: PlayerStatistics | null,
    misses: number,
  ) {
    super(id, teamId, funds, ai, skills, activeSkills, charge, stats, misses);
  }

  copy({
    activeSkills,
    ai,
    charge,
    funds,
    id,
    misses,
    skills,
    stats,
    teamId,
    userId,
  }: {
    activeSkills?: ReadonlySet<Skill>;
    ai?: number;
    charge?: number;
    funds?: number;
    id?: PlayerID;
    misses?: number;
    skills?: ReadonlySet<Skill>;
    stats?: PlayerStatistics;
    teamId?: PlayerID;
    userId?: string;
  }): this {
    return new HumanPlayer(
      id ?? this.id,
      userId ?? this.userId,
      teamId ?? this.teamId,
      funds ?? this.funds,
      ai ?? this.ai,
      skills ?? this.skills,
      activeSkills ?? this.activeSkills,
      charge ?? this.charge,
      stats ?? this.stats,
      misses ?? this.misses,
    ) as this;
  }

  toJSON(): PlainPlayerType {
    const {
      activeSkills,
      ai,
      charge,
      funds,
      id,
      misses,
      skills,
      stats,
      userId,
    } = this;
    return {
      activeSkills: [...activeSkills],
      ai,
      charge,
      funds,
      id,
      misses,
      skills: [...skills],
      stats: encodePlayerStatistics(stats),
      userId,
    };
  }

  static from(player: Player, userId: string): HumanPlayer {
    return player.isHumanPlayer() && player.userId === userId
      ? player
      : new HumanPlayer(
          player.id,
          userId,
          player.teamId,
          player.funds,
          player.ai,
          player.skills,
          player.activeSkills,
          player.charge,
          player.stats,
          player.misses,
        );
  }
}

export function toPlayerID(id: number): PlayerID {
  switch (id) {
    case 0:
    case 1:
    case 2:
    case 3:
    case 4:
    case 5:
    case 6:
    case 7:
      return id;
    default: {
      throw new Error(`Invalid PlayerID '${id}'.`);
    }
  }
}

export function encodeDynamicPlayerID(
  id: DynamicPlayerID,
): PlainDynamicPlayerID {
  switch (id) {
    case 'self':
      return -1;
    case 'team':
      return -2;
    case 'opponent':
      return -3;
    default:
      return id;
  }
}

export function decodeDynamicPlayerID(
  id: PlainDynamicPlayerID,
): DynamicPlayerID {
  switch (id) {
    case -1:
      return 'self';
    case -2:
      return 'team';
    case -3:
      return 'opponent';
    default:
      return toPlayerID(id);
  }
}

export function toDynamicPlayerID(id: number | string): DynamicPlayerID {
  switch (id) {
    case 'self':
    case 'team':
    case 'opponent':
      return id;
    default: {
      if (typeof id === 'string') {
        throw new Error(`Invalid PlayerID '${id}'.`);
      }
      return toPlayerID(id);
    }
  }
}

export function isDynamicPlayerID(id: number | string): id is DynamicPlayerID {
  return DynamicPlayerIDs.has(id as DynamicPlayerID);
}

const preferHumanPlayers = (players: ReadonlyArray<Player>) =>
  players.find((player) => isHumanPlayer(player)) || players.at(0)!;

export function resolveDynamicPlayerID(
  map: MapData,
  id: DynamicPlayerID,
  player = map.getCurrentPlayer().id,
): PlayerID {
  switch (id) {
    case 'self':
      return player;
    case 'team': {
      return (
        preferHumanPlayers(
          [...(map.maybeGetTeam(player)?.players.values() || [])].filter(
            ({ id }) => id > 0 && id !== player,
          ),
        )?.id || player
      );
    }
    case 'opponent': {
      const team = map.maybeGetTeam(player);
      return preferHumanPlayers(
        map
          .getPlayers()
          .filter(({ id, teamId }) => id > 0 && teamId !== team?.id),
      )!.id;
    }
    default:
      return id;
  }
}

export function toPlayerIDs(ids: ReadonlyArray<number>): PlayerIDs {
  return ids.map(toPlayerID);
}

export function numberToPlayerID(number: number): PlayerID {
  return toPlayerID((number % (PlayerIDs.length - 1)) + 1);
}

export function isHumanPlayer(player: Player): player is HumanPlayer {
  return player.isHumanPlayer();
}
export function isBot(player: Player): player is Bot {
  return player.isBot();
}
