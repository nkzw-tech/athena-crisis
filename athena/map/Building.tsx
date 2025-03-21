import getFirst from '@nkzw/core/getFirst.js';
import {
  Barracks,
  BuildingInfo,
  getBuildingInfo,
  SpawnPlatform,
} from '../info/Building.tsx';
import { Skill } from '../info/Skill.tsx';
import filterNullables from '../lib/filterNullables.tsx';
import hasHQ from '../lib/hasHQ.tsx';
import MapData, { ID } from '../MapData.tsx';
import { AIBehavior, AIBehaviors } from './AIBehavior.tsx';
import { Biome } from './Biome.tsx';
import { MaxHealth } from './Configuration.tsx';
import Entity, { PlainEntity } from './Entity.tsx';
import Player, { PlayerID, toPlayerID } from './Player.tsx';

export type PlainBuilding = PlainEntity & {
  readonly b?: ReadonlyArray<AIBehavior> | AIBehavior;
  readonly s?: ReadonlyArray<Skill> | Skill;
};

export default class Building extends Entity {
  public readonly info: BuildingInfo;

  constructor(
    id: ID,
    health: number,
    player: PlayerID,
    completed: true | null,
    label: PlayerID | null,
    private readonly behaviors?: ReadonlySet<AIBehavior> | null,
    public readonly skills?: ReadonlySet<Skill> | null,
  ) {
    const buildingInfo = getBuildingInfo(id);
    if (!buildingInfo) {
      throw new Error(`Invalid building '${id}'.`);
    }
    super(
      id,
      health,
      buildingInfo.isStructure() ? 0 : player,
      completed,
      label,
    );
    this.info = buildingInfo;
  }

  static fromJSON(building: PlainBuilding): Building {
    const { b, f, h, i, l, p, s } = building;
    return new Building(
      i,
      h,
      toPlayerID(p),
      f ? true : null,
      l != null ? toPlayerID(l) : null,
      Array.isArray(b) ? new Set(b) : b ? new Set([b]) : null,
      Array.isArray(s) ? new Set(s) : s ? new Set([s]) : null,
    );
  }

  private convert(biome: Biome, player: PlayerID) {
    return this.copy({
      id: this.info.isHQ()
        ? biome === Biome.Spaceship
          ? SpawnPlatform.id
          : Barracks.id
        : this.id,
      player,
    });
  }

  capture(map: MapData, player: PlayerID): this {
    return player !== 0 && this.info.isHQ() && !hasHQ(map, player)
      ? this.copy({ player })
      : this.convert(map.config.biome, player);
  }

  neutralize(biome: Biome, displayOnly = false) {
    return this.player === 0 ||
      (!displayOnly && this.info.configuration.attackStatusEffect)
      ? this
      : this.convert(biome, 0);
  }

  recover(): this {
    return this.completed ? this.copy({ completed: null }) : this;
  }

  complete(): this {
    return !this.completed ? this.copy({ completed: true }) : this;
  }

  hide(biome: Biome, displayOnly = false): this {
    return this.recover().setHealth(MaxHealth).neutralize(biome, displayOnly);
  }

  matchesBehavior(behavior: AIBehavior) {
    return !!this.behaviors?.has(behavior);
  }

  canBuildUnits(player: Player) {
    return this.getBuildableUnits(player).length > 0;
  }

  getBuildableUnits(player: Player) {
    return [...this.info.getAllBuildableUnits()].filter(
      (unit) => unit.getCostFor(player) < Number.POSITIVE_INFINITY,
    );
  }

  getFirstAIBehavior(): AIBehavior | undefined {
    return (this.behaviors && getFirst(this.behaviors)) || undefined;
  }

  rotateAIBehavior() {
    if (!this.behaviors || this.behaviors.size <= 1) {
      return this;
    }

    const behaviors = [...this.behaviors];
    behaviors.push(behaviors.shift()!);
    return this.copy({
      behaviors: new Set(behaviors),
    });
  }

  addAIBehavior(behavior: AIBehavior): this {
    return this.copy({
      behaviors: new Set([...(this.behaviors || []), behavior]),
    });
  }

  removeAIBehavior(behavior: AIBehavior): this {
    const behaviors = new Set(this.behaviors);
    behaviors.delete(behavior);
    return this.copy({
      behaviors,
    });
  }

  hasValidBehaviors() {
    return (
      !this.behaviors ||
      ([...this.behaviors].every((behavior) => AIBehaviors.has(behavior)) &&
        !this.info.getAllBuildableUnits()[Symbol.iterator]().next().done)
    );
  }

  withSkills(skills: ReadonlySet<Skill> | null) {
    return this.copy({
      skills,
    });
  }

  copy({
    behaviors,
    completed,
    health,
    id,
    label,
    player,
    skills,
  }: {
    behaviors?: ReadonlySet<AIBehavior> | null;
    completed?: true | null;
    health?: number;
    id?: ID;
    label?: PlayerID | null;
    player?: PlayerID;
    skills?: ReadonlySet<Skill> | null;
  }): this {
    return new Building(
      id ?? this.id,
      health ?? this.health,
      player ?? this.player,
      completed !== undefined ? completed : this.completed,
      label !== undefined ? label : this.label,
      behaviors ?? this.behaviors,
      skills ?? this.skills,
    ) as this;
  }

  override toJSON(): PlainBuilding {
    const {
      behaviors: b,
      completed: f,
      health: h,
      id: i,
      label: l,
      player: p,
      skills: s,
    } = this;

    return {
      ...(b?.size
        ? { b: b.size === 1 ? this.getFirstAIBehavior() : [...b] }
        : null),
      ...(s?.size
        ? { s: s.size === 1 ? s.values().next().value : [...s] }
        : null),
      ...(f ? { f: 1 } : null),
      h,
      i,
      ...(l != null ? { l } : null),
      p,
    };
  }

  override format(): Record<string, unknown> {
    const { behaviors, completed, health, id, label, player, skills } = this;
    return filterNullables({
      /* eslint-disable sort-keys-fix/sort-keys-fix */
      id,
      health,
      player,
      completed,
      label,
      behaviors,
      skills,
      /* eslint-enable sort-keys-fix/sort-keys-fix */
    });
  }
}

BuildingInfo.setConstructor(Building);
