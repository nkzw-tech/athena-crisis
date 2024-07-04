import sortBy from '@deities/hephaestus/sortBy.tsx';
import ImmutableMap from '@nkzw/immutable-map';
import { Decorator, DecoratorInfo, getDecorator } from './info/Decorator.tsx';
import { ActiveUnitTypes, getActiveUnitTypes, Skill } from './info/Skill.tsx';
import {
  getTile,
  getTileInfo,
  TileField,
  TileInfo,
  TileLayer,
} from './info/Tile.tsx';
import getAllUnitsToRefill from './lib/getAllUnitsToRefill.tsx';
import getUnitsByPositions from './lib/getUnitsByPositions.tsx';
import indexToSpriteVector from './lib/indexToSpriteVector.tsx';
import indexToVector from './lib/indexToVector.tsx';
import isFuelConsumingUnit from './lib/isFuelConsumingUnit.tsx';
import { Modifier } from './lib/Modifier.tsx';
import refillUnits from './lib/refillUnits.tsx';
import shouldRemoveUnit from './lib/shouldRemoveUnit.tsx';
import { Biome } from './map/Biome.tsx';
import Building from './map/Building.tsx';
import { DecoratorsPerSide } from './map/Configuration.tsx';
import Entity from './map/Entity.tsx';
import type { PlainMap, PlainMapConfig } from './map/PlainMap.tsx';
import Player, {
  HumanPlayer,
  PlayerID,
  PlayerIDs,
  toPlayerID,
  toPlayerIDs,
} from './map/Player.tsx';
import { PerformanceExpectation } from './map/PlayerPerformance.tsx';
import {
  decodeBuildings,
  decodeDecorators,
  decodeTeams,
  decodeUnits,
  encodeDecorators,
  encodeEntities,
  encodeTeams,
} from './map/Serialization.tsx';
import Team, { Teams } from './map/Team.tsx';
import Unit from './map/Unit.tsx';
import Vector from './map/Vector.tsx';
import {
  Criteria,
  decodeLegacyWinConditions,
  decodeObjectives,
  encodeObjectives,
  Objectives,
} from './Objectives.tsx';
import Vision, { Fog, VisionT } from './Vision.tsx';

export type ID = number;

export type PlayerOrPlayerID = Player | PlayerID;
type EntityOrPlayerID =
  | Readonly<{
      player: PlayerID;
    }>
  | PlayerID;

export type AnyEntity = PlayerOrPlayerID | Entity;

export type TileMap = ReadonlyArray<TileField>;
export type ModifierField = Modifier | [Modifier, Modifier];
export type ModifierMap = ReadonlyArray<ModifierField>;
export type DecoratorMap = ReadonlyArray<Decorator>;

const nullPlayer = new HumanPlayer(
  0,
  '-1',
  0,
  0,
  undefined,
  new Set(),
  new Set(),
  0,
  null,
  0,
);
const nullTeam = new Team(0, 'null', ImmutableMap([[0, nullPlayer]]));

export class MapConfig {
  constructor(
    public readonly multiplier: number,
    public readonly seedCapital: number,
    public readonly blocklistedBuildings: ReadonlySet<ID>,
    public readonly blocklistedSkills: ReadonlySet<Skill>,
    public readonly blocklistedUnits: ReadonlySet<ID>,
    public readonly fog: boolean,
    public readonly biome: Biome,
    public readonly objectives: Objectives,
    public readonly performance: PerformanceExpectation,
  ) {}

  copy({
    biome,
    blocklistedBuildings,
    blocklistedSkills,
    blocklistedUnits,
    fog,
    multiplier,
    objectives,
    performance,
    seedCapital,
  }: Partial<MapConfig>) {
    return new MapConfig(
      multiplier ?? this.multiplier,
      seedCapital ?? this.seedCapital,
      blocklistedBuildings ?? this.blocklistedBuildings,
      blocklistedSkills ?? this.blocklistedSkills,
      blocklistedUnits ?? this.blocklistedUnits,
      fog ?? this.fog,
      biome ?? this.biome,
      objectives ?? this.objectives,
      performance ?? this.performance,
    );
  }

  toJSON(): PlainMapConfig {
    const {
      biome,
      blocklistedBuildings,
      blocklistedSkills,
      blocklistedUnits,
      fog,
      multiplier,
      objectives,
      performance,
      seedCapital,
    } = this;
    return {
      biome,
      blocklistedBuildings: [...blocklistedBuildings],
      blocklistedSkills: [...blocklistedSkills],
      blocklistedUnits: [...blocklistedUnits],
      fog,
      multiplier,
      objectives: encodeObjectives(objectives),
      performance: [performance.pace, performance.power, performance.style],
      seedCapital,
    };
  }
}

