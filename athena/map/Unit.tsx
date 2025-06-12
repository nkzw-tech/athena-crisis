import sortBy from '@nkzw/core/sortBy.js';
import UnknownTypeError from '@nkzw/core/UnknownTypeError.js';
import { LowHealthZombieSkillConversion, Skill } from '../info/Skill.tsx';
import {
  Ability,
  Dragon,
  getUnitInfo,
  Saboteur,
  Sniper,
  Supply,
  UnitInfo,
  Weapon,
  WeaponID,
} from '../info/Unit.tsx';
import getUnitName from '../info/UnitNames.tsx';
import filterNullables from '../lib/filterNullables.tsx';
import { ID } from '../MapData.tsx';
import { AIBehavior, AIBehaviors } from './AIBehavior.tsx';
import Entity, { PlainEntity } from './Entity.tsx';
import Player, { PlayerID, PlayerIDSet, toPlayerID } from './Player.tsx';

type PlainAmmo = ReadonlyArray<[number, number]>;

export type PlainDryUnit =
  | number
  | [health: number, ammo: PlainAmmo]
  | [health: number, ammo: PlainAmmo | null, statusEffect: UnitStatusEffect];

type Ammo = ReadonlyMap<WeaponID, Supply>;

export type UnitConversion = Readonly<{
  from: UnitInfo;
  onlyLeader?: true;
  recover?: true;
  to: UnitInfo;
}>;

export enum UnitStatusEffect {
  Poison = 1,
}

const formatStatusEffect = (statusEffect: UnitStatusEffect | null) => {
  if (statusEffect) {
    switch (statusEffect) {
      case UnitStatusEffect.Poison:
        return 'Poison';
      default: {
        statusEffect satisfies never;
        throw new UnknownTypeError('formatStatusEffect', statusEffect);
      }
    }
  }

  return null;
};

export type PlainTransportedUnit = Readonly<
  Omit<PlainEntity, 'f'> & {
    a?: PlainAmmo | null;
    b?: AIBehavior | null;
    g: number;
    m?: 1 | null;
    n?: number | null;
    s?: UnitStatusEffect | null;
    t?: ReadonlyArray<PlainTransportedUnit> | null;
  }
>;

export type PlainUnit = Readonly<
  PlainEntity & {
    a?: PlainAmmo | null;
    b?: AIBehavior | null;
    c?: 1 | null;
    d?: 1 | null;
    g: number;
    l?: number;
    m?: 1 | null;
    n?: number | null;
    r?: PlayerID | null;
    s?: UnitStatusEffect | null;
    t?: ReadonlyArray<PlainTransportedUnit> | null;
    u?: 1 | null;
  }
>;

export class DryUnit {
  // This is only used for formatting.
  public readonly info = { name: 'DryUnit' };

  constructor(
    public readonly health: number,
    public readonly ammo: Ammo | null,
    public readonly statusEffect: UnitStatusEffect | null,
  ) {}

  static fromJSON(dryUnit: PlainDryUnit): DryUnit {
    if (typeof dryUnit === 'number') {
      return new DryUnit(dryUnit, null, null);
    }
    const [health, ammo, statusEffect] = dryUnit;
    return new DryUnit(
      health,
      ammo ? new Map(ammo) : null,
      statusEffect || null,
    );
  }

  toJSON(): PlainDryUnit {
    const { ammo: a, health, statusEffect } = this;
    const ammo = a?.size ? [...a] : null;
    return statusEffect
      ? [health, ammo, statusEffect]
      : ammo
        ? [health, ammo]
        : health;
  }

  format() {
    const { ammo: a, health, statusEffect } = this;
    const ammo = a?.size ? { ammo: [...a] } : null;
    return {
      health,
      ...ammo,
      ...(statusEffect
        ? { statusEffect: formatStatusEffect(statusEffect) }
        : null),
    };
  }
}

export class TransportedUnit {
  public readonly info: UnitInfo;

  constructor(
    public readonly id: ID,
    public readonly health: number,
    public readonly player: PlayerID,
    public readonly fuel: number,
    public readonly ammo: Ammo | null,
    public readonly transports: ReadonlyArray<TransportedUnit> | null,
    private readonly moved: true | null,
    public readonly label: PlayerID | null,
    private readonly name: number | null,
    private readonly behavior: AIBehavior | null,
    public readonly statusEffect: UnitStatusEffect | null,
  ) {
    const unitInfo = getUnitInfo(id);
    if (!unitInfo) {
      throw new Error(`Invalid unit '${id}'.`);
    }
    this.info = unitInfo;
  }

