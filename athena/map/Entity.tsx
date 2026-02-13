import UnknownTypeError from '@nkzw/core/UnknownTypeError.js';
import { UnitInfo } from '../info/Unit.tsx';
import { ID } from '../MapData.tsx';
import Building from './Building.tsx';
import { MaxHealth } from './Configuration.tsx';
import { PlayerID, PlayerIDSet } from './Player.tsx';
import Unit from './Unit.tsx';

export type PlainEntity = Readonly<{
  f?: 1 | null;
  h: number;
  i: ID;
  l?: number;
  p: number;
}>;

export enum EntityType {
  Airplane,
  AirSoldier,
  Amphibious,
  Artillery,
  Building,
  Ground,
  LowAltitude,
  Soldier,
  Invincible,
  Ship,
  Structure,
  Rail,
}

export type EntityGroup = 'land' | 'air' | 'naval' | 'building';

type Info = Readonly<{
  defense: number;
  id: ID;
  name: string;
  type: EntityType;
}>;

// h: health, p: player, f: completed
export default abstract class Entity {
  public abstract readonly info: Info;
  public readonly type = 'entity';

  constructor(
    public readonly id: ID,
    public readonly health: number,
    public readonly player: PlayerID,
    protected readonly completed: true | null,
    public readonly label: PlayerID | null,
  ) {}

  isDead() {
    return this.health <= 0;
  }

  isCompleted() {
    return !!this.completed;
  }

  toJSON(): PlainEntity {
    const { completed: f, health: h, id: i, label: l, player: p } = this;
    return { ...(f ? { f: 1 } : null), h, i, ...(l ? { l } : null), p };
  }

  format(): Record<string, unknown> {
    const { completed, health, id, label, player } = this;
    return {
      /* eslint-disable perfectionist/sort-objects */
      id,
      health,
      player,
      ...(completed ? { completed } : null),
      ...(label ? { label } : null),
      /* eslint-enable perfectionist/sort-objects */
    };
  }

  modifyHealth(change: number): this {
    return this.setHealth(this.health + change);
  }

  setHealth(health: number): this {
    return this.copy({ health: Math.max(0, Math.min(health, MaxHealth)) });
  }

  setPlayer(player: PlayerID): this {
    return this.copy({ player });
  }

  dropLabel(labels: PlayerIDSet): this {
    return this.label != null && labels.has(this.label) ? this.copy({ label: null }) : this;
  }

  abstract complete(): Entity;
  abstract copy(_: unknown): this;
  abstract recover(): Entity;
}

export function getEntityInfoGroup(entity: Readonly<{ type: EntityType }>): EntityGroup {
  const { type: entityType } = entity;
  switch (entityType) {
    case EntityType.Artillery:
    case EntityType.Soldier:
    case EntityType.Ground:
    case EntityType.Rail:
      return 'land';
    case EntityType.Building:
    case EntityType.Invincible:
    case EntityType.Structure:
      return 'building';
    case EntityType.Airplane:
    case EntityType.AirSoldier:
    case EntityType.LowAltitude:
      return 'air';
    case EntityType.Amphibious:
    case EntityType.Ship:
      return 'naval';
    default: {
      entityType satisfies never;
      throw new UnknownTypeError('getEntityGroup', entityType);
    }
  }
}

export function getEntityGroup(entity: Entity): EntityGroup {
  return getEntityInfoGroup(entity.info);
}

export function isEntityWithoutCover(entity: Entity) {
  const type = getEntityGroup(entity);
  return type === 'air' || type === 'building';
}

export function isBuilding(entity: Entity): entity is Building {
  return getEntityGroup(entity) === 'building';
}

export function isUnit(entity: Entity): entity is Unit {
  const entityType = getEntityGroup(entity);
  return entityType === 'land' || entityType === 'air' || entityType === 'naval';
}

export function isUnitInfo(entity: Readonly<{ type: EntityType }>): entity is UnitInfo {
  const entityType = getEntityInfoGroup(entity);
  return entityType === 'land' || entityType === 'air' || entityType === 'naval';
}