export class SizeVector {
  constructor(
    public readonly width: number,
    public readonly height: number,
  ) {}

  equals({ height, width }: SizeVector) {
    return this.height === height && this.width === width;
  }

  contains({ x, y }: { x: number; y: number }) {
    return x > 0 && y > 0 && this.width >= x && this.height >= y;
  }

  toDecoratorSizeVector() {
    return new SizeVector(
      this.width * DecoratorsPerSide,
      this.height * DecoratorsPerSide,
    );
  }

  toJSON() {
    const { height, width } = this;
    return { height, width };
  }
}

const toPlayer = (object: AnyEntity): PlayerID =>
  typeof object === 'number'
    ? object
    : object.type === 'entity'
      ? object.player
      : object.id;

export default class MapData {
  private players: Map<PlayerID, Player>;
  private playerToTeam: Map<PlayerID, number>;
  private _firstPlayer: PlayerID = 0;
  private _hasNeutralUnits: boolean | null = null;
  private _activeUnitTypes: ReadonlyMap<PlayerID, ActiveUnitTypes> | null =
    null;

  constructor(
    public readonly map: TileMap,
    public readonly modifiers: ModifierMap,
    public readonly decorators: DecoratorMap,
    public readonly config: MapConfig,
    public readonly size: SizeVector,
    public readonly currentPlayer: PlayerID,
    public readonly round: number,
    public readonly active: PlayerIDs,
    public readonly teams: Teams,
    public readonly buildings: ImmutableMap<Vector, Building>,
    public readonly units: ImmutableMap<Vector, Unit>,
  ) {
    this.players = new Map(
      teams.flatMap((team) => team.players).sortBy(({ id }) => id),
    );
    this.playerToTeam = new Map(
      [...this.players].map(([id, player]) => {
        if (!this._firstPlayer) {
          this._firstPlayer = id;
        }

        return [id, player.teamId];
      }),
    );
    this.playerToTeam.set(0, -1);
  }

  contains(size: { x: number; y: number }) {
    return this.size.contains(size);
  }

  matchesPlayer(objectA: AnyEntity, objectB: AnyEntity) {
    return toPlayer(objectA) === toPlayer(objectB);
  }

  matchesTeam(objectA: AnyEntity, objectB: AnyEntity) {
    return (
      this.playerToTeam.get(toPlayer(objectA)) ===
      this.playerToTeam.get(toPlayer(objectB))
    );
  }

  isOpponent(objectA: AnyEntity, objectB: AnyEntity) {
    return (
      this.playerToTeam.get(toPlayer(objectA)) !==
      this.playerToTeam.get(toPlayer(objectB))
    );
  }

  isNeutral(entityA: Entity) {
    return entityA.player === 0;
  }

  isNonNeutralOpponent(objectA: AnyEntity, entityB: Entity) {
    return (
      entityB.player !== 0 &&
      this.playerToTeam.get(toPlayer(objectA)) !==
        this.playerToTeam.get(entityB.player)
    );
  }

  hasNeutralUnits() {
    if (this._hasNeutralUnits === null) {
      this._hasNeutralUnits = this.units.some((unit) => unit.player === 0);
    }
    return this._hasNeutralUnits;
  }

  getActiveUnitTypes() {
    return (
      this._activeUnitTypes ||
      (this._activeUnitTypes = new Map(
        this.getPlayers().map((player) => [
          player.id,
          getActiveUnitTypes(this, player),
        ]),
      ))
    );
  }

  getTileIndex(vector: Vector) {
    return (vector.y - 1) * this.size.width + (vector.x - 1);
  }

  getTile(vector: Vector, layer?: TileLayer) {
    return this.contains(vector)
      ? getTile(this.map[this.getTileIndex(vector)], layer)
      : null;
  }

  getTileInfo(vector: Vector, layer?: TileLayer) {
    if (!this.contains(vector)) {
      throw new Error(
        `getTileInfo: Vector '${vector.x},${vector.y}' is not within the map limits of width '${this.size.width}' and height '${this.size.height}'.`,
      );
    }

    return getTileInfo(this.map[this.getTileIndex(vector)], layer);
  }

  maybeGetTileInfo(vector: Vector, layer?: TileLayer) {
    if (this.contains(vector)) {
      return getTileInfo(this.map[this.getTileIndex(vector)], layer);
    }
  }

  getModifier(vector: Vector, layer?: TileLayer) {
    const modifier = this.modifiers[this.getTileIndex(vector)];
    const isNumber = typeof modifier === 'number';

    if (layer != null) {
      return (isNumber ? (layer === 0 ? modifier : 0) : modifier[layer]) || 0;
    }
    return (isNumber ? modifier : modifier[1] || modifier[0]) || 0;
  }

  getNextPlayer(): Player {
    return this.getPlayer(
      this.active[this.active.indexOf(this.currentPlayer) + 1] ||
        this.active[0],
    );
  }