  static fromJSON(unit: PlainTransportedUnit): TransportedUnit {
    const { a, b, g, h, i, l, m, n, p, s, t } = unit;
    return new TransportedUnit(
      i,
      h,
      toPlayerID(p),
      g,
      a ? new Map(a) : null,
      t ? t.map(TransportedUnit.fromJSON) : null,
      m === 1 ? true : null,
      l != null ? toPlayerID(l) : null,
      n ?? null,
      b || null,
      s || null,
    );
  }

  deploy(): Unit {
    return new Unit(
      this.id,
      this.health,
      this.player,
      this.fuel,
      this.ammo,
      this.transports,
      true,
      null,
      null,
      null,
      this.moved || this.info.hasAbility(Ability.HeavyEquipment) ? true : null,
      this.label,
      this.name,
      this.behavior,
      this.statusEffect,
      null,
    );
  }

  count(): number {
    return (
      1 + (this.transports?.reduce((sum, unit) => sum + unit.count(), 0) || 0)
    );
  }

  hasValidBehavior() {
    return !this.behavior || AIBehaviors.has(this.behavior);
  }

  withName(name: number | null): TransportedUnit {
    return name !== this.name ? this.copy({ name }) : this;
  }

  isLeader() {
    return this.name != null && this.name < 0;
  }

  removeLeader(): this {
    let unit = this;

    if (unit.transports?.length) {
      unit = unit.copy({
        transports: unit.transports.map((unit) => unit.removeLeader()),
      });
    }

    return unit.isLeader() ? unit.copy({ name: null }) : unit;
  }

  maybeConvert(conversion: UnitConversion): TransportedUnit {
    const { from, onlyLeader, recover, to } = conversion;
    let unit =
      from.id === this.id && (!onlyLeader || this.isLeader())
        ? to
            .create(this.player, {
              behavior: this.behavior,
              label: this.label,
            })
            .setHealth(this.health)
            .copy({
              moved: !recover && this.moved ? true : undefined,
              transports: this.transports,
            })
            .transport()
        : this;

    if (unit.transports?.length) {
      unit = unit.copy({
        transports: unit.transports.map((unit) =>
          unit.maybeConvert(conversion),
        ),
      });
    }

    return unit;
  }

  hasName() {
    return !!(this.name != null && getUnitName(this.info.gender, this.name));
  }

  hasValidName() {
    return this.name == null || getUnitName(this.info.gender, this.name);
  }

  getName(viewer?: PlayerID | null) {
    if (this.isLeader() && viewer === this.player) {
      return this.info.characterName;
    }
    return (
      (this.name != null && getUnitName(this.info.gender, this.name)) || null
    );
  }

  isTransportingUnits(): this is {
    transports: ReadonlyArray<TransportedUnit>;
  } {
    return (this.transports?.length || 0) > 0;
  }

  recover(): this {
    let unit = this;

    if (unit.transports?.length) {
      unit = unit.copy({
        transports: unit.transports.map((unit) => unit.recover()),
      });
    }

    return unit.moved ? unit.copy({ moved: null }) : unit;
  }

  setPlayer(player: PlayerID): this {
    let unit = this;

    if (unit.transports?.length) {
      unit = unit.copy({
        transports: unit.transports.map((unit) => unit.setPlayer(player)),
      });
    }

    return unit.player !== player ? unit.copy({ player }) : unit;
  }

  dropLabel(labels: PlayerIDSet): this {
    let unit = this;

    if (unit.transports?.length) {
      unit = unit.copy({
        transports: unit.transports.map((unit) => unit.dropLabel(labels)),
      });
    }

    return unit.label != null && labels.has(unit.label)
      ? unit.copy({ label: null })
      : unit;
  }

  toJSON(): PlainTransportedUnit {
    const {
      ammo,
      behavior: b,
      fuel: g,
      health: h,
      id: i,
      label: l,
      moved,
      name: n,
      player: p,
      statusEffect: s,
      transports,
    } = this;
    const a = ammo?.size ? [...ammo] : null;
    const t = transports ? transports.map((unit) => unit.toJSON()) : null;
    return filterNullables({
      a,
      b,
      g,
      h,
      i,
      l: l != null ? l : undefined,
      m: moved ? 1 : null,
      n,
      p,
      s,
      t,
    });
  }

  format(): Record<string, unknown> {
    const {
      ammo: a,
      behavior,
      fuel,
      health,
      id,
      label,
      moved,
      player,
      statusEffect,
      transports: t,
    } = this;
    const ammo = a?.size ? [...a] : null;
    const transports = t ? t.map((unit) => unit.format()) : null;
    return filterNullables({
      ammo,
      behavior,
      fuel,
      health,
      id,
      label,
      moved,
      name: this.getName(player),
      player,
      statusEffect: formatStatusEffect(statusEffect),
      transports,
    });
  }

  copy({
    ammo,
    behavior,
    fuel,
    health,
    id,
    label,
    moved,
    name,
    player,
    statusEffect,
    transports,
  }: {
    ammo?: Ammo | null;
    behavior?: AIBehavior | null;
    fuel?: number;
    health?: number;
    id?: ID;
    label?: PlayerID | null;
    moved?: true | null;
    name?: number | null;
    player?: PlayerID;
    statusEffect?: UnitStatusEffect | null;
    transports?: ReadonlyArray<TransportedUnit> | null;
  }): this {
    return new TransportedUnit(
      id ?? this.id,
      health ?? this.health,
      player ?? this.player,
      fuel ?? this.fuel,
      ammo !== undefined ? ammo : this.ammo,
      transports !== undefined ? transports : this.transports,
      moved !== undefined ? moved : this.moved,
      label !== undefined ? label : this.label,
      name !== undefined ? name : this.name,
      behavior !== undefined ? behavior : this.behavior,
      statusEffect !== undefined ? statusEffect : this.statusEffect,
    ) as this;
  }
}

export default class Unit extends Entity {
  public readonly info: UnitInfo;

  constructor(
    id: ID,
    health: number,
    player: PlayerID,
    public readonly fuel: number,
    public readonly ammo: Ammo | null,
    public readonly transports: ReadonlyArray<TransportedUnit> | null,
    private readonly moved: true | null,
    private readonly capturing: true | null,
    private readonly rescuing: PlayerID | null,
    private readonly unfolded: true | null,
    completed: true | null,
    label: PlayerID | null,
    private readonly name: number | null,
    private readonly behavior: AIBehavior | null,
    public readonly statusEffect: UnitStatusEffect | null,
    public readonly shield: true | null,
  ) {
    super(id, health, player, completed, label);
    const unitInfo = getUnitInfo(id);
    if (!unitInfo) {
      throw new Error(`Invalid unit '${id}'.`);
    }
    this.info = unitInfo;

    // If a unit's definition changes and it receives a weapon,
    // it should be given a supply of ammo.
    if (!this.ammo && this.info.hasAttack()) {
      this.ammo = this.info.getAmmunitionSupply();
    }
  }

  static fromJSON(unit: PlainUnit): Unit {
    const { a, b, c, d, f, g, h, i, l, m, n, p, r, s, t, u } = unit;
    return new Unit(
      i,
      h,
      toPlayerID(p),
      g,
      a ? new Map(a) : null,
      t ? t.map(TransportedUnit.fromJSON) : null,
      m === 1 ? true : null,
      c === 1 ? true : null,
      r != null && p === 0 ? r : null,
      u === 1 ? true : null,
      f === 1 ? true : null,
      l != null ? toPlayerID(l) : null,
      n ?? null,
      b || null,
      s || null,
      d === 1 ? true : null,
    );
  }

  matchesBehavior(behavior: AIBehavior) {
    return behavior === AIBehavior.Attack
      ? this.behavior == null || this.behavior === AIBehavior.Attack
      : this.behavior === behavior;
  }

  hasMoved() {
    return !!this.moved;
  }

  hasFuel() {
    return this.fuel > 0;
  }

  canMove() {
    return (
      !this.hasMoved() &&
      this.hasFuel() &&
      (!this.isUnfolded() || !this.info.hasAbility(Ability.Unfold))
    );
  }

  canCapture(player: Player | null) {
    return (
      this.info.hasAbility(Ability.Capture) ||
      (this.info === Sniper &&
        this.isLeader() &&
        !this.isUnfolded() &&
        player?.skills.has(Skill.UnitAbilitySniperImmediateAction)) ||
      (this.info === Dragon && player?.skills.has(Skill.DragonSaboteur))
    );
  }

  canAttack(player: Player) {
    return (
      this.info.hasAttack() &&
      (!this.info.hasAbility(Ability.Unfold) ||
        this.isUnfolded() ||
        (this.info === Sniper &&
          this.isLeader() &&
          player.skills.has(Skill.UnitAbilitySniperImmediateAction)))
    );
  }