  getPlayer(player: EntityOrPlayerID) {
    const id = typeof player == 'number' ? player : player.player;
    return id === 0 ? nullPlayer : this.players.get(id)!;
  }

  maybeGetPlayer(player: EntityOrPlayerID) {
    const id = typeof player == 'number' ? player : player.player;
    return id === 0 ? nullPlayer : this.players.get(id);
  }

  getFirstPlayerID() {
    return this._firstPlayer;
  }

  getPlayers(): ReadonlyArray<Player> {
    return [...this.players.values()];
  }

  getPlayerByUserId(id: string): HumanPlayer | null {
    for (const [, player] of this.players) {
      if (player.isHumanPlayer() && player.userId === id) {
        return player;
      }
    }
    return null;
  }

  getCurrentPlayer() {
    return this.getPlayer(this.currentPlayer);
  }

  isCurrentPlayer(object: AnyEntity) {
    return this.matchesPlayer(this.currentPlayer, object);
  }

  getTeam(player: PlayerOrPlayerID) {
    if (typeof player === 'number') {
      player = this.getPlayer(player);
    }
    return player.teamId === 0 ? nullTeam : this.teams.get(player.teamId)!;
  }

  maybeGetTeam(maybePlayer: PlayerOrPlayerID) {
    const player =
      typeof maybePlayer === 'number'
        ? this.getPlayer(maybePlayer)
        : maybePlayer;
    return player
      ? player.teamId === 0
        ? nullTeam
        : this.teams.get(player.teamId) || null
      : null;
  }

  isEndOfRound() {
    return this.active[0] === this.getNextPlayer().id;
  }

  recover(player: PlayerOrPlayerID) {
    return this.copy({
      buildings: this.buildings.map((entity) =>
        this.matchesPlayer(player, entity) ? entity.recover() : entity,
      ),
      units: this.units.map((entity) =>
        this.matchesPlayer(player, entity) ? entity.recover() : entity,
      ),
    });
  }

  refill(player: Player, extraPositions?: ReadonlyArray<Vector>) {
    let map = this.subtractFuel(player);
    const units = getAllUnitsToRefill(map, new Vision(player.id), player);
    map = refillUnits(
      map,
      extraPositions
        ? new Map([...units, ...getUnitsByPositions(map, extraPositions)])
        : units,
    );

    return map.copy({
      units: map.units.filter(
        (unit, vector) => !shouldRemoveUnit(map, vector, unit, player.id),
      ),
    });
  }

  subtractFuel(player: PlayerOrPlayerID, amount = -1) {
    return this.copy({
      units: this.units.map((unit, vector) =>
        this.matchesPlayer(player, unit) &&
        isFuelConsumingUnit(unit, this.getTileInfo(vector))
          ? unit.modifyFuel(amount)
          : unit,
      ),
    });
  }

  mapFields<T>(fn: (vector: Vector, index: number) => T): Array<T> {
    return this.reduceEachField<Array<T>>((array, vector, index) => {
      array.push(fn(vector, index));
      return array;
    }, []);
  }

  forEachField(fn: (vector: Vector, index: number) => void) {
    this.reduceEachField<void>((_, vector, index) => fn(vector, index), void 0);
  }

  reduceEachField<T>(
    fn: (value: T, vector: Vector, index: number) => T,
    value: T,
  ): T {
    const { map, size } = this;
    for (let i = 0; i < map.length; i++) {
      value = fn.call(this, value, indexToVector(i, size.width), i);
    }
    return value;
  }

  forEachTile(
    fn: (
      vector: Vector,
      tile: TileInfo,
      layer: TileLayer,
      modifier: number,
      index: number,
    ) => void,
  ) {
    this.reduceEachTile<void>(
      (_, vector, tile, layer, modifier, index) =>
        fn(vector, tile, layer, modifier, index),
      void 0,
    );
  }

  private reduceEachTile<T>(
    fn: (
      value: T,
      vector: Vector,
      tile: TileInfo,
      layer: TileLayer,
      modifier: number,
      index: number,
    ) => T,
    value: T,
  ): T {
    const { map, modifiers, size } = this;
    for (let i = 0; i < map.length; i++) {
      const field = map[i];
      if (typeof field === 'number') {
        value = fn.call(
          this,
          value,
          indexToVector(i, size.width),
          getTileInfo(field),
          0,
          modifiers[i] as number,
          i,
        );
      } else {
        const modifier = modifiers[i];
        const [modifier0, modifier1] = (typeof modifier === 'number'
          ? [modifier, 0]
          : modifier) || [0, 0];
        value = fn.call(
          this,
          value,
          indexToVector(i, size.width),
          getTileInfo(field[0]),
          0,
          modifier0,
          i,
        );
        value = fn.call(
          this,
          value,
          indexToVector(i, size.width),
          getTileInfo(field[1]),
          1,
          modifier1,
          i,
        );
      }
    }
    return value;
  }