  canAttackAt(distance: number, player: Player) {
    return (
      this.canAttack(player) &&
      this.info.canAttackAt(distance, this.info.getRangeFor(player))
    );
  }

  canConvert(player: Player) {
    return (
      this.info.hasAbility(Ability.Convert) ||
      (this.info === Saboteur && player.activeSkills.has(Skill.Sabotage)) ||
      (this.health < LowHealthZombieSkillConversion &&
        player.skills.has(Skill.UnlockZombie))
    );
  }

  getAttackWeapon(entity: Entity) {
    const { primaryWeapon, weapons } = this.info.attack;
    if (weapons) {
      if (weapons.size === 1 && primaryWeapon) {
        return weaponCanAttack(primaryWeapon, this.ammo, entity)
          ? primaryWeapon
          : null;
      }

      for (const weapon of sortBy(
        [...weapons.values()],
        (weapon) => -weapon.getDamage(entity),
      )) {
        if (weaponCanAttack(weapon, this.ammo, entity)) {
          return weapon;
        }
      }
    }
    return null;
  }

  isOutOfAmmo() {
    return !!(this.ammo && [...this.ammo].every(([, s]) => s === 0));
  }

  isCapturing() {
    return !!this.capturing;
  }

  isBeingRescued() {
    return !!this.rescuing;
  }

  getRescuer(): PlayerID | null {
    return this.rescuing;
  }

  isBeingRescuedBy(player: PlayerID) {
    return this.rescuing === player;
  }

  isTransportingUnits(): this is {
    transports: ReadonlyArray<TransportedUnit>;
  } {
    return (this.transports?.length || 0) > 0;
  }

  getTransportedUnit(index: number) {
    return this.transports?.[index] || null;
  }

  isFull() {
    const info = this.info;
    return !!(
      info.canTransportUnits() &&
      (this.transports?.length || 0) >= info.transports.limit
    );
  }

  isUnfolded() {
    return !!this.unfolded;
  }

  move(): this {
    return !this.moved || this.capturing
      ? this.copy({
          capturing: null,
          moved: true,
        })
      : this;
  }

  capture(): this {
    return !this.capturing ? this.copy({ capturing: true }) : this;
  }

  stopCapture(): this {
    return this.capturing ? this.copy({ capturing: null }) : this;
  }

  rescue(rescuing: PlayerID): this {
    return this.rescuing !== rescuing ? this.copy({ rescuing }) : this;
  }

  stopBeingRescued(): this {
    return this.rescuing ? this.copy({ rescuing: null }) : this;
  }

  unfold(): this {
    return !this.unfolded && this.info.abilities.has(Ability.Unfold)
      ? this.stopCapture().copy({ unfolded: true })
      : this;
  }

  fold(): this {
    return this.capturing || this.unfolded
      ? this.copy({ capturing: null, unfolded: null })
      : this;
  }

  setAmmo(ammo: Ammo | null): this {
    return this.copy({ ammo });
  }

  modifyFuel(change: number): this {
    return this.setFuel(this.fuel + change);
  }

  setFuel(fuel: number): this {
    return this.copy({
      fuel: Math.max(0, Math.min(fuel, this.info.configuration.fuel)),
    });
  }

  refill(): this {
    const info = this.info;
    return this.copy({
      ammo: info.getAmmunitionSupply(),
      fuel: info.configuration.fuel,
    });
  }

  recover(): this {
    let unit = this;

    if (unit.transports?.length) {
      unit = unit.copy({
        transports: unit.transports.map((unit) => unit.recover()),
      });
    }

    return unit.moved || unit.completed
      ? unit.copy({ completed: null, moved: null })
      : unit;
  }

  complete(): this {
    return !this.completed || !this.moved
      ? this.copy({
          completed: true,
          moved: true,
        })
      : this;
  }

  sabotage(): this {
    return this.copy({
      ammo: sabotageAmmo(this.ammo, this.info),
      fuel: Math.max(
        0,
        this.fuel - Math.ceil(this.info.configuration.fuel * 0.33),
      ),
    });
  }

  subtractAmmo(weapon: Weapon, amount = 1): this {
    const { ammo } = this;
    const supply = ammo?.get(weapon.id);
    return supply != null
      ? this.copy({
          ammo: new Map(ammo).set(weapon.id, Math.max(0, supply - amount)),
        })
      : this;
  }

  setAIBehavior(behavior: AIBehavior | null): this {
    return this.copy({ behavior });
  }