  forEachDecorator(fn: (decorator: DecoratorInfo, vector: Vector) => void) {
    this.reduceEachDecorator<void>(
      (_, decorator, vector) => fn(decorator, vector),
      void 0,
    );
  }

  reduceEachDecorator<T>(
    fn: (value: T, decorator: DecoratorInfo, vector: Vector) => T,
    value: T,
  ): T {
    const { decorators, size } = this;
    for (let i = 0; i < decorators.length; i++) {
      const decorator = getDecorator(decorators[i]);
      if (decorator) {
        value = fn.call(
          this,
          value,
          decorator,
          indexToSpriteVector(i, size.width * DecoratorsPerSide),
        );
      }
    }
    return value;
  }

  copy({
    active,
    buildings,
    config,
    currentPlayer,
    decorators,
    map,
    modifiers,
    round,
    size,
    teams,
    units,
  }: {
    active?: PlayerIDs;
    buildings?: ImmutableMap<Vector, Building>;
    config?: MapConfig;
    currentPlayer?: PlayerID;
    decorators?: DecoratorMap;
    map?: TileMap;
    modifiers?: ModifierMap;
    round?: number;
    size?: SizeVector;
    teams?: Teams;
    units?: ImmutableMap<Vector, Unit>;
  }) {
    return new MapData(
      map ?? this.map,
      modifiers ?? this.modifiers,
      decorators ?? this.decorators,
      config ?? this.config,
      size ?? this.size,
      currentPlayer ?? this.currentPlayer,
      round ?? this.round,
      active ?? this.active,
      teams ?? this.teams,
      buildings ?? this.buildings,
      units ?? this.units,
    );
  }

  createVisionObject(player: PlayerOrPlayerID): VisionT {
    const viewer = typeof player === 'number' ? player : player.id;
    return this.config.fog ? new Fog(viewer) : new Vision(viewer);
  }

  static fromObject(data: PlainMap) {
    const { config } = data;
    const size = new SizeVector(data.size.width, data.size.height);
    return new MapData(
      data.map,
      data.modifiers,
      decodeDecorators(size, data.decorators),
      new MapConfig(
        config.multiplier,
        config.seedCapital,
        new Set(config.blocklistedBuildings),
        new Set(config.blocklistedSkills),
        new Set(config.blocklistedUnits),
        config.fog,
        config.biome,
        config.objectives
          ? decodeObjectives(config.objectives)
          : config.winConditions
            ? decodeLegacyWinConditions(config.winConditions)
            : ImmutableMap([[0, { hidden: false, type: Criteria.Default }]]),
        config.performance
          ? {
              pace: config.performance[0] || null,
              power: config.performance[1] || null,
              style: config.performance[2] || null,
            }
          : { pace: null, power: null, style: null },
      ),
      size,
      toPlayerID(data.currentPlayer),
      data.round,
      toPlayerIDs(data.active),
      decodeTeams(data.teams),
      decodeBuildings(data.buildings),
      decodeUnits(data.units),
    );
  }

  static fromJSON(json: string) {
    return MapData.fromObject(JSON.parse(json));
  }

  static createMap({
    config,
    ...data
  }: Partial<Omit<PlainMap, 'config'>> & {
    config?: Partial<PlainMapConfig>;
  }) {
    const active = data.teams
      ? sortBy(
          data.teams.flatMap(({ players }) => players.map(({ id }) => id)),
          (id) => id,
        )
      : [1, 2];
    return MapData.fromObject({
      active,
      buildings: [],
      config: {
        biome: Biome.Grassland,
        blocklistedBuildings: [],
        blocklistedUnits: [],
        fog: false,
        multiplier: 1,
        seedCapital: 0,
        ...config,
      },
      currentPlayer: active[0],
      decorators: [],
      map: [1],
      modifiers: [0],
      round: 1,
      size: { height: 1, width: 1 },
      teams: [
        { id: 1, name: '', players: [{ funds: 0, id: 1, userId: '-1' }] },
        { id: 2, name: '', players: [{ funds: 0, id: 2, userId: '-2' }] },
      ],
      units: [],
      ...data,
    })!;
  }

  toJSON(): PlainMap {
    return {
      active: this.active,
      buildings: encodeEntities(this.buildings),
      config: this.config.toJSON(),
      currentPlayer: this.currentPlayer,
      decorators: encodeDecorators(this),
      map: this.map,
      modifiers: this.modifiers,
      round: this.round,
      size: this.size.toJSON(),
      teams: encodeTeams(this.teams),
      units: encodeEntities(this.units),
    };
  }
}