  maybeUpdateAIBehavior(): this {
    return this.behavior === AIBehavior.Adaptive
      ? this.setAIBehavior(AIBehavior.Attack)
      : this;
  }

  load(unit: TransportedUnit): this {
    const { transports } = this;
    return this.copy({
      transports: transports ? [...transports, unit] : [unit],
    });
  }

  drop(unit: TransportedUnit): this {
    let { transports } = this;
    if (transports) {
      transports = transports.filter(
        (transportedUnit) => transportedUnit !== unit,
      );
    }
    return this.copy({
      transports: transports == null || !transports.length ? null : transports,
    });
  }

  transport(): TransportedUnit {
    return new TransportedUnit(
      this.id,
      this.health,
      this.player,
      this.fuel,
      this.ammo,
      this.transports,
      true,
      this.label,
      this.name,
      this.behavior,
      this.statusEffect,
    );
  }

  dry(): DryUnit {
    return new DryUnit(this.health, this.ammo, this.statusEffect);
  }

  count(): number {
    return (
      1 + (this.transports?.reduce((sum, unit) => sum + unit.count(), 0) || 0)
    );
  }

  hasValidBehavior() {
    return !this.behavior || AIBehaviors.has(this.behavior);
  }

  withName(name: number | null): Unit {
    return name !== this.name ? this.copy({ name }) : this;
  }

  isLeader() {
    return this.name != null && this.name < 0;
  }

  removeLeader(): this {
    let unit = this;

    if (unit.transports?.length) {
      unit = unit.copy({
        transports: unit.transports.map((unit) => unit.removeLeader()),
      });
    }

    return unit.isLeader() ? unit.copy({ name: null }) : unit;
  }

  maybeConvert(conversion: UnitConversion): Unit {
    const { from, onlyLeader, recover, to } = conversion;
    let unit =
      from.id === this.id && (!onlyLeader || this.isLeader())
        ? to
            .create(this.player, {
              behavior: this.behavior,
              label: this.label,
            })
            .setHealth(this.health)
            .copy({
              completed: !recover && this.isCompleted() ? true : undefined,
              moved: !recover && this.hasMoved() ? true : undefined,
              shield: this.shield,
              transports: this.transports,
            })
        : this;

    if (unit.transports?.length) {
      unit = unit.copy({
        transports: unit.transports.map((unit) =>
          unit.maybeConvert(conversion),
        ),
      });
    }

    return unit;
  }

  hasName() {
    return !!(this.name != null && getUnitName(this.info.gender, this.name));
  }

  hasValidName() {
    return this.name == null || getUnitName(this.info.gender, this.name);
  }

  getName(viewer?: PlayerID | null) {
    if (this.isLeader() && viewer === this.player) {
      return this.info.characterName;
    }
    return (
      (this.name != null && getUnitName(this.info.gender, this.name)) || null
    );
  }

  override setPlayer(player: PlayerID): this {
    let unit = this;

    if (unit.transports?.length) {
      unit = unit.copy({
        transports: unit.transports.map((unit) => unit.setPlayer(player)),
      });
    }

    if (player !== 0 && unit.rescuing) {
      unit = unit.copy({ rescuing: null });
    }

    return unit.player !== player ? unit.copy({ player }) : unit;
  }

  maybeSetPlayer(
    player: PlayerID | null | undefined,
    state: 'complete' | 'recover',
  ): this {
    return player != null && player !== this.player
      ? this.setPlayer(player)[state]()
      : this;
  }

  setStatusEffect(statusEffect: UnitStatusEffect | null): this {
    return this.statusEffect !== statusEffect
      ? this.copy({ statusEffect })
      : this;
  }

  removeStatusEffect(): this {
    return this.statusEffect ? this.copy({ statusEffect: null }) : this;
  }

  ensureValidAttributes() {
    const { info } = this;
    let unit = this;
    if (unit.fuel > info.configuration.fuel) {
      unit = unit.setFuel(info.configuration.fuel);
    }
    if (this.ammo) {
      let ammo: Map<number, number> | null = null;
      for (const [id, currentSupply] of this.ammo) {
        const supply = info.attack.weapons?.get(id)?.supply;
        if (supply != null && supply < currentSupply) {
          if (!ammo) {
            ammo = new Map(this.ammo);
            unit = unit.setAmmo(ammo);
          }
          ammo.set(id, supply);
        }
      }
    }

    if (unit.transports?.length) {
      unit = unit.copy({
        transports: unit.transports?.map((transportedUnit) =>
          transportedUnit.deploy().ensureValidAttributes().transport(),
        ),
      });
    }

    return unit;
  }

  override dropLabel(labels: PlayerIDSet): this {
    let unit = this;

    if (unit.transports?.length) {
      unit = unit.copy({
        transports: unit.transports.map((unit) => unit.dropLabel(labels)),
      });
    }

    return unit.label != null && labels.has(unit.label)
      ? unit.copy({ label: null })
      : unit;
  }

  activateShield(): this {
    return this.shield ? this : this.copy({ shield: true });
  }

  deactivateShield(): this {
    return this.shield ? this.copy({ shield: null }) : this;
  }

  override toJSON(): PlainUnit {
    const {
      ammo,
      behavior: b,
      capturing,
      completed,
      fuel: g,
      health: h,
      id: i,
      label: l,
      moved,
      name: n,
      player: p,
      rescuing: r,
      shield: d,
      statusEffect: s,
      transports,
      unfolded,
    } = this;
    return filterNullables({
      a: ammo?.size ? [...ammo] : null,
      b,
      c: capturing ? 1 : null,
      d: d ? 1 : null,
      f: completed ? 1 : null,
      g,
      h,
      i,
      l: l != null ? l : undefined,
      m: moved ? 1 : null,
      n,
      p,
      r: r != null && p === 0 ? r : null,
      s,
      t: transports ? transports.map((unit) => unit.toJSON()) : null,
      u: unfolded ? 1 : null,
    });
  }

  override format(): Record<string, unknown> {
    const {
      ammo,
      behavior,
      capturing,
      completed,
      fuel,
      health,
      id,
      label,
      moved,
      player,
      rescuing,
      shield,
      statusEffect,
      transports,
      unfolded,
    } = this;
    return filterNullables({
      /* eslint-disable perfectionist/sort-objects */
      id,
      health,
      player,
      fuel,
      ammo: ammo?.size ? [...ammo] : null,
      transports: transports ? transports.map((unit) => unit.format()) : null,
      moved,
      name: this.getName(player),
      capturing,
      rescuing,
      unfolded,
      statusEffect: formatStatusEffect(statusEffect),
      completed,
      label,
      behavior,
      shield,
      /* eslint-enable perfectionist/sort-objects */
    });
  }

  copy({
    ammo,
    behavior,
    capturing,
    completed,
    fuel,
    health,
    id,
    label,
    moved,
    name,
    player,
    rescuing,
    shield,
    statusEffect,
    transports,
    unfolded,
  }: {
    ammo?: Ammo | null;
    behavior?: AIBehavior | null;
    capturing?: true | null;
    completed?: true | null;
    fuel?: number;
    health?: number;
    id?: ID;
    label?: PlayerID | null;
    moved?: true | null;
    name?: number | null;
    player?: PlayerID;
    rescuing?: PlayerID | null;
    shield?: true | null;
    statusEffect?: UnitStatusEffect | null;
    transports?: ReadonlyArray<TransportedUnit> | null;
    unfolded?: true | null;
  }): this {
    return new Unit(
      id ?? this.id,
      health ?? this.health,
      player ?? this.player,
      fuel ?? this.fuel,
      ammo !== undefined ? ammo : this.ammo,
      transports !== undefined ? transports : this.transports,
      moved !== undefined ? moved : this.moved,
      capturing !== undefined ? capturing : this.capturing,
      rescuing !== undefined ? rescuing : this.rescuing,
      unfolded !== undefined ? unfolded : this.unfolded,
      completed !== undefined ? completed : this.completed,
      label !== undefined ? label : this.label,
      name !== undefined ? name : this.name,
      behavior !== undefined ? behavior : this.behavior,
      statusEffect !== undefined ? statusEffect : this.statusEffect,
      shield !== undefined ? shield : this.shield,
    ) as this;
  }
}

UnitInfo.setConstructor(Unit);

const sabotageAmmo = (ammo: Ammo | null, info: UnitInfo) => {
  if (!ammo) {
    return null;
  }
  const newAmmo = new Map();
  for (const [id, supply] of ammo) {
    newAmmo.set(
      id,
      Math.max(
        0,
        supply - Math.ceil((info.attack.weapons?.get(id)?.supply || 3) * 0.33),
      ),
    );
  }
  return newAmmo;
};

const weaponCanAttack = (weapon: Weapon, ammo: Ammo | null, entity: Entity) =>
  weapon &&
  weapon.getDamage(entity) > 0 &&
  (!weapon.supply || (ammo?.get(weapon.id) || 0) > 0);
