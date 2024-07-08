import UnknownTypeError from '@deities/hephaestus/UnknownTypeError.tsx';
import formatText from '../lib/formatText.tsx';
import { AIBehavior } from '../map/AIBehavior.tsx';
import { MaxHealth } from '../map/Configuration.tsx';
import Entity, { EntityType } from '../map/Entity.tsx';
import Player, { PlayerID } from '../map/Player.tsx';
import SpriteVector from '../map/SpriteVector.tsx';
import type Unit from '../map/Unit.tsx';
import { ID } from '../MapData.tsx';
import { AttackSprite } from './AttackSprite.tsx';
import { MovementType, MovementTypes } from './MovementType.tsx';
import { SoundName } from './Music.tsx';
import {
  getUnitCost,
  getUnitRadius,
  getUnitRange,
  hasUnlockedUnit,
  Skill,
} from './Skill.tsx';
import { SpriteVariant } from './SpriteVariants.tsx';
import type { TileInfo } from './Tile.tsx';
import UnitID from './UnitID.tsx';

let _unitClass: typeof Unit;
const sprite = (x: number, y: number) => new SpriteVector(x, y);

export enum Ability {
  AccessBuildings,
  Capture,
  CreateBuildings,
  CreateTracks,
  Heal,
  MoveAndAct,
  Rescue,
  Sabotage,
  Supply,
  Unfold,
}

export const Abilities = [
  Ability.AccessBuildings,
  Ability.Capture,
  Ability.CreateBuildings,
  Ability.CreateTracks,
  Ability.Heal,
  Ability.MoveAndAct,
  Ability.Rescue,
  Ability.Sabotage,
  Ability.Supply,
  Ability.Unfold,
] as const;

export enum AttackType {
  LongRange,
  None,
  ShortRange,
}

export type UnitAnimationSprite = {
  fade?: boolean;
  frames: number;
  offset?: { x?: number; y?: number };
  position: SpriteVector;
};

export type AttackStance = 'long' | 'short' | 'once' | false;
export type Gender = 'male' | 'female' | 'unknown';

type SpriteConfig = {
  alternative?: SpriteVector;
  alternativeExplosionSprite?: UnitAnimationSprite;
  attackStance: AttackStance;
  direction?: 'left' | 'right';
  directionOffset: 1 | 2 | 3;
  explosionSprite?: UnitAnimationSprite;
  healSprite?: UnitAnimationSprite;
  invert: boolean;
  leaderAlternative?: boolean;
  name: SpriteVariant;
  offset?: { x?: number; y?: number };
  portrait: {
    position: SpriteVector;
    variants: 3 | 6;
  };
  position?: SpriteVector;
  slow?: boolean;
  transports?: SpriteVector;
  transportsMany?: SpriteVector;
  unfold?: SpriteVector;
  unfoldSounds?: {
    fold: SoundName;
    unfold: SoundName;
  };
  unfoldSprite?: {
    frames: number;
    position: SpriteVector;
  };
  withNavalExplosion?: boolean;
};

class UnitAbilities {
  private readonly accessBuildings: boolean;
  private readonly capture: boolean;
  private readonly createBuildings: boolean;
  private readonly createTracks: boolean;
  private readonly heal: boolean;
  private readonly moveAndAct: boolean;
  private readonly rescue: boolean;
  private readonly sabotage: boolean;
  private readonly supply: boolean;
  private readonly unfold: boolean;

  constructor({
    accessBuildings,
    capture,
    createBuildings,
    createTracks,
    heal,
    moveAndAct,
    rescue,
    sabotage,
    supply,
    unfold,
  }: {
    accessBuildings?: boolean;
    capture?: boolean;
    createBuildings?: boolean;
    createTracks?: boolean;
    heal?: boolean;
    moveAndAct?: boolean;
    rescue?: boolean;
    sabotage?: boolean;
    supply?: boolean;
    unfold?: boolean;
  } = {}) {
    this.accessBuildings = accessBuildings ?? false;
    this.capture = capture ?? false;
    this.createBuildings = createBuildings ?? false;
    this.createTracks = createTracks ?? false;
    this.heal = heal ?? false;
    this.moveAndAct = moveAndAct ?? false;
    this.rescue = rescue ?? false;
    this.sabotage = sabotage ?? false;
    this.supply = supply ?? false;
    this.unfold = unfold ?? false;
  }

  has(ability: Ability) {
    switch (ability) {
      case Ability.AccessBuildings:
        return this.accessBuildings;
      case Ability.Capture:
        return this.capture;
      case Ability.CreateBuildings:
        return this.createBuildings;
      case Ability.CreateTracks:
        return this.createTracks;
      case Ability.Heal:
        return this.heal;
      case Ability.MoveAndAct:
        return this.moveAndAct;
      case Ability.Rescue:
        return this.rescue;
      case Ability.Sabotage:
        return this.sabotage;
      case Ability.Supply:
        return this.supply;
      case Ability.Unfold:
        return this.unfold;
      default: {
        ability satisfies never;
        throw new UnknownTypeError('UnitBehaviors.has', ability);
      }
    }
  }
}

type WeaponPositions = Readonly<{
  down?: SpriteVector;
  horizontal: SpriteVector;
  horizontalAlternative?: SpriteVector;
  up?: SpriteVector;
}>;

type WeaponAnimationConfiguaration = Readonly<{
  cell?: number;
  frames: number;
  leadingFrames?: number;
  mirror?: boolean;
  positions?: WeaponPositions;
  recoil: boolean;
  recoilDelay?: number;
  repeat?: number;
  rotate?: boolean;
  size?: number;
  trailingFrames?: number;
  unfoldPositions?: WeaponPositions;
}>;

export type AttackSpriteWithVariants = 'AttackOctopus';

export class WeaponAnimation {
  public readonly cell: number;
  public readonly frames: number;
  public readonly leadingFrames: number;
  public readonly mirror: boolean;
  public readonly positions: WeaponPositions | undefined;
  public readonly unfoldPositions: WeaponPositions | undefined;
  public readonly recoil: boolean;
  public readonly recoilDelay: number;
  public readonly repeat: number;
  public readonly rotate: boolean;
  public readonly size: number;
  public readonly trailingFrames: number;

  constructor(
    public readonly sprite: AttackSprite | AttackSpriteWithVariants,
    public readonly sound: SoundName | null,
    {
      cell,
      frames,
      leadingFrames,
      mirror,
      positions,
      recoil,
      recoilDelay,
      repeat,
      rotate,
      size,
      trailingFrames,
      unfoldPositions,
    }: WeaponAnimationConfiguaration,
  ) {
    this.cell = cell ?? 0;
    this.frames = frames;
    this.leadingFrames = leadingFrames || 0;
    this.mirror = mirror ?? false;
    this.positions = positions;
    this.unfoldPositions = unfoldPositions;
    this.recoil = recoil ?? true;
    this.recoilDelay = recoilDelay ?? this.frames;
    this.repeat = repeat ?? 1;
    this.rotate = rotate ?? true;
    this.size = size ?? 32;
    this.trailingFrames = trailingFrames || 0;
  }

  public getPosition(
    style: 'unfold' | null,
    direction: 'left' | 'right' | 'up' | 'down',
    mirror = false,
  ) {
    const positions =
      (style === 'unfold' && this.unfoldPositions) || this.positions;
    if (positions) {
      const offsetDirection =
        direction === 'left' || direction === 'right'
          ? 'horizontal'
          : direction;
      const alternative =
        mirror &&
        offsetDirection === 'horizontal' &&
        positions.horizontalAlternative;
      if (alternative) {
        return direction === 'left'
          ? { ...alternative, x: alternative.x * -1 }
          : alternative;
      }
      return positions[offsetDirection];
    }
    return null;
  }

  public copy({
    cell,
    frames,
    mirror,
    positions,
    recoil,
    repeat,
    rotate,
    size,
    sound,
  }: Omit<WeaponAnimationConfiguaration, 'frames' | 'recoil'> & {
    frames?: number;
    recoil?: boolean;
    sound?: SoundName;
  }): WeaponAnimation {
    return new WeaponAnimation(this.sprite, sound || this.sound, {
      cell: cell ?? this.cell,
      frames: frames ?? this.frames,
      mirror: mirror ?? this.mirror,
      positions: positions ?? this.positions,
      recoil: recoil ?? this.recoil,
      repeat: repeat ?? this.repeat,
      rotate: rotate ?? this.rotate,
      size: size ?? this.size,
    });
  }

  withSound(sound: SoundName) {
    return this.copy({ sound });
  }

  withTrailingFrames(trailingFrames: number) {
    return this.copy({ trailingFrames });
  }

  public repeats(repeat: number) {
    return this.copy({ repeat });
  }
}

export type WeaponID = number;
export type Supply = number;
type DamageMap = ReadonlyMap<EntityType, number>;

export class Weapon {
  constructor(
    private readonly internalName: string,
    public readonly damage: DamageMap,
    public readonly animation: WeaponAnimation,
    public readonly hitAnimation?:
      | WeaponAnimation
      | [
          horizontal: WeaponAnimation,
          up: WeaponAnimation,
          down: WeaponAnimation,
        ],
    public readonly supply?: Supply | null,
    public readonly id: WeaponID = 1,
  ) {}

  get name() {
    Object.defineProperty(this, 'name', { value: this.internalName });
    return this.internalName;
  }

  withId(id: WeaponID): Weapon {
    return new Weapon(
      this.internalName,
      this.damage,
      this.animation,
      this.hitAnimation,
      this.supply,
      id,
    );
  }

  withName(name: string) {
    return new Weapon(
      name,
      this.damage,
      this.animation,
      this.hitAnimation,
      this.supply,
      this.id,
    );
  }

  withDamage(damage: DamageMap): Weapon {
    return new Weapon(
      this.internalName,
      damage,
      this.animation,
      this.hitAnimation,
      this.supply,
      this.id,
    );
  }

  withSupply(supply: Supply): Weapon {
    return new Weapon(
      this.internalName,
      this.damage,
      this.animation,
      this.hitAnimation,
      supply,
      this.id,
    );
  }

  withAnimationPositions(positions: WeaponPositions): Weapon {
    return new Weapon(
      this.internalName,
      this.damage,
      this.animation.copy({ positions }),
      this.hitAnimation,
      this.supply,
      this.id,
    );
  }

  getDamage(entity: Entity) {
    return this.damage.get(entity.info.type) || 0;
  }
}

type UnitConfiguration = {
  cost: number;
  fuel: number;
  healTypes?: ReadonlySet<EntityType>;
  radius: number;
  sabotageTypes?: ReadonlySet<EntityType>;
  supplyTypes?: ReadonlySet<EntityType>;
  vision: number;
};

type UnitAttackConfiguration = Readonly<{
  primaryWeapon: Weapon | null;
  type: AttackType;
  weapons: Map<WeaponID, Weapon> | null;
}>;

type UnitTransportConfiguration = Readonly<{
  limit: number;
  tiles?: ReadonlySet<number> | null;
  types: ReadonlySet<EntityType>;
}>;

export class UnitInfo {
  public readonly attack: UnitAttackConfiguration;
  public readonly configuration: Omit<UnitConfiguration, 'cost' | 'radius'>;
  private readonly cost: number;
  private readonly radius: number;
  private readonly range: [number, number] | null;
  public readonly sprite: Omit<SpriteConfig, 'direction'> & {
    direction: 1 | -1;
    position: SpriteVector;
  };
  private ammunitionSupply: ReadonlyMap<number, number> | null | undefined =
    undefined;

  constructor(
    public readonly id: ID,
    private readonly internalName: string,
    private internalCharacterName: string | UnitInfo,
    public readonly gender: Gender,
    private readonly internalDescription: string,
    private readonly internalCharacterDescription: string,
    public readonly defense: number,
    public readonly type: EntityType,
    public readonly movementType: MovementType,
    configuration: UnitConfiguration,
    public readonly abilities: UnitAbilities,
    attack: {
      range?: [number, number];
      type: AttackType;
      weapons?: ReadonlyArray<Weapon>;
    } | null,
    public readonly transports: UnitTransportConfiguration | null,
    sprite: Omit<
      SpriteConfig,
      'attackStance' | 'directionOffset' | 'invert'
    > & {
      attackStance?: 'long' | 'short' | 'once';
      directionOffset?: 1 | 2 | 3;
      invert?: false;
    },
  ) {
    this.cost = configuration.cost;
    this.radius = configuration.radius;
    this.configuration = configuration;
    this.sprite = {
      invert: true,
      ...sprite,
      attackStance: sprite.attackStance || false,
      direction: sprite.direction === 'right' ? -1 : 1,
      directionOffset: sprite.directionOffset || 1,
      position: sprite.position || new SpriteVector(0, 0),
    };

    this.range = attack?.range || null;
    this.attack = {
      type: AttackType.None,
      ...attack,
      primaryWeapon: attack?.weapons?.[0] || null,
      weapons: attack?.weapons
        ? new Map(
            attack.weapons.map((weapon, index) => [
              index + 1,
              weapon.withId(index + 1),
            ]),
          )
        : null,
    };
  }

  get name() {
    Object.defineProperty(this, 'name', { value: this.internalName });
    return this.internalName;
  }

  get characterName(): string {
    if (typeof this.internalCharacterName !== 'string') {
      return this.internalCharacterName.characterName;
    }

    Object.defineProperty(this, 'characterName', {
      value: this.internalCharacterName,
      writable: true,
    });
    return this.internalCharacterName;
  }

  getOriginalCharacterName(): string {
    return typeof this.internalCharacterName === 'string'
      ? this.internalCharacterName
      : this.internalCharacterName.getOriginalCharacterName();
  }

  hasLinkedCharacterName() {
    return typeof this.internalCharacterName !== 'string';
  }

  setCharacterName(name: string | (() => string)) {
    if (!this.hasLinkedCharacterName()) {
      if (typeof name === 'string') {
        Object.defineProperty(this, 'characterName', {
          configurable: true,
          value: name,
          writable: true,
        });
      } else {
        Object.defineProperty(this, 'characterName', {
          configurable: true,
          get: name,
        });
      }
    }
  }

  get description(): string {
    Object.defineProperty(this, 'description', {
      value: this.internalDescription,
      writable: true,
    });
    return this.internalDescription;
  }

  get characterDescription(): string {
    const description = formatText(
      this.internalCharacterDescription,
      this,
      'characterName',
    );
    Object.defineProperty(this, 'characterDescription', {
      value: description,
      writable: true,
    });
    return description;
  }

  getOriginalCharacterDescription(): string {
    return this.internalCharacterDescription;
  }

  getCostFor(player: Player | null) {
    if (!player?.skills.size) {
      return this.cost;
    }

    return getUnitCost(this, this.cost, player.skills, player.activeSkills);
  }

  getRadiusFor(player: Player | null) {
    if (!player?.skills.size) {
      return this.radius;
    }

    return getUnitRadius(this, this.radius, player.skills, player.activeSkills);
  }

  getRangeFor(player: Player | null): [number, number] | null {
    if (!this.isLongRange() || !this.range) {
      return null;
    }

    if (!player?.skills.size) {
      return this.range;
    }

    return getUnitRange(this, this.range, player.skills, player.activeSkills);
  }

  canAct(player: Player) {
    if (this.hasAbility(Ability.MoveAndAct)) {
      return true;
    }

    return (
      player.skills.size &&
      this === Battleship &&
      player.activeSkills.has(Skill.UnitBattleShipMoveAndAct)
    );
  }

  hasAttack() {
    return this.attack.type !== AttackType.None;
  }

  isShortRange() {
    return this.attack.type === AttackType.ShortRange;
  }

  isLongRange() {
    return this.attack.type === AttackType.LongRange;
  }

  canAttackAt(distance: number, range: [number, number] | null) {
    if (this.isShortRange() && distance === 1) {
      return true;
    }

    if (!this.isLongRange() || !range) {
      return false;
    }

    const [low, high] = range;
    return !!(low >= 0 && high > 0 && distance >= low && distance <= high);
  }

  canTransportUnits(): this is {
    transports: UnitTransportConfiguration;
  } {
    return !!this.transports;
  }

  canTransportUnitType(info: UnitInfo) {
    return this.transports?.types.has(info.type);
  }

  canTransport(info: UnitInfo, tile: TileInfo) {
    return !!(this.transports?.types.has(info.type) && this.canDropFrom(tile));
  }

  canDropFrom(tile: TileInfo) {
    return !!(
      this.transports &&
      (!this.transports.tiles || this.transports.tiles.has(tile.id))
    );
  }

  canSabotageUnitType(info: UnitInfo) {
    return this.configuration?.sabotageTypes?.has(info.type);
  }

  hasAbility(ability: Ability) {
    return this.abilities.has(ability);
  }

  getAmmunitionSupply(): ReadonlyMap<number, number> | null {
    if (this.ammunitionSupply === undefined) {
      const { weapons } = this.attack;
      if (weapons) {
        const actualWeapons = [...weapons]
          .filter(([, { supply }]) => supply != null)
          .map(([id, { supply }]) => [id, supply]) as ReadonlyArray<
          [number, number]
        >;
        this.ammunitionSupply = new Map(actualWeapons);
      } else {
        this.ammunitionSupply = null;
      }
    }
    return this.ammunitionSupply;
  }

  create(
    player: Player | PlayerID,
    config?: {
      behavior?: AIBehavior;
      label?: PlayerID | null;
      name?: number | null;
    },
  ) {
    return new _unitClass(
      this.id,
      MaxHealth,
      typeof player === 'number' ? player : player.id,
      this.configuration.fuel,
      this.getAmmunitionSupply(),
      null,
      null,
      null,
      null,
      null,
      null,
      config?.label != null ? config.label : null,
      config?.name ?? null,
      config?.behavior || null,
    );
  }

  static setConstructor(unitClass: typeof Unit) {
    _unitClass = unitClass;
  }
}

const buff = (map: DamageMap, change: number) =>
  new Map([...map].map(([type, damage]) => [type, damage + change]));

const MGAnimation = new WeaponAnimation('MG', 'Attack/MG', {
  frames: 8,
  positions: {
    down: sprite(0.05, 0.55),
    horizontal: sprite(-0.5, 0.25),
    up: sprite(-0.03, -0.3),
  },
  recoil: false,
  repeat: 2,
});

const AntiAirAnimation = new WeaponAnimation('AntiAir', 'Attack/AntiAirGun', {
  frames: 8,
  positions: {
    down: sprite(0, 0.35),
    horizontal: sprite(-0.35, -0.13),
    up: sprite(0, -0.45),
  },
  recoil: false,
  size: 24,
});

const ArtilleryAnimation = new WeaponAnimation(
  'Artillery',
  'Attack/Artillery',
  {
    frames: 9,
    positions: {
      down: sprite(-0.2, 0.3),
      horizontal: sprite(-0.4, -0.19),
      up: sprite(0.25, -0.45),
    },
    recoil: true,
  },
);

const HeavyArtilleryAnimation = new WeaponAnimation(
  'HeavyArtillery',
  'Attack/HeavyArtillery',
  {
    frames: 12,
    positions: {
      down: sprite(-0.2, 0.3),
      horizontal: sprite(-0.5, -0.3),
      up: sprite(0.25, -0.65),
    },
    recoil: true,
  },
);

const SparkAnimation = new WeaponAnimation('Spark', null, {
  frames: 11,
  positions: {
    horizontal: sprite(0.1, 0.2),
  },
  recoil: false,
});

const EmptyAnimation = new WeaponAnimation('Empty', null, {
  frames: 16,
  recoil: false,
});

const OctopusBiteHitAnimationPositions = {
  horizontal: sprite(0.086, 0),
};

const OctopusBiteHitAnimation = new WeaponAnimation(
  'AttackOctopus',
  'Attack/TentacleWhip',
  {
    frames: 16,
    positions: OctopusBiteHitAnimationPositions,
    recoil: false,
  },
);

const BiteAnimation = new WeaponAnimation('Empty', 'Attack/Bite', {
  frames: 15,
  recoil: false,
});

const BiteHitAnimation = new WeaponAnimation('Bite', null, {
  frames: 9,
  leadingFrames: 6,
  positions: {
    horizontal: sprite(-0.15, 0.5),
  },
  recoil: false,
  rotate: false,
  size: 64,
});

const PowHitAnimation = new WeaponAnimation('Pow', 'Attack/Pow', {
  frames: 7,
  leadingFrames: 8,
  positions: {
    horizontal: sprite(0, 0.5),
  },
  recoil: false,
  rotate: false,
  size: 64,
});

const SparkMiniAnimation = new WeaponAnimation('SparkMini', null, {
  frames: 9,
  positions: {
    horizontal: sprite(0, 0.1),
  },
  recoil: false,
  repeat: 2,
});

const SmokeAnimation = new WeaponAnimation('Smoke', null, {
  frames: 9,
  leadingFrames: 4,
  recoil: false,
  size: 40,
});

const ExplosionImpactAnimation = new WeaponAnimation(
  'ExplosionImpact',
  'ExplosionImpact',
  {
    frames: 10,
    leadingFrames: 10,
    recoil: false,
    size: 48,
  },
);

const LightGunAnimation = new WeaponAnimation('LightGun', 'Attack/LightGun', {
  frames: 13,
  positions: {
    down: sprite(-0.3, 0.95),
    horizontal: sprite(-0.9, 0.13),
    up: sprite(0.13, -0.55),
  },
  recoil: true,
  size: 36,
});
const SAMAnimation = new WeaponAnimation('SAM', 'Attack/SAM', {
  frames: 12,
  positions: {
    horizontal: sprite(0.08, -0.15),
  },
  recoil: false,
  rotate: false,
  trailingFrames: 10,
});

const LightGun = new Weapon(
  'Light Gun',
  new Map([
    [EntityType.AirInfantry, 55],
    [EntityType.Amphibious, 90],
    [EntityType.Artillery, 90],
    [EntityType.Building, 70],
    [EntityType.Ground, 90],
    [EntityType.LowAltitude, 55],
    [EntityType.Infantry, 55],
    [EntityType.Rail, 75],
    [EntityType.Ship, 30],
    [EntityType.Structure, 90],
  ]),
  LightGunAnimation,
  SmokeAnimation,
);

const AntiShipMissile = new Weapon(
  'Anti Ship Missile',
  new Map([
    [EntityType.Amphibious, 100],
    [EntityType.Artillery, 60],
    [EntityType.Ground, 60],
    [EntityType.Infantry, 50],
    [EntityType.Rail, 50],
    [EntityType.Ship, 75],
  ]),
  LightGunAnimation,
  ExplosionImpactAnimation,
).withAnimationPositions({
  down: sprite(-0.2, 0.95),
  horizontal: sprite(-0.75, 0.26),
  up: sprite(0.23, -0.55),
});

const CruiseMissile = new Weapon(
  'Cruise Missile',
  new Map([
    [EntityType.Amphibious, 80],
    [EntityType.Artillery, 90],
    [EntityType.Ground, 90],
    [EntityType.Infantry, 80],
    [EntityType.Rail, 95],
    [EntityType.Ship, 40],
  ]),
  SAMAnimation.withTrailingFrames(6),
  SmokeAnimation,
);

const HeavyGun = new Weapon(
  'Heavy Gun',
  new Map([
    [EntityType.AirInfantry, 55],
    [EntityType.Amphibious, 115],
    [EntityType.Artillery, 115],
    [EntityType.Building, 70],
    [EntityType.Ground, 115],
    [EntityType.LowAltitude, 55],
    [EntityType.Infantry, 65],
    [EntityType.Rail, 95],
    [EntityType.Ship, 50],
    [EntityType.Structure, 110],
  ]),
  new WeaponAnimation('LightGun', 'Attack/HeavyGun', {
    frames: 13,
    positions: {
      down: sprite(-0.13, 0.95),
      horizontal: sprite(-0.9, 0.13),
      up: sprite(0.25, -0.55),
    },
    recoil: true,
    recoilDelay: 6,
    size: 36,
    trailingFrames: 7,
  }),
  ExplosionImpactAnimation,
);

const MG = new Weapon(
  'MG',
  new Map([
    [EntityType.AirInfantry, 65],
    [EntityType.Amphibious, 35],
    [EntityType.Artillery, 35],
    [EntityType.Ground, 35],
    [EntityType.Infantry, 80],
  ]),
  MGAnimation,
  SparkMiniAnimation,
);

const MiniGun = new Weapon(
  'Mini Gun',
  new Map([
    [EntityType.AirInfantry, 80],
    [EntityType.Amphibious, 70],
    [EntityType.Artillery, 90],
    [EntityType.Building, 70],
    [EntityType.Ground, 70],
    [EntityType.LowAltitude, 80],
    [EntityType.Infantry, 100],
    [EntityType.Ship, 50],
    [EntityType.Structure, 50],
    [EntityType.Rail, 50],
  ]),
  new WeaponAnimation('Minigun', 'Attack/MiniGun', {
    frames: 11,
    mirror: true,
    positions: {
      down: sprite(0.28, 0.67),
      horizontal: sprite(-0.27, 0.35),
      horizontalAlternative: sprite(0.56, 0.3),
      up: sprite(0.25, -0.3),
    },
    recoil: false,
  }),
  SparkAnimation,
);

const AIUMiniGun = new Weapon(
  'Super Mini Gun',
  buff(MiniGun.damage, 40),
  new WeaponAnimation('Minigun', 'Attack/MiniGun', {
    frames: 11,
    positions: {
      down: sprite(0, 0.68),
      horizontal: sprite(-0.55, 0.1),
      up: sprite(0, -0.35),
    },
    recoil: false,
    repeat: 2,
  }),
  SparkAnimation,
);

const ArtilleryWeapon = new Weapon(
  'Artillery',
  new Map([
    [EntityType.AirInfantry, 80],
    [EntityType.Amphibious, 100],
    [EntityType.Artillery, 90],
    [EntityType.Ground, 100],
    [EntityType.LowAltitude, 80],
    [EntityType.Infantry, 100],
    [EntityType.Ship, 60],
    [EntityType.Rail, 90],
  ]),
  ArtilleryAnimation,
  SmokeAnimation,
);

const AirToAirMissile = new Weapon(
  'Air to Air Missile',
  new Map([
    [EntityType.Airplane, 115],
    [EntityType.AirInfantry, 130],
    [EntityType.LowAltitude, 130],
  ]),
  MGAnimation.withSound('Attack/AirToAirMissile'),
  SparkMiniAnimation,
);

const LightAirGun = new Weapon(
  'Light Air Gun',
  new Map([
    [EntityType.AirInfantry, 80],
    [EntityType.Amphibious, 65],
    [EntityType.Artillery, 85],
    [EntityType.Ground, 85],
    [EntityType.LowAltitude, 80],
    [EntityType.Infantry, 75],
    [EntityType.Rail, 75],
    [EntityType.Ship, 45],
  ]),
  MGAnimation,
  SparkMiniAnimation,
);

const Bomb = new Weapon(
  'Bomb',
  new Map([
    [EntityType.Amphibious, 115],
    [EntityType.Artillery, 100],
    [EntityType.Building, 70],
    [EntityType.Ground, 110],
    [EntityType.Infantry, 105],
    [EntityType.Ship, 115],
    [EntityType.Structure, 80],
    [EntityType.Rail, 110],
  ]),
  new WeaponAnimation('Bomb', 'Attack/Bomb', {
    frames: 9,
    positions: {
      down: sprite(0.3, 0.4),
      horizontal: sprite(-0.3, 0.2),
      up: sprite(-0.3, -0.4),
    },
    recoil: false,
    size: 24,
  }),
  SmokeAnimation,
);

const SoldierMG = MG.withDamage(
  new Map([
    [EntityType.AirInfantry, 65],
    [EntityType.Amphibious, 35],
    [EntityType.Artillery, 35],
    [EntityType.Ground, 35],
    [EntityType.Infantry, 60],
    [EntityType.LowAltitude, 65],
  ]),
).withAnimationPositions({
  ...MGAnimation.positions,
  horizontal: sprite(-0.5, 0.195),
});

const RocketLauncherWeapon = new Weapon(
  'Rocket Launcher',
  new Map([
    [EntityType.AirInfantry, 55],
    [EntityType.Amphibious, 100],
    [EntityType.Artillery, 100],
    [EntityType.Ground, 100],
    [EntityType.LowAltitude, 80],
    [EntityType.Infantry, 35],
    [EntityType.Rail, 70],
  ]),
  new WeaponAnimation('RocketLauncher', 'Attack/RocketLauncher', {
    frames: 11,
    positions: {
      down: sprite(-0.08, 0.9),
      horizontal: sprite(-0.97, 0.1),
      up: sprite(0.2, -0.56),
    },
    recoil: false,
  }),
);

export const Weapons = {
  AIUMiniGun,
  AirToAirMissile,
  AmphibiousLightGun: new Weapon(
    'Light Gun',
    new Map([
      ...LightGun.damage,

      [EntityType.Amphibious, 75],
      [EntityType.Ship, 55],
    ]),
    new WeaponAnimation('Amphibious', 'Attack/LightGun', {
      frames: 15,
      positions: {
        down: sprite(-0.08, 0.4),
        horizontal: sprite(-0.36, -0.07),
        up: sprite(0.1, -0.3),
      },
      recoil: true,
    }),
    SmokeAnimation,
  ),
  AntiAirGun: new Weapon(
    'Anti Air Gun',
    new Map([
      [EntityType.Airplane, 135],
      [EntityType.AirInfantry, 145],
      [EntityType.Amphibious, 65],
      [EntityType.Artillery, 65],
      [EntityType.Building, 70],
      [EntityType.Ground, 55],
      [EntityType.LowAltitude, 145],
      [EntityType.Infantry, 50],
      [EntityType.Structure, 20],
      [EntityType.Rail, 60],
    ]),
    AntiAirAnimation.repeats(2),
    SparkMiniAnimation,
  ),
  AntiArtilleryGun: new Weapon(
    'Anti Artillery Gun',
    new Map([[EntityType.Artillery, 100]]),
    MGAnimation,
  ),
  Artillery: ArtilleryWeapon,
  Battery: new Weapon(
    'Artillery Battery',
    new Map([
      [EntityType.AirInfantry, 100],
      [EntityType.Amphibious, 130],
      [EntityType.Artillery, 130],
      [EntityType.Ground, 130],
      [EntityType.LowAltitude, 100],
      [EntityType.Infantry, 110],
      [EntityType.Rail, 90],
      [EntityType.Ship, 80],
    ]),
    ArtilleryAnimation.withSound('Attack/ArtilleryBattery'),
  ),
  Bazooka: RocketLauncherWeapon.withName('Bazooka')
    .withDamage(
      new Map([
        ...RocketLauncherWeapon.damage,

        [EntityType.AirInfantry, 110],
        [EntityType.Airplane, 100],
        [EntityType.Amphibious, 110],
        [EntityType.Artillery, 110],
        [EntityType.Building, 70],
        [EntityType.Ground, 110],
        [EntityType.LowAltitude, 110],
        [EntityType.Infantry, 110],
        [EntityType.Rail, 80],
        [EntityType.Ship, 80],
        [EntityType.Structure, 80],
      ]),
    )
    .withAnimationPositions({
      down: sprite(-0.25, 0.9),
      horizontal: sprite(-0.97, 0.1),
      up: sprite(0.28, -0.8),
    }),
  Bite: new Weapon(
    'Bite',
    new Map([
      [EntityType.AirInfantry, 100],
      [EntityType.Amphibious, 100],
      [EntityType.Artillery, 100],
      [EntityType.Ground, 100],
      [EntityType.Infantry, 120],
    ]),
    BiteAnimation,
    BiteHitAnimation,
  ),
  Bomb,
  Cannon: new Weapon(
    'Cannon',
    new Map(buff(ArtilleryWeapon.damage, 10)),
    new WeaponAnimation('Cannon', 'Attack/Cannon', {
      frames: 14,
      positions: {
        down: sprite(-0.3, 2),
        horizontal: sprite(-0.97, 0.75),
        up: sprite(0.2, 0.25),
      },
      recoil: false,
      size: 80,
      trailingFrames: 6,
    }),
    ExplosionImpactAnimation,
  ),
  Club: new Weapon(
    'Club',
    new Map([
      [EntityType.AirInfantry, 100],
      [EntityType.Amphibious, 100],
      [EntityType.Artillery, 100],
      [EntityType.Ground, 100],
      [EntityType.Infantry, 120],
    ]),
    EmptyAnimation.withSound('Attack/Club'),
    PowHitAnimation,
  ),
  CruiseMissile,
  DroneBomb: Bomb.withName('Drone Bomb').withDamage(
    new Map([
      [EntityType.AirInfantry, 100],
      [EntityType.Amphibious, 50],
      [EntityType.Artillery, 50],
      [EntityType.Building, 70],
      [EntityType.Ground, 50],
      [EntityType.Infantry, 115],
      [EntityType.Structure, 50],
      [EntityType.Rail, 50],
    ]),
  ),
  Flamethrower: new Weapon(
    'Flamethrower',
    new Map([
      [EntityType.AirInfantry, 100],
      [EntityType.Amphibious, 70],
      [EntityType.Artillery, 75],
      [EntityType.Ground, 70],
      [EntityType.Infantry, 130],
      [EntityType.Structure, 80],
    ]),
    new WeaponAnimation('Flamethrower', 'Attack/Flamethrower', {
      frames: 24,
      positions: {
        down: sprite(-0.35, 1.1),
        horizontal: sprite(-1.1, -0.1),
        up: sprite(0.45, -0.9),
      },
      recoil: false,
    }),
    new WeaponAnimation('Flamethrower', null, {
      cell: 1,
      frames: 24,
      positions: {
        horizontal: sprite(0.1, 0),
      },
      recoil: false,
    }),
  ),
  HeavyArtillery: new Weapon(
    'Heavy Artillery',
    new Map([
      [EntityType.AirInfantry, 120],
      [EntityType.Amphibious, 120],
      [EntityType.Artillery, 80],
      [EntityType.Ground, 120],
      [EntityType.Infantry, 120],
      [EntityType.Ship, 80],
      [EntityType.Rail, 80],
    ]),
    HeavyArtilleryAnimation,
    SmokeAnimation,
  ),
  HeavyGun,
  LightAirGun,
  LightAirToAirMissile: AirToAirMissile.withName('Light Air To Air Missile')
    .withDamage(
      new Map([
        [EntityType.Airplane, 80],
        [EntityType.AirInfantry, 90],
        [EntityType.LowAltitude, 90],
      ]),
    )
    .withAnimationPositions({
      down: sprite(0, 0.55),
      horizontal: sprite(-0.35, 0.2),
      up: sprite(-0.03, -0.15),
    }),
  LightGun,
  MG,
  MiniGun,
  Pistol: new Weapon(
    'Pistol',
    buff(SoldierMG.damage, 20),
    new WeaponAnimation('Pistol', 'Attack/Pistol', {
      frames: 10,
      positions: {
        down: sprite(-0.1, 0.85),
        horizontal: sprite(-0.95, 0),
        up: sprite(0.22, -0.85),
      },
      recoil: true,
    }),
    SparkMiniAnimation,
  ),
  Punch: new Weapon(
    'Fist',
    new Map([
      [EntityType.AirInfantry, 50],
      [EntityType.Amphibious, 25],
      [EntityType.Artillery, 25],
      [EntityType.Ground, 25],
      [EntityType.Infantry, 50],
    ]),
    // UI/LongPress works great here, lol.
    new WeaponAnimation('Punch', 'UI/LongPress', {
      frames: 11,
      positions: {
        down: sprite(-0.1, 1),
        horizontal: sprite(-1, 0.2),
        up: sprite(0.1, -0.5),
      },
      recoil: true,
      size: 42,
      trailingFrames: 4,
    }),
    PowHitAnimation,
  ),
  Railgun: new Weapon(
    'Railgun',
    new Map([
      [EntityType.AirInfantry, 90],
      [EntityType.Amphibious, 130],
      [EntityType.Artillery, 90],
      [EntityType.Ground, 130],
      [EntityType.LowAltitude, 90],
      [EntityType.Infantry, 130],
      [EntityType.Rail, 90],
      [EntityType.Ship, 90],
    ]),
    new WeaponAnimation('Railgun', 'Attack/Railgun', {
      frames: 23,
      positions: {
        down: sprite(-0.15, 1.1),
        horizontal: sprite(-0.8, -0.1),
        up: sprite(0.15, -0.21),
      },
      recoil: true,
      recoilDelay: 17,
      size: 48,
      trailingFrames: 16,
    }),
    new WeaponAnimation('RailgunImpact', 'Attack/RailgunImpact', {
      frames: 16,
      leadingFrames: 23,
      positions: {
        horizontal: sprite(0, 0.35),
      },
      recoil: false,
      size: 64,
    }),
  ),
  Rocket: new Weapon(
    'Rocket',
    new Map([
      [EntityType.AirInfantry, 60],
      [EntityType.Airplane, 60],
      [EntityType.Amphibious, 90],
      [EntityType.Artillery, 70],
      [EntityType.Ground, 80],
      [EntityType.LowAltitude, 60],
      [EntityType.Infantry, 80],
      [EntityType.Rail, 60],
      [EntityType.Ship, 60],
    ]),
    new WeaponAnimation('Rocket', 'Attack/Rocket', {
      frames: 16,
      positions: {
        down: sprite(-0.5, 1.5),
        horizontal: sprite(-0.85, 0.17),
        up: sprite(0.8, -0.5),
      },
      recoil: true,
      size: 64,
      trailingFrames: 8,
    }),
    new WeaponAnimation('ExplosionImpact', 'ExplosionImpact', {
      frames: 10,
      leadingFrames: 14,
      recoil: false,
      size: 48,
    }),
  ),
  RocketLauncher: RocketLauncherWeapon,
  SAM: new Weapon(
    'SAM',
    new Map([
      [EntityType.Airplane, 140],
      [EntityType.AirInfantry, 150],
      [EntityType.LowAltitude, 150],
    ]),
    SAMAnimation,
    new WeaponAnimation('SAMImpact', 'Attack/SAMImpact', {
      frames: 12,
      leadingFrames: 10,
      positions: {
        horizontal: sprite(0.1, 0),
      },
      recoil: false,
      size: 42,
    }),
  ),
  SeaMG: MG.withDamage(
    new Map([
      [EntityType.AirInfantry, 80],
      [EntityType.Amphibious, 35],
      [EntityType.Artillery, 35],
      [EntityType.Ground, 35],
      [EntityType.LowAltitude, 80],
      [EntityType.Infantry, 80],
      [EntityType.Ship, 35],
    ]),
  ).withAnimationPositions({
    down: sprite(0.05, 0.55),
    horizontal: sprite(-0.3, 0.35),
    up: sprite(0.03, -0.2),
  }),
  Shotgun: new Weapon(
    'Shotgun',
    buff(SoldierMG.damage, 20),
    new WeaponAnimation('Shotgun', 'Attack/Shotgun', {
      frames: 17,
      positions: {
        down: sprite(0.1, 1.2),
        horizontal: sprite(-1, 0.115),
        up: sprite(0.1, -1),
      },
      recoil: false,
    }),
  ),
  SniperRifle: new Weapon(
    'Sniper Rifle',
    new Map([
      [EntityType.AirInfantry, 120],
      [EntityType.Amphibious, 70],
      [EntityType.Artillery, 100],
      [EntityType.Ground, 70],
      [EntityType.LowAltitude, 120],
      [EntityType.Infantry, 120],
      [EntityType.Rail, 50],
    ]),
    new WeaponAnimation('SniperRifle', 'Attack/SniperRifle', {
      frames: 14,
      positions: {
        down: sprite(0.05, 0.9),
        horizontal: sprite(-0.9, 0.23),
        up: sprite(-0.04, -0.55),
      },
      recoil: true,
      unfoldPositions: {
        down: sprite(0.05, 0.9),
        horizontal: sprite(-0.9, 0.45),
        up: sprite(-0.05, -0.75),
      },
    }),
  ),
  SoldierMG,
  SuperMiniGun: MiniGun.withName('Super Mini Gun').withDamage(
    buff(MiniGun.damage, 40),
  ),
  TentacleWhip: new Weapon(
    'Tentacle Whip',
    new Map([
      [EntityType.AirInfantry, 100],
      [EntityType.Amphibious, 100],
      [EntityType.Artillery, 100],
      [EntityType.Ground, 100],
      [EntityType.Infantry, 120],
      [EntityType.Ship, 120],
      [EntityType.Rail, 100],
    ]),
    EmptyAnimation.withSound('Attack/TentacleWhip'),
    [
      OctopusBiteHitAnimation,
      OctopusBiteHitAnimation.copy({
        cell: 1,
        positions: {
          horizontal: sprite(
            0.08,
            OctopusBiteHitAnimationPositions.horizontal.x,
          ),
        },
        rotate: false,
      }),
      OctopusBiteHitAnimation.copy({
        cell: 2,
        positions: {
          horizontal: sprite(
            -0.044,
            -OctopusBiteHitAnimationPositions.horizontal.x,
          ),
        },
        rotate: false,
      }),
    ],
  ),
  Torpedo: new Weapon(
    'Torpedo',
    new Map([
      [EntityType.Amphibious, 90],
      [EntityType.Ship, 65],
    ]),
    new WeaponAnimation('Torpedo', 'Attack/Torpedo', {
      frames: 9,
      positions: {
        down: sprite(-0.3, 0),
        horizontal: sprite(0, 0.2),
        up: sprite(0.3, 0),
      },
      recoil: false,
      trailingFrames: 14,
    }),
    new WeaponAnimation('Torpedo', 'Attack/TorpedoImpact', {
      cell: 1,
      frames: 14,
      leadingFrames: 9,
      positions: {
        down: sprite(-0.15, -0.05),
        horizontal: sprite(0.1, 0.2),
        up: sprite(0.15, -0.45),
      },
      recoil: false,
      rotate: false,
    }),
  ),
};

export const CaptureWeapon = new Weapon(
  'Capture',
  new Map(),
  MGAnimation.withSound('Unit/Load').repeats(1),
);

export const CapturedWeapon = new Weapon(
  'Capture',
  new Map(),
  EmptyAnimation.withSound('Unit/Capture').repeats(1),
);

const DefaultUnitAbilities = new UnitAbilities({
  accessBuildings: true,
  moveAndAct: true,
});
const PioneerUnitAbilities = new UnitAbilities({
  accessBuildings: true,
  capture: true,
  createBuildings: true,
  createTracks: true,
  moveAndAct: true,
  rescue: true,
});
const DefaultUnitAbilitiesWithCapture = new UnitAbilities({
  accessBuildings: true,
  capture: true,
  moveAndAct: true,
});
const HealUnitAbilities = new UnitAbilities({
  accessBuildings: true,
  heal: true,
  moveAndAct: true,
});
const SaboteurUnitAbilities = new UnitAbilities({
  accessBuildings: true,
  moveAndAct: true,
  rescue: true,
  sabotage: true,
});
const DefaultSabotageTypes = new Set([
  EntityType.AirInfantry,
  EntityType.Amphibious,
  EntityType.Artillery,
  EntityType.Building,
  EntityType.Ground,
  EntityType.Infantry,
  EntityType.Invincible,
  EntityType.LowAltitude,
  EntityType.Rail,
  EntityType.Ship,
  EntityType.Structure,
]);

export const Pioneer = new UnitInfo(
  UnitID.Pioneer,
  'Pioneer',
  'Sam',
  'male',
  `Pioneers are an essential utility unit capable of building and capturing structures as well as laying rail tracks. They lack an attack and are therefore vulnerable on the battlefield.`,
  `Joining the defense forces to become a pioneer from the countryside, {name} went through training with others in his unit as a junior recruit. Since then, he's been using his determination and growing courage to battle the enemy, often surprising himself with what he can accomplish and build on the battlefield.`,
  0,
  EntityType.Infantry,
  MovementTypes.Soldier,
  {
    cost: 100,
    fuel: 40,
    radius: 3,
    vision: 2,
  },
  PioneerUnitAbilities,
  null,
  null,
  {
    directionOffset: 2,
    explosionSprite: {
      frames: 8,
      offset: { y: 1 },
      position: sprite(7, 1),
    },
    name: 'Units-Pioneer',
    portrait: {
      position: sprite(4, 0),
      variants: 3,
    },
    slow: true,
  },
);

export const Infantry = new UnitInfo(
  UnitID.Infantry,
  'Infantry',
  'Valentin',
  'male',
  `Infantry units are standard foot soldiers, capable of capturing buildings. With minimal defense and a standard movement range, it is a balanced yet cheap unit. While Infantry is effective against all other foot soldiers, their abilities to defend against stronger units are limited.`,
  `Always wanting to be a soldier, {name} enjoys showing off his skills as Infantry on the battlefield. Coming up through the ranks of the defense forces together with Pioneers, {name} sees his duty to always press forward especially when the odds are against him. Together with his friends, he’s eager to leap into the next conflict with a battlecry.`,
  5,
  EntityType.Infantry,
  MovementTypes.Soldier,
  {
    cost: 200,
    fuel: 50,
    radius: 3,
    vision: 2,
  },
  DefaultUnitAbilitiesWithCapture,
  { type: AttackType.ShortRange, weapons: [Weapons.SoldierMG] },
  null,
  {
    attackStance: 'short',
    directionOffset: 2,
    explosionSprite: {
      frames: 8,
      offset: { y: 1 },
      position: sprite(7, 1),
    },
    name: 'Units-Infantry',
    portrait: {
      position: sprite(3, 0),
      variants: 3,
    },
    slow: true,
  },
);

export const RocketLauncher = new UnitInfo(
  3,
  'Rocket Launcher',
  'Davide',
  'male',
  `The Rocket Launcher excels in short-range combat with strong firepower against tanks and other ground units. It is limited by its slow movement and high cost, but is invaluable when defending against a barrage of tanks in your territory.`,
  `Tanks? Not a problem. Hailing from the chilly north, {name} leads the Rocket Launcher division of the defense force.`,
  20,
  EntityType.Infantry,
  MovementTypes.Soldier,
  {
    cost: 275,
    fuel: 40,
    radius: 3,
    vision: 2,
  },
  DefaultUnitAbilitiesWithCapture,
  {
    type: AttackType.ShortRange,
    weapons: [Weapons.RocketLauncher.withSupply(4)],
  },
  null,
  {
    attackStance: 'short',
    directionOffset: 2,
    explosionSprite: {
      frames: 8,
      position: sprite(7, 1),
    },
    name: 'Units-RocketLauncher',
    portrait: {
      position: sprite(2, 0),
      variants: 3,
    },
    slow: true,
  },
);

export const APU = new UnitInfo(
  4,
  'APU',
  'Nora',
  'female',
  `The APU, or Armored Personnel Unit, is a special ground unit with effective firepower against infantry. Capable of traversing challenging terrains, its versatility in both offense and defense is amplified by its relatively low cost.`,
  `Ever since the group discovered plans for the APU, {name} has been working on the design and construction of the first prototype. She is the bright light between all the chaos of battle and she always takes time to positively affirm everyone and simply ignores negativity. On the battlefield, {name} is having way too much fun operating the APU.`,
  25,
  EntityType.Ground,
  MovementTypes.HeavySoldier,
  {
    cost: 300,
    fuel: 40,
    radius: 4,
    vision: 3,
  },
  DefaultUnitAbilities,
  {
    type: AttackType.ShortRange,
    weapons: [Weapons.MiniGun.withSupply(6)],
  },
  null,
  {
    attackStance: 'short',
    directionOffset: 2,
    explosionSprite: {
      frames: 8,
      position: sprite(7, 1),
    },
    name: 'Units-APU',
    portrait: {
      position: sprite(7, 0),
      variants: 3,
    },
  },
);

export const SmallTank = new UnitInfo(
  5,
  'Small Tank',
  'Chiara',
  'female',
  `Built for combat, the Small Tank is moderately expensive but offers good firepower and robust defense against all other ground units. It can move far but has limited visibility in fog and is vulnerable to attacks from most soldiers.`,
  `{name} is a tank commander who loves to be in the thick of the action. While her tank squad is always the first to engage an opponent and {name} can come across as reckless, she is learning battlefield tactics from her uncle, {8.name}.`,
  40,
  EntityType.Ground,
  MovementTypes.Tread,
  {
    cost: 375,
    fuel: 30,
    radius: 7,
    vision: 2,
  },
  DefaultUnitAbilities,
  {
    type: AttackType.ShortRange,
    weapons: [Weapons.LightGun.withSupply(7)],
  },
  null,
  {
    direction: 'left',
    invert: false,
    name: 'Units-SmallTank',
    portrait: {
      position: sprite(10, 0),
      variants: 3,
    },
  },
);

const GroundSupplyTypes = new Set([
  EntityType.AirInfantry,
  EntityType.Amphibious,
  EntityType.Artillery,
  EntityType.Ground,
  EntityType.Infantry,
  EntityType.Rail,
  EntityType.Ship,
]);

export const Jeep = new UnitInfo(
  6,
  'Jeep',
  'Remy',
  'male',
  `This unit is designed for fast mobility and has the ability to resupply other units. Its defense is low, making it vulnerable to enemy attacks. It can't engage in combat but is essential for logistics and exploration and can transport foot soldiers to the battlefield.`,
  `{name} is a cheerful driver who delights in pushing the pedal to the metal, despite his helmet being too big for him to really see ahead! He loves shuttling infantry units around and never hesitates to go as fast as he can.`,
  10,
  EntityType.Ground,
  MovementTypes.Tires,
  {
    cost: 150,
    fuel: 60,
    radius: 7,
    supplyTypes: GroundSupplyTypes,
    vision: 2,
  },
  new UnitAbilities({
    accessBuildings: true,
    moveAndAct: true,
    supply: true,
  }),
  null,
  {
    limit: 2,
    types: new Set([EntityType.Infantry, EntityType.AirInfantry]),
  },
  {
    direction: 'left',
    name: 'Units-Jeep',
    portrait: {
      position: sprite(15, 0),
      variants: 3,
    },
    transports: sprite(0, 3),
    transportsMany: sprite(0, 6),
  },
);

export const Artillery = new UnitInfo(
  UnitID.Artillery,
  'Artillery',
  'Arthur',
  'male',
  `Artilleries are cost-effective long-range units that have to be positioned in order to attack. Though immobilized while in position, their strikes are particularly lethal against infantry and light ground forces.`,
  `Originally a lawyer, {name} was known for treating his subordinates in a rather… militant manner. He decided to join the defense forces after the passing of his dog. As commander of the artillery squad, {name} is feared by opponents and allies alike.`,
  10,
  EntityType.Artillery,
  MovementTypes.Tires,
  {
    cost: 250,
    fuel: 40,
    radius: 5,
    vision: 1,
  },
  new UnitAbilities({
    accessBuildings: true,
    moveAndAct: true,
    unfold: true,
  }),
  {
    range: [2, 4],
    type: AttackType.LongRange,
    weapons: [Weapons.Artillery.withSupply(7)],
  },
  null,
  {
    name: 'Units-MobileArtillery',
    portrait: {
      position: sprite(13, 0),
      variants: 3,
    },
    unfold: sprite(0, 4),
    unfoldSounds: {
      fold: 'Unit/ArtilleryFold',
      unfold: 'Unit/ArtilleryUnfold',
    },
    unfoldSprite: { frames: 5, position: sprite(0, 3) },
  },
);

export const Battleship = new UnitInfo(
  8,
  'Battleship',
  'Admiral One',
  'male',
  `Battleships are the queens of the sea, known for their highly effective long-range attacks. They are among the most expensive units, but when sighted by an opponent, a Battleship often brings disarray to their fleet and requires a strategic adjustment.`,
  `{name} is a seasoned admiral and master of naval combat. While he is known for leading his fleets to victory at high sea, he has also been a caring family man. He single-handedly raised his niece {5.name} after her parents passed away.`,
  30,
  EntityType.Ship,
  MovementTypes.Ship,
  {
    cost: 1000,
    fuel: 40,
    radius: 5,
    vision: 2,
  },
  new UnitAbilities(),
  {
    range: [3, 6],
    type: AttackType.LongRange,
    weapons: [Weapons.Battery.withSupply(4)],
  },
  null,
  {
    direction: 'left',
    invert: false,
    name: 'Units-BattleShip',
    portrait: {
      position: sprite(37, 0),
      variants: 3,
    },
  },
);

export const Helicopter = new UnitInfo(
  9,
  'Helicopter',
  'Jace',
  'male',
  `Helicopter units are essential for low-altitude air control. They can keep soldiers and other ground units at bay while building up a strong defense. Their high mobility and vision range make them particularly useful for scouting in fog.`,
  `{name} is usually found skiing in the mountains when he isn't chasing tanks and soldiers through daring maneuvers in the skies. He loves rhymes and always comes up with subtle jokes, similar to his cat and mouse flying style.`,
  40,
  EntityType.LowAltitude,
  MovementTypes.LowAltitude,
  {
    cost: 300,
    fuel: 40,
    radius: 6,
    vision: 5,
  },
  DefaultUnitAbilities,
  {
    type: AttackType.ShortRange,
    weapons: [
      LightAirGun.withSupply(8).withAnimationPositions({
        ...LightAirGun.animation.positions,
        horizontal: sprite(-0.4, 0.4),
      }),
    ],
  },
  null,
  {
    direction: 'right',
    name: 'Units-Helicopter',
    portrait: {
      position: sprite(12, 0),
      variants: 3,
    },
  },
);

export const Humvee = new UnitInfo(
  10,
  'Humvee',
  'Andrey',
  'male',
  `With their high visibility and large movement range, Humvees are particularly useful for scouting and taking out opposing artillery units. Their high mobility, coupled with their low defense, makes them vulnerable when they cross into enemy territory.`,
  `{name} thrives amidst chaos, always alert to the possibility that everything can blow up at any moment. While his intimidating beard suggests he lives for danger, he is actually a caring person who consistently helps his comrades escape tight spots.`,
  20,
  EntityType.Ground,
  MovementTypes.Tires,
  {
    cost: 225,
    fuel: 50,
    radius: 8,
    vision: 5,
  },
  DefaultUnitAbilities,
  {
    type: AttackType.ShortRange,
    weapons: [
      Weapons.MG.withDamage(
        new Map([...Weapons.MG.damage, [EntityType.LowAltitude, 55]]),
      )
        .withSupply(7)
        .withAnimationPositions({
          down: sprite(0, 0.4),
          horizontal: sprite(-0.45, 0.15),
          up: sprite(0.03, -0.4),
        }),
      Weapons.AntiArtilleryGun.withSupply(5),
    ],
  },
  null,
  {
    direction: 'left',
    name: 'Units-Humvee',
    portrait: {
      position: sprite(14, 0),
      variants: 3,
    },
  },
);

export const AntiAir = new UnitInfo(
  11,
  'Anti Air',
  'Sera',
  'female',
  `Anti Air tanks are the only ground units that are highly effective against all types of air units. They need to be heavily protected by surrounding units due to their weak defense.`,
  `{name} is one of the smartest strategists in the defense force. She is known for her quick thinking and her ability to adapt to any situation. Despite her young age, {name} is constantly sought out for her wisdom about battlefield tactics. She quickly comes up with multiple strategies and lays out the tradeoffs in great detail. Some have said that {name} has a cosmic ability to see many possibilities play out in her mind – where might such a talent come from?`,
  15,
  EntityType.Ground,
  MovementTypes.Tread,
  {
    cost: 250,
    fuel: 30,
    radius: 6,
    vision: 3,
  },
  DefaultUnitAbilities,
  {
    type: AttackType.ShortRange,
    weapons: [Weapons.AntiAirGun.withSupply(10)],
  },
  null,
  {
    direction: 'left',
    invert: false,
    name: 'Units-AntiAir',
    portrait: {
      position: sprite(24, 0),
      variants: 3,
    },
  },
);

export const HeavyArtillery = new UnitInfo(
  UnitID.HeavyArtillery,
  'Heavy Artillery',
  'Joey',
  'male',
  `Heavy Artilleries are feared for their large attack range. They deal severe ranged damage, but they are vulnerable to any unit that can get close to them.`,
  `To cancel out the noise of the battlefield, {name} listens to jazz music on his headphones. It is not clear if it is the headphones or his goofy attitude that require confirming every target coordinate up to five times, but at least he never misses.`,
  5,
  EntityType.Artillery,
  MovementTypes.Tread,
  {
    cost: 650,
    fuel: 15,
    radius: 3,
    vision: 1,
  },
  new UnitAbilities({ accessBuildings: true }),
  {
    range: [3, 5],
    type: AttackType.LongRange,
    weapons: [Weapons.HeavyArtillery.withSupply(4)],
  },
  null,
  {
    direction: 'left',
    invert: false,
    name: 'Units-HeavyArtillery',
    portrait: {
      position: sprite(16, 0),
      variants: 3,
    },
  },
);

const Lander = new UnitInfo(
  13,
  'Lander',
  'Masato',
  'male',
  `Landers can transport soldiers across the sea. They are an essential unit for staging an attack on remote islands, but they lack offensive capabilities and need to be protected by other units.`,
  `{name}'s blue hair is a stark contrast to his calm demeanor. He frequently travels the most treacherous waters to bring his comrades to the frontlines. When he is not on the battlefield, {name} can be found in the library, studying naval strategies.`,
  10,
  EntityType.Ship,
  MovementTypes.Ship,
  {
    cost: 225,
    fuel: 60,
    radius: 7,
    vision: 1,
  },
  new UnitAbilities({
    moveAndAct: true,
  }),
  null,
  {
    limit: 2,
    tiles: new Set([10]),
    types: new Set([EntityType.AirInfantry, EntityType.Infantry]),
  },
  {
    direction: 'left',
    name: 'Units-Lander',
    portrait: {
      position: sprite(40, 0),
      variants: 3,
    },
    transports: sprite(0, 3),
    transportsMany: sprite(0, 6),
  },
);

export const Sniper = new UnitInfo(
  14,
  'Sniper',
  'Maxima',
  'female',
  `Snipers stand out as the sole infantry units capable of long-range attacks. Though costly and requiring positioning to attack, they can make the necessary difference in securing strategic locations.`,
  `{name} was raised in the desert region but left with her sister to join the defense forces. Calm and collected, {name} excels at long range attacks while being able to spot threats on the battlefield from far away. Her intelligence carries weight in the conflict and everyone listens when she has a plan.`,
  15,
  EntityType.Infantry,
  MovementTypes.Soldier,
  {
    cost: 375,
    fuel: 40,
    radius: 4,
    vision: 1,
  },
  new UnitAbilities({
    accessBuildings: true,
    moveAndAct: true,
    unfold: true,
  }),
  {
    range: [2, 4],
    type: AttackType.LongRange,
    weapons: [Weapons.SniperRifle.withSupply(7)],
  },
  null,
  {
    alternativeExplosionSprite: {
      frames: 8,
      position: sprite(7, 9),
    },
    attackStance: 'short',
    directionOffset: 2,
    explosionSprite: {
      frames: 8,
      offset: { y: 1 },
      position: sprite(7, 1),
    },
    name: 'Units-Sniper',
    portrait: {
      position: sprite(1, 0),
      variants: 6,
    },
    slow: true,
    unfold: sprite(0, 8),
    unfoldSounds: {
      fold: 'Unit/SniperFold',
      unfold: 'Unit/SniperUnfold',
    },
    unfoldSprite: { frames: 8, position: sprite(0, 6) },
  },
);

export const Flamethrower = new UnitInfo(
  15,
  'Flamethrower',
  'Yuki',
  'unknown',
  `Flamethrowers specialize in close combat, wielding immense firepower effective against infantry and light ground units. Howeveer, carrying a volatile gas tank on their backs makes them susceptible to attacks, resulting in low defense.`,
  `{name} is a mayhem-loving recruit with a fiery personality. They come from the cold north but bring the warmth with them wherever they go. They look up to more experienced fighters to help them know when to turn down the intensity. As the leader of the flamethrower elites, they are known to revel in the mayhem of a battle and getting a little bit carried away when it comes to burning things down.`,
  0,
  EntityType.Infantry,
  MovementTypes.Soldier,
  {
    cost: 400,
    fuel: 30,
    radius: 4,
    vision: 3,
  },
  DefaultUnitAbilitiesWithCapture,
  {
    type: AttackType.ShortRange,
    weapons: [Weapons.Flamethrower.withSupply(4)],
  },
  null,
  {
    attackStance: 'short',
    directionOffset: 2,
    explosionSprite: {
      frames: 8,
      position: sprite(7, 1),
    },
    name: 'Units-Flamethrower',
    portrait: {
      position: sprite(5, 0),
      variants: 3,
    },
    slow: true,
  },
);

export const Saboteur = new UnitInfo(
  16,
  'Saboteur',
  'Arvid',
  'male',
  `Saboteurs are the most mischievous of all units, capable of sabotaging opposing units and taking away their supplies. They can also rescue neutral units on the battlefield to join their cause. Because they don't carry weapons, they rely on their fists to defend themselves.`,
  `{name} was recruited into the defense forces alongside {14.name}. He loves deceitfully sneaking into enemy territory to sabotage, steal secrets or just wreak havoc for the fun of it. Although nobody is quite sure if he is ever really scared of anything, his comrades have seen him pack a punch when his life depends on it.`,
  10,
  EntityType.Infantry,
  MovementTypes.Soldier,
  {
    cost: 325,
    fuel: 40,
    radius: 6,
    sabotageTypes: DefaultSabotageTypes,
    vision: 1,
  },
  SaboteurUnitAbilities,
  {
    type: AttackType.ShortRange,
    weapons: [Weapons.Punch],
  },
  null,
  {
    attackStance: 'once',
    directionOffset: 2,
    explosionSprite: {
      frames: 8,
      offset: { y: 1 },
      position: sprite(7, 1),
    },
    name: 'Units-Saboteur',
    portrait: {
      position: sprite(9, 0),
      variants: 6,
    },
    slow: true,
  },
);

export const TransportHelicopter = new UnitInfo(
  17,
  'Transport Chopper',
  'Charlie',
  'male',
  `Transport Helicopters can resupply air units, ensuring that a fleet doesn't run out of supplies and risk crashing. They can also transport up to two soldiers across the battlefield.`,
  `{name} was never limited by his ambition, mainly because his ambitions were never that high. He is a reliable pilot who enjoys a simple life: flying helicopters, engaging in woodwork, and writing short stories. His latest novel is about a helicopter pilot who gets sucked into another world full of dragons and dinosaurs. Hah, as if that could ever happen!`,
  30,
  EntityType.LowAltitude,
  MovementTypes.LowAltitude,
  {
    cost: 200,
    fuel: 60,
    radius: 7,
    supplyTypes: new Set([
      EntityType.AirInfantry,
      EntityType.LowAltitude,
      EntityType.Airplane,
    ]),
    vision: 3,
  },
  new UnitAbilities({
    accessBuildings: true,
    moveAndAct: true,
    supply: true,
  }),
  null,
  {
    limit: 2,
    types: new Set([EntityType.AirInfantry, EntityType.Infantry]),
  },
  {
    direction: 'right',
    name: 'Units-TransportHelicopter',
    portrait: {
      position: sprite(18, 0),
      variants: 3,
    },
  },
);

export const FighterJet = new UnitInfo(
  18,
  'Fighter Jet',
  'Titan',
  'unknown',
  `Fighter Jets ensure air superiority with their high mobility and firepower against other air units. While they cannot win a battle alone, lacking Fighter Jets in a fleet means ceding air control to the opponent.`,
  `Only known by their call sign, {name} is a mysterious pilot with an unknown background but an impressive record of downing opponents. Whatever their origin, they are an effective leader of the fighter jet division. Given the large range of Fighter Jets, {name} is known to scout ahead and discover enemy forces when nobody else can.`,
  60,
  EntityType.Airplane,
  MovementTypes.Air,
  {
    cost: 550,
    fuel: 50,
    radius: 8,
    vision: 3,
  },
  DefaultUnitAbilities,
  {
    type: AttackType.ShortRange,
    weapons: [AirToAirMissile.withSupply(8)],
  },
  null,
  {
    direction: 'right',
    name: 'Units-FighterJet',
    portrait: {
      position: sprite(19, 0),
      variants: 3,
    },
  },
);

export const Bomber = new UnitInfo(
  19,
  'Bomber',
  'Léon',
  'male',
  `If Fighter Jets are the kings of the air, Bombers are the queens. They can deal massive damage to ground units and buildings but have no defenses against air units.`,
  `{name} hails from a beautiful mountain region known for its thermal activity. As a child, he would soak in the hot springs, look up, and dream of flying. He lives his dream as the leader of the Bomber squad. When his crew noticed that he easily gets startled by noise, they started playing pranks on him. Now, he is always on edge, but his crew loves him for it.`,
  55,
  EntityType.Airplane,
  MovementTypes.Air,
  {
    cost: 800,
    fuel: 40,
    radius: 6,
    vision: 2,
  },
  DefaultUnitAbilities,
  { type: AttackType.ShortRange, weapons: [Weapons.Bomb.withSupply(5)] },
  null,
  {
    direction: 'right',
    name: 'Units-Bomber',
    portrait: {
      position: sprite(23, 0),
      variants: 3,
    },
  },
);

export const Jetpack = new UnitInfo(
  20,
  'Jetpack',
  'Sora',
  'male',
  `Jetpacks are a new invention. They can navigate almost all terrain types and are effective against air and ground units. They can capture buildings, but their low fuel makes them a risky investment.`,
  `An excitable tinkerer, {name} created the jetpack technology and leads the jetpack division through field testing new and exciting ways to use it. When he isn’t flying a jetpack, he researches new technology found by his friends in their exploration of the multiverse. As a creative tinkerer he can't help himself in trying out any new tech he gets his hands on.`,
  20,
  EntityType.AirInfantry,
  MovementTypes.AirInfantry,
  {
    cost: 300,
    fuel: 30,
    radius: 4,
    vision: 2,
  },
  DefaultUnitAbilitiesWithCapture,
  {
    type: AttackType.ShortRange,
    weapons: [
      Weapons.SoldierMG.withSupply(5).withAnimationPositions({
        down: sprite(0.03, 0.45),
        horizontal: sprite(-0.45, 0.07),
        up: sprite(0, -0.4),
      }),
      AirToAirMissile.withSupply(3)
        .withDamage(buff(AirToAirMissile.damage, -15))
        .withAnimationPositions({
          down: sprite(0.03, 0.45),
          horizontal: sprite(-0.45, 0.07),
          up: sprite(0, -0.4),
        }),
    ],
  },
  null,

  {
    attackStance: 'short',
    directionOffset: 2,
    explosionSprite: {
      frames: 8,
      position: sprite(7, 1),
    },
    name: 'Units-Jetpack',
    portrait: {
      position: sprite(8, 0),
      variants: 3,
    },
    withNavalExplosion: true,
  },
);

export const SeaPatrol = new UnitInfo(
  21,
  'Sea Patrol',
  'Marika',
  'female',
  `Low-altitude Sea Patrol units are inexpensive and incredibly useful for securing coastal areas against ships and other low-altitude aircraft. However, their low mobility makes them particularly vulnerable to air attacks, and crash landings on islands are not uncommon.`,
  `{name} has a loyal, easy-going, and happy personality. She tends to get angry when one of her friends gets stranded on an island – not because of what happened, but because it affects the perfect record of her squad. Since she is always the first to volunteer for a rescue mission, she at least gets to maintain the record for most rescues.`,
  30,
  EntityType.LowAltitude,
  MovementTypes.LowAltitude,
  {
    cost: 200,
    fuel: 40,
    radius: 4,
    vision: 4,
  },
  DefaultUnitAbilities,
  {
    type: AttackType.ShortRange,
    weapons: [
      LightAirGun.withDamage(
        new Map([
          [EntityType.AirInfantry, 100],
          [EntityType.Amphibious, 60],
          [EntityType.Artillery, 55],
          [EntityType.Ground, 55],
          [EntityType.LowAltitude, 100],
          [EntityType.Infantry, 40],
          [EntityType.Rail, 55],
          [EntityType.Ship, 75],
        ]),
      ).withSupply(5),
    ],
  },
  null,
  {
    direction: 'right',
    name: 'Units-SeaPatrol',
    portrait: {
      position: sprite(17, 0),
      variants: 3,
    },
  },
);

export const AcidBomber = new UnitInfo(
  22,
  'Acid Bomber',
  'Ada',
  'female',
  `Unknown`,
  `Unknown`,
  50,
  EntityType.Airplane,
  MovementTypes.Air,
  {
    cost: Number.POSITIVE_INFINITY,
    fuel: 20,
    radius: 4,
    vision: 1,
  },
  DefaultUnitAbilities,
  { type: AttackType.ShortRange, weapons: [Weapons.Bomb.withSupply(2)] },
  null,
  {
    direction: 'right',
    name: 'Units-AcidBomber',
    portrait: {
      position: sprite(25, 0),
      variants: 3,
    },
  },
);

export const Drone = new UnitInfo(
  23,
  'Drone Bomber',
  'N.U.L.L.',
  'unknown',
  `Unknown`,
  `Unknown`,
  25,
  EntityType.Airplane,
  MovementTypes.Air,
  {
    cost: Number.POSITIVE_INFINITY,
    fuel: 40,
    radius: 5,
    vision: 2,
  },
  DefaultUnitAbilities,
  { type: AttackType.ShortRange, weapons: [Weapons.DroneBomb.withSupply(5)] },
  null,
  {
    direction: 'right',
    name: 'Units-Drone',
    portrait: {
      position: sprite(22, 0),
      variants: 3,
    },
  },
);

export const ReconDrone = new UnitInfo(
  24,
  'Recon Drone',
  'R.O.D.',
  'unknown',
  `Unknown`,
  `Unknown`,
  15,
  EntityType.Airplane,
  MovementTypes.Air,
  {
    cost: Number.POSITIVE_INFINITY,
    fuel: 60,
    radius: 7,
    vision: 5,
  },
  DefaultUnitAbilities,
  { type: AttackType.ShortRange, weapons: [Weapons.MG.withSupply(5)] },
  null,
  {
    direction: 'right',
    name: 'Units-ReconDrone',
    portrait: {
      position: sprite(21, 0),
      variants: 3,
    },
  },
);

export const XFighter = new UnitInfo(
  25,
  'X-Fighter',
  'Amira',
  'female',
  `The X-Fighter is a cheap and fast air unit that can attack other air units directly or indirectly. X-Fighters are not strong, but they can lure enemy air units into traps and attack them from a distance.`,
  `{14.name}'s younger sister {name} is a cool-headed fighter pilot who is always ready to take on the next challenge. She is a natural leader and is always looking out for her friends. {name} is a perfectionist and always trying to improve her skills on the battlefield.`,
  30,
  EntityType.Airplane,
  MovementTypes.Air,
  {
    cost: 250,
    fuel: 40,
    radius: 5,
    vision: 2,
  },
  DefaultUnitAbilities,
  {
    range: [1, 2],
    type: AttackType.LongRange,
    weapons: [Weapons.LightAirToAirMissile.withSupply(5)],
  },
  null,
  {
    direction: 'right',
    name: 'Units-XFighter',
    portrait: {
      position: sprite(20, 0),
      variants: 3,
    },
  },
);

export const Medic = new UnitInfo(
  UnitID.Medic,
  'Medic',
  'Corrado',
  'male',
  `Medics are essential on a battlefield with constrained resources. They can patch up wounded soldiers right at the frontlines and keep them going long enough to potentially turn the tide of battle.`,
  `{name} is the cool-headed chief medical officer in the defense force and never breaks a sweat in any conflict. Lose an arm? {name} will give you a band-aid and send you back onto the field.`,
  0,
  EntityType.Infantry,
  MovementTypes.Soldier,
  {
    cost: 250,
    fuel: 80,
    healTypes: new Set([EntityType.Infantry, EntityType.AirInfantry]),
    radius: 4,
    vision: 1,
  },
  HealUnitAbilities,
  {
    type: AttackType.ShortRange,
    weapons: [Weapons.Punch],
  },
  null,
  {
    directionOffset: 2,
    explosionSprite: {
      frames: 8,
      offset: { y: 1 },
      position: sprite(7, 1),
    },
    healSprite: {
      frames: 8,
      position: sprite(0, 6),
    },
    name: 'Units-Medic',
    portrait: {
      position: sprite(0, 0),
      variants: 3,
    },
    slow: true,
  },
);

export const AmphibiousTank = new UnitInfo(
  27,
  'Amphibious Tank',
  'Siegfried',
  'male',
  `Amphibious Tanks are versatile units that can move on both land and water. Their attack power is similar to Small Tanks but they can additionally navigate the sea and deal meaningful damage to ships.`,
  `{name} is known for his endearing accent and the stories he tells. With a degree in medieval history, he tends to recount tales of knights and dragons. His favorite story is about a knight, also named {name}, who slays the biggest dragon of all to rescue the princess. He often says heroes don't wear capes; in one of his tales, the hero is a plumber. Where did he get that idea from?`,
  35,
  EntityType.Amphibious,
  MovementTypes.Amphibious,
  {
    cost: 450,
    fuel: 25,
    radius: 6,
    vision: 2,
  },
  DefaultUnitAbilities,
  {
    type: AttackType.ShortRange,
    weapons: [Weapons.AmphibiousLightGun.withSupply(10)],
  },
  null,
  {
    alternative: sprite(0, 3),
    direction: 'left',
    name: 'Units-Amphibious',
    portrait: {
      position: sprite(11, 0),
      variants: 3,
    },
  },
);

export const Destroyer = new UnitInfo(
  28,
  'Destroyer',
  'Cohen',
  'male',
  `Destroyers are among the most versatile naval units. Technological advances allow Destroyers to be highly effective against air and ground units, but they are vulnerable to other naval units.`,
  `{name} does not kid around on the battlefield. He marches into battle with a stern face and a determined look but is often seen as overconfident by his peers. He once single-handedly destroyed an entire enemy fleet, but his stubbornness has also led to some embarrassing defeats. However, his ability to learn from mistakes has made him a respected leader.`,
  30,
  EntityType.Ship,
  MovementTypes.Ship,
  {
    cost: 350,
    fuel: 60,
    radius: 6,
    vision: 3,
  },
  DefaultUnitAbilities,
  {
    type: AttackType.ShortRange,
    weapons: [Weapons.SAM.withSupply(6), CruiseMissile.withSupply(4)],
  },
  null,
  {
    direction: 'left',
    invert: false,
    name: 'Units-Destroyer',
    portrait: {
      position: sprite(35, 0),
      variants: 3,
    },
  },
);

export const Frigate = new UnitInfo(
  29,
  'Frigate',
  'Thomas',
  'male',
  `The Frigate is every naval fleet's workhorse. It's a dual short- and long-range unit that is highly effective against ships. Its lower mobility is countered by its ability to attack from a distance.`,
  `{name} is a happy sailor who enjoys the rough seas and thrill of chasing enemy aircraft. Aside from the battlefield, {name} is a talented musician who plays the violin. He is known for his ability to calm the crew with his music, even in the most intense situations.`,
  10,
  EntityType.Ship,
  MovementTypes.Ship,
  {
    cost: 400,
    fuel: 60,
    radius: 5,
    vision: 3,
  },
  DefaultUnitAbilities,
  {
    range: [1, 2],
    type: AttackType.LongRange,
    weapons: [AntiShipMissile.withSupply(8)],
  },
  null,
  {
    direction: 'left',
    name: 'Units-Frigate',
    portrait: {
      position: sprite(39, 0),
      variants: 3,
    },
  },
);

export const Hovercraft = new UnitInfo(
  30,
  'Hovercraft',
  'Jygo',
  'male',
  `Hovercrafts are gigantic barges that can transport up to four ground units across the sea. While they cannot attack, they have entertainment and relaxation facilities on board, which keep their loaded troops in high spirits. This morale boost often enables devastating surprise attacks immediately upon landing on enemy shores.`,
  `{name} himself is responsible for many of the recent improvements in troop morale. Recognizing the importance of keeping everyone in high spirits, he developed a variety of games and activities that can be attended to while on board. Unfortunately, the program had to be scaled back after a few incidents involving the ship's XO and a competitive duck chase game, which escalated when the XO accidentally launched herself into the sea while trying to capture the "Golden Duck" trophy.`,
  20,
  EntityType.Ship,
  MovementTypes.Ship,
  {
    cost: 400,
    fuel: 60,
    radius: 7,
    vision: 3,
  },
  new UnitAbilities({
    moveAndAct: true,
  }),
  null,
  {
    limit: 4,
    tiles: new Set([10]),
    types: new Set([
      EntityType.Infantry,
      EntityType.AirInfantry,
      EntityType.Ground,
      EntityType.Artillery,
    ]),
  },
  {
    direction: 'left',
    invert: false,
    name: 'Units-Hovercraft',
    portrait: {
      position: sprite(34, 0),
      variants: 3,
    },
  },
);

export const PatrolShip = new UnitInfo(
  31,
  'Patrol Ship',
  'Alex',
  'female',
  `The Patrol Ship is an amphibious unit capable of capture both on land and at sea. It can help secure an early economic advantage by taking control of Oil Rigs and Shipyards. It is strong against soldiers but weak against other unit types.`,
  `{name} is a free spirit who loves nature, mountains, and her two dogs. She is not a fan of the sea, which is perhaps why she ended up operating an amphibious unit that can traverse even the most difficult terrain on land. Her love for animals is apparent when she brings her dogs to the battlefield, where they are known to cheer up the troops.`,
  20,
  EntityType.Amphibious,
  MovementTypes.Amphibious,
  {
    cost: 300,
    fuel: 60,
    radius: 5,
    vision: 3,
  },
  DefaultUnitAbilitiesWithCapture,
  {
    type: AttackType.ShortRange,
    weapons: [Weapons.SeaMG.withSupply(6)],
  },
  null,
  {
    alternative: sprite(0, 3),
    direction: 'left',
    name: 'Units-SmallHovercraft',
    portrait: {
      position: sprite(36, 0),
      variants: 3,
    },
  },
);

const EntityTypesToSupport = new Set([
  EntityType.Amphibious,
  EntityType.Artillery,
  EntityType.Ground,
  EntityType.Infantry,
  EntityType.Rail,
  EntityType.Ship,
]);
export const SupportShip = new UnitInfo(
  32,
  'Support Ship',
  'Lee',
  'male',
  `The Support Ship can heal and resupply both ground units and ships in its vicinity. While it is not usually seen on the frontlines when a battle commences, it is essential for maintaining supply lines and keeping a fleet in fighting shape.`,
  `{name} grew up poor in a landlocked country and never saw the sea until he joined the defense forces. The vastness of the ocean and the power of the ships captivated him from the start. He's always had a knack for fixing things, and now he uses his skills to keep the fleet in top shape. Away from the battlefield, he enjoys playing the guitar in a metal band.`,
  40,
  EntityType.Ship,
  MovementTypes.Ship,
  {
    cost: 275,
    fuel: 90,
    healTypes: EntityTypesToSupport,
    radius: 6,
    supplyTypes: EntityTypesToSupport,
    vision: 5,
  },
  new UnitAbilities({
    accessBuildings: true,
    heal: true,
    moveAndAct: true,
    rescue: true,
    supply: true,
  }),
  null,
  null,
  {
    direction: 'left',
    name: 'Units-SupportShip',
    portrait: {
      position: sprite(41, 0),
      variants: 3,
    },
  },
);

export const Corvette = new UnitInfo(
  33,
  'Corvette',
  'Stephanie',
  'female',
  `The Corvette is the smallest of ships, but its torpedoes can deal significant damage to other ships. Coupled with its low cost and high mobility, it can be devastating to even the largest of fleets when it catches them off guard.`,
  `{name} is small but mighty. She is known for her quick wit and her ability to outmaneuver larger ships. Despite having a family to care for, she frequently volunteers for the most dangerous missions. Her bravery and skill have earned her the respect of her peers and the nickname "Mama Shark".`,
  0,
  EntityType.Ship,
  MovementTypes.Ship,
  {
    cost: 200,
    fuel: 30,
    radius: 6,
    vision: 1,
  },
  DefaultUnitAbilities,
  {
    type: AttackType.ShortRange,
    weapons: [Weapons.Torpedo.withSupply(5)],
  },
  null,
  {
    direction: 'left',
    name: 'Units-Corvette',
    portrait: {
      position: sprite(38, 0),
      variants: 3,
    },
  },
);

export const Mammoth = new UnitInfo(
  34,
  'Mammoth',
  'Shamus',
  'male',
  `Unmatched in firepower on the battlefield, the Mammoth is slow but can deal massive damage to distant units. Novel technology enables the Mammoth to move and attack simultaneously, making it extremely dangerous in the hands of a skilled commander.`,
  `Operating a gigantic siege artillery is no easy task, but for {name} it's mostly upside! When he is not moving into position or preparing a trajectory, he often spends his free time reading and gardening, all the while humming in tune with the ringing of his ears. Despite his positive demeanor, he is quietly thankful he can remain further away from action.`,
  35,
  EntityType.Rail,
  MovementTypes.Rail,
  {
    cost: 900,
    fuel: 30,
    radius: 4,
    vision: 1,
  },
  DefaultUnitAbilities,
  {
    range: [2, 4],
    type: AttackType.LongRange,
    weapons: [Weapons.Railgun.withSupply(6)],
  },
  null,
  {
    direction: 'left',
    name: 'Units-Mammoth',
    portrait: {
      position: sprite(42, 0),
      variants: 3,
    },
  },
);

export const TransportTrain = new UnitInfo(
  35,
  'Transport Train',
  'Mara',
  'female',
  `While primarily a unit for transporting other ground units to the frontlines quickly, the Transport Train also boasts a formidable attack. Coupled with its high defense it can clear a path before unloading troops.`,
  `{name} has had a fair amount of setbacks in her life, but she always manages to get back on track. She is reliable but often dramatic. Known for her love of trains, she is also a talented singer, often entertaining her passengers with songs inspired by her life experiences.`,
  30,
  EntityType.Rail,
  MovementTypes.Rail,
  {
    cost: 325,
    fuel: 30,
    radius: 7,
    vision: 2,
  },
  new UnitAbilities({
    moveAndAct: true,
  }),
  {
    type: AttackType.ShortRange,
    weapons: [
      Weapons.HeavyGun.withDamage(
        new Map([
          [EntityType.AirInfantry, 55],
          [EntityType.Amphibious, 125],
          [EntityType.Artillery, 125],
          [EntityType.Building, 70],
          [EntityType.Ground, 125],
          [EntityType.LowAltitude, 55],
          [EntityType.Infantry, 85],
          [EntityType.Rail, 115],
          [EntityType.Ship, 70],
          [EntityType.Structure, 110],
        ]),
      ).withSupply(5),
    ],
  },
  {
    limit: 4,
    types: new Set([
      EntityType.Infantry,
      EntityType.AirInfantry,
      EntityType.Ground,
      EntityType.Artillery,
      EntityType.Amphibious,
    ]),
  },
  {
    direction: 'left',
    name: 'Units-TransportTrain',
    portrait: {
      position: sprite(43, 0),
      variants: 3,
    },
  },
);

export const Dinosaur = new UnitInfo(
  36,
  'Dinosaur',
  'Dion',
  'unknown',
  'A Dinosaur in this day and age?? How did it get here? Do you think it hatched from an Easter Egg?',
  `{name} is the leader of the Dinosaur faction. In their world, {name} worked as a butcher in a fine dining restaurant. Everything changed when their world was invaded by odd-looking bipedal creatures dressed in colorful outfits, wielding strange weapons. Now, {name} is fighting to protect their world from these invaders.`,
  25,
  EntityType.Infantry,
  MovementTypes.Soldier,
  {
    cost: Number.POSITIVE_INFINITY,
    fuel: 100,
    radius: 3,
    vision: 3,
  },
  DefaultUnitAbilities,
  {
    type: AttackType.ShortRange,
    weapons: [Weapons.Bite.withDamage(buff(Weapons.Bite.damage, 40))],
  },
  null,
  {
    attackStance: 'short',
    directionOffset: 2,
    explosionSprite: {
      frames: 8,
      position: sprite(7, 1),
    },
    name: 'Units-Dinosaur',
    portrait: {
      position: sprite(44, 0),
      variants: 3,
    },
    slow: true,
  },
);

export const HeavyTank = new UnitInfo(
  37,
  'Heavy Tank',
  'Marc',
  'male',
  `The Heavy Tank strikes a perfect balance between firepower, defense, and mobility. It excels in most head-to-head battles and can withstand significant damage. Armies typically field a few Heavy Tanks to lead charges and break through enemy lines.`,
  `His comrades joke that {name} is living in his tank. He is quiet and reserved, preferring to let his actions speak for him. Not much is known about {name}, except that he loves eating sweets made from rice and red beans, a favorite from his home country.`,
  60,
  EntityType.Ground,
  MovementTypes.Tread,
  {
    cost: 600,
    fuel: 25,
    radius: 5,
    vision: 2,
  },
  DefaultUnitAbilities,
  {
    type: AttackType.ShortRange,
    weapons: [
      Weapons.HeavyGun.withSupply(10),
      Weapons.MG.withAnimationPositions({
        down: sprite(-0.06, 0.65),
        horizontal: sprite(-0.4, 0.13),
        up: sprite(-0.08, -0.35),
      }),
    ],
  },
  null,
  {
    direction: 'left',
    name: 'Units-HeavyTank',
    portrait: {
      position: sprite(47, 0),
      variants: 3,
    },
  },
);

export const SuperTank = new UnitInfo(
  38,
  'Super Tank',
  'Olaf',
  'male',
  `The Super Tank is among the most powerful units with extremely high firepower and defense. Unfortunately, due to the complexity of their design nobody has figured out how to build new Super Tanks. They can only be acquired by rescuing them on the battlefield.`,
  `{name} hails from the frostbitten regions of the north. His extensive experience in harsh, snowy environments has honed his tactical expertise, particularly in utilizing terrain to his advantage. As the commander of the Super Tank division, {name}'s strategic insights were instrumental in augmenting the Super Tank's formidable offensive capabilities. His leadership is as unyielding as the tundra he calls home, making him a formidable force on the battlefield.`,
  70,
  EntityType.Ground,
  MovementTypes.Tread,
  {
    cost: Number.POSITIVE_INFINITY,
    fuel: 20,
    radius: 3,
    vision: 1,
  },
  DefaultUnitAbilities,
  {
    type: AttackType.ShortRange,
    weapons: [
      Weapons.HeavyGun.withDamage(buff(Weapons.HeavyGun.damage, 25)).withSupply(
        10,
      ),
    ],
  },
  null,
  {
    direction: 'left',
    name: 'Units-SuperTank',
    portrait: {
      position: sprite(48, 0),
      variants: 3,
    },
  },
);

export const HumveeAvenger = new UnitInfo(
  39,
  'Humvee Avenger',
  'Stella',
  'female',
  `Unknown`,
  `Unknown`,
  30,
  EntityType.Ground,
  MovementTypes.Tires,
  {
    cost: Number.POSITIVE_INFINITY,
    fuel: 40,
    radius: 6,
    vision: 3,
  },
  DefaultUnitAbilities,
  {
    type: AttackType.ShortRange,
    weapons: [
      new Weapon(
        'Rockets',
        new Map([
          [EntityType.AirInfantry, 60],
          [EntityType.Airplane, 60],
          [EntityType.Amphibious, 90],
          [EntityType.Artillery, 70],
          [EntityType.Ground, 80],
          [EntityType.LowAltitude, 60],
          [EntityType.Infantry, 80],
          [EntityType.Rail, 60],
          [EntityType.Ship, 60],
        ]),
        new WeaponAnimation('Rockets', 'Attack/Rockets', {
          frames: 9,
          positions: {
            down: sprite(0, 1.5),
            horizontal: sprite(-0.9, 0.2),
            up: sprite(0.35, -0.75),
          },
          recoil: true,
          size: 48,
          trailingFrames: 10,
        }),
        new WeaponAnimation('ExplosionImpact', 'ExplosionImpact', {
          frames: 10,
          leadingFrames: 9,
          recoil: false,
          size: 48,
        }),
      ),
    ],
  },
  null,
  {
    direction: 'left',
    name: 'Units-HumveeAvenger',
    portrait: {
      position: sprite(49, 0),
      variants: 3,
    },
  },
);

export const ArtilleryHumvee = new UnitInfo(
  40,
  'Artillery Humvee',
  'Unknown',
  'female',
  `Unknown`,
  `Unknown`,
  30,
  EntityType.Ground,
  MovementTypes.Tires,
  {
    cost: Number.POSITIVE_INFINITY,
    fuel: 40,
    radius: 6,
    vision: 3,
  },
  DefaultUnitAbilities,
  {
    range: [2, 3],
    type: AttackType.LongRange,
    weapons: [Weapons.Rocket.withSupply(10)],
  },
  null,
  {
    direction: 'left',
    name: 'Units-ArtilleryHumvee',
    portrait: {
      position: sprite(50, 0),
      variants: 3,
    },
  },
);

export const SupplyTrain = new UnitInfo(
  41,
  'Supply Train',
  'Joseph',
  'male',
  `Supply Trains are among the most cost effective units when it comes to attacking other ground units. They are capable of supplying other units on the battlefield and keeping supply lines open.`,
  `{name} always yearns for the serene landscape of his mountainous home region. He enjoys meditating, sitting on a mat in his traditional house and listening to the wind chimes in his garden. Reflecting on the contrast between the chaos of the battlefield and the peacefulness of his home, he often inspires those around him to balance the loudness with calm.`,
  40,
  EntityType.Rail,
  MovementTypes.Rail,
  {
    cost: 200,
    fuel: 60,
    radius: 6,
    supplyTypes: GroundSupplyTypes,
    vision: 1,
  },
  new UnitAbilities({
    moveAndAct: true,
    supply: true,
  }),
  {
    type: AttackType.ShortRange,
    weapons: [
      Weapons.LightGun.withDamage(
        new Map([
          ...LightGun.damage,

          [EntityType.Amphibious, 75],
          [EntityType.Ship, 55],
        ]),
      ).withSupply(5),
    ],
  },
  null,
  {
    direction: 'left',
    name: 'Units-SupplyTrain',
    portrait: {
      position: sprite(46, 0),
      variants: 3,
    },
  },
);

export const Truck = new UnitInfo(
  42,
  'Truck',
  'Unknown',
  'female',
  `Unknown`,
  `Unknown`,
  40,
  EntityType.Ground,
  MovementTypes.Tires,
  {
    cost: Number.POSITIVE_INFINITY,
    fuel: 100,
    radius: 8,
    supplyTypes: GroundSupplyTypes,
    vision: 2,
  },
  new UnitAbilities({
    accessBuildings: true,
    moveAndAct: true,
    supply: true,
  }),
  null,
  {
    limit: 4,
    types: new Set([EntityType.Infantry, EntityType.AirInfantry]),
  },
  {
    direction: 'left',
    name: 'Units-Truck',
    portrait: {
      position: sprite(52, 0),
      variants: 3,
    },
  },
);

export const Octopus = new UnitInfo(
  43,
  'Octopus',
  'General Buccal',
  'unknown',
  `Octopus units are a formidable naval force, known for their tentacle whips that deal significant damage to ships and ground units. Wait, isn't anyone curious why octopi are part of the fleet? They just… exist?`,
  `{name} was once the chief architect of a vibrant underwater city, renowned for breathtaking coral structures. Their peaceful life of creation was shattered when their world was invaded. Now, their role has changed from creator to destroyer. They view the battlefield as a grand canvas, where every maneuver is part of a larger tapestry of survival and victory.`,
  5,
  EntityType.Ship,
  MovementTypes.Ship,
  {
    cost: Number.POSITIVE_INFINITY,
    fuel: 200,
    radius: 5,
    vision: 2,
  },
  DefaultUnitAbilities,
  {
    type: AttackType.ShortRange,
    weapons: [Weapons.TentacleWhip.withSupply(10)],
  },
  null,
  {
    attackStance: 'long',
    directionOffset: 3,
    explosionSprite: {
      frames: 8,
      position: sprite(0, 2),
    },
    name: 'Units-Octopus',
    portrait: {
      position: sprite(29, 0),
      variants: 3,
    },
  },
);

export const Dragon = new UnitInfo(
  44,
  'Dragon',
  'Unknown',
  'unknown',
  `Dragons are kind of like a multiversal Flamethrower unit, if you think about it. Except they can also fly, are huge, and people tend to freeze when they see a Dragon. So, not really like a Flamethrower unit at all. But they do breathe fire!`,
  `{name} is a solitary creature, preferring to keep to themselves and avoid conflict whenever possible. Unfortunately, they were pulled into the multiversal conflict and had no choice but to fight. Originally from a world where dragons were revered as wise and powerful beings, {name} is now seen as a terrifying force of nature. They long for the day when they can return to their peaceful existence.`,
  25,
  EntityType.AirInfantry,
  MovementTypes.AirInfantry,
  {
    cost: Number.POSITIVE_INFINITY,
    fuel: 50,
    radius: 4,
    vision: 3,
  },
  DefaultUnitAbilities,
  {
    type: AttackType.ShortRange,
    weapons: [
      Weapons.Flamethrower.withDamage(
        buff(
          new Map([...Weapons.Flamethrower.damage, [EntityType.Ship, 70]]),
          40,
        ),
      )
        .withSupply(6)
        .withAnimationPositions({
          down: sprite(-0.4, 1),
          horizontal: sprite(-0.85, -0.05),
          up: sprite(0.4, -0.85),
        }),
    ],
  },
  null,
  {
    alternative: sprite(0, 6),
    alternativeExplosionSprite: {
      frames: 8,
      position: sprite(0, 0),
    },
    attackStance: 'short',
    directionOffset: 2,
    explosionSprite: {
      frames: 8,
      position: sprite(7, 1),
    },
    name: 'Units-Dragon',
    portrait: {
      position: sprite(28, 0),
      variants: 3,
    },
    withNavalExplosion: true,
  },
);

export const Bear = new UnitInfo(
  45,
  'Bear',
  'Unknown',
  'female',
  `This is a Bear, and Bears tend to be huge. Usually found in forests and mountains, they are hunted for their fur and meat. But this Bear is different. It's a unit in a game. So, don't hunt it, just fight it!`,
  `There is not much known about {name}, except that she is bigger and stronger than most other bears. Many stories circulate about a giant in the forest devouring soldiers and even tanks. But that couldn't be her, right? Right??`,
  25,
  EntityType.Infantry,
  MovementTypes.Soldier,
  {
    cost: Number.POSITIVE_INFINITY,
    fuel: 100,
    radius: 2,
    vision: 2,
  },
  DefaultUnitAbilities,
  {
    type: AttackType.ShortRange,
    weapons: [Weapons.Bite],
  },
  null,
  {
    attackStance: 'once',
    directionOffset: 2,
    explosionSprite: {
      frames: 8,
      position: sprite(7, 1),
    },
    name: 'Units-Bear',
    portrait: {
      position: sprite(45, 0),
      variants: 3,
    },
    slow: true,
  },
);

export const Alien = new UnitInfo(
  46,
  'Alien',
  'Unknown',
  'unknown',
  `Alien units aren't really that special. They're just like any other soldier, except they come from another dimension. Rumored to possess advanced technology and abilities, and known to travel in spaceships — but other than that, they're just like any other soldier. Really.`,
  `Who hasn't been beamed up onto a spaceship and probed by aliens before? Well, anyway, it was definitely not {name}, because {name} is an interior decorator from another dimension. They're here to make sure the multiverse looks good, one universe at a time. Although… they are known to get into disagreements about style. To {name}, all the useless clutter from humans seems out of this world. Who needs it, really?`,
  10,
  EntityType.Infantry,
  MovementTypes.Soldier,
  {
    cost: Number.POSITIVE_INFINITY,
    fuel: 20,
    radius: 4,
    sabotageTypes: DefaultSabotageTypes,
    vision: 1,
  },
  SaboteurUnitAbilities,
  {
    type: AttackType.ShortRange,
    weapons: [Weapons.Bite],
  },
  null,
  {
    attackStance: 'once',
    directionOffset: 2,
    explosionSprite: {
      frames: 8,
      offset: { y: 2 },
      position: sprite(7, 1),
    },
    name: 'Units-Alien',
    portrait: {
      position: sprite(26, 0),
      variants: 3,
    },
    slow: true,
  },
);

export const Zombie = new UnitInfo(
  UnitID.Zombie,
  'Zombie',
  'Unknown',
  'unknown',
  `Zombies are slow but extremely dangerous. A hit from a Zombie infects the opponent, converting them to the Zombie faction. A Zombie faction? Yes, that's right. They are a formidable faction, and they are coming for all of us.`,
  `We do not know where {name} comes from, what "it" is thinking, or even if "it" is capable of thought at all. What we do know is that {name}, along with other Zombies, is trying to convert us all, one by one, into their ranks. They want to eat our brains and are here to do it all very, very slowly.`,
  0,
  EntityType.Infantry,
  MovementTypes.Soldier,
  {
    cost: Number.POSITIVE_INFINITY,
    fuel: 20,
    radius: 3,
    vision: 1,
  },
  PioneerUnitAbilities,
  {
    type: AttackType.ShortRange,
    weapons: [
      new Weapon(
        'Zombie Bite',
        buff(
          new Map([
            ...Weapons.Bite.damage,
            [EntityType.LowAltitude, 100],
            [EntityType.Rail, 80],
            [EntityType.Ship, 80],
          ]),
          -50,
        ),
        BiteAnimation.withSound('Attack/ZombieBite'),
        BiteHitAnimation,
        5,
      ),
    ],
  },
  null,
  {
    attackStance: 'once',
    directionOffset: 2,
    explosionSprite: {
      frames: 8,
      offset: { y: 2 },
      position: sprite(7, 1),
    },
    name: 'Units-Zombie',
    portrait: {
      position: sprite(27, 0),
      variants: 3,
    },
    slow: true,
  },
);
export const Ogre = new UnitInfo(
  48,
  'Ogre',
  'Unknown',
  'unknown',
  `Unknown`,
  `Unknown`,
  0,
  EntityType.Infantry,
  MovementTypes.Soldier,
  {
    cost: Number.POSITIVE_INFINITY,
    fuel: 20,
    radius: 4,
    vision: 1,
  },
  DefaultUnitAbilities,
  {
    type: AttackType.ShortRange,
    weapons: [Weapons.Club],
  },
  null,
  {
    attackStance: 'once',
    directionOffset: 2,
    explosionSprite: {
      frames: 8,
      position: sprite(7, 1),
    },
    name: 'Units-Ogre',
    portrait: {
      position: sprite(30, 0),
      variants: 3,
    },
    slow: true,
  },
);

export const Brute = new UnitInfo(
  UnitID.Brute,
  'Brute',
  'Blaine',
  'male',
  `The Brute is a huge, slow-moving unit with a powerful shotgun. Its high defense and attack power make it a force to be reckoned with anywhere on the battlefield. If you see a Brute, you better have a plan to deal with it.`,
  `{name} believes he can solve all problems with brute force, rarely admitting when he is wrong. Deep down, he is said to have a gentle heart and goes out of his way to protect those he cares about. However, some wonder if this gentleness is just a facade to hide his true intentions, which might simply involve using his shotgun to get what he wants.`,
  50,
  EntityType.Infantry,
  MovementTypes.Soldier,
  {
    cost: Number.POSITIVE_INFINITY,
    fuel: 60,
    radius: 4,
    vision: 1,
  },
  DefaultUnitAbilitiesWithCapture,
  {
    type: AttackType.ShortRange,
    weapons: [Weapons.Shotgun.withSupply(6)],
  },
  null,
  {
    attackStance: 'short',
    directionOffset: 2,
    explosionSprite: {
      frames: 8,
      offset: { y: 2 },
      position: sprite(7, 1),
    },
    name: 'Units-Brute',
    portrait: {
      position: sprite(33, 0),
      variants: 3,
    },
    slow: true,
  },
);

export const Commander = new UnitInfo(
  50,
  'Commander',
  'Unknown',
  'male',
  `Armies are composed of master strategists and troops on the ground executing orders. Then there's the Commander unit, who can neither strategize nor execute effectively. They excel in scheduling unnecessary meetings and perpetuating confusion under the guise of "alignment". Equipped only with a pistol, one has to wonder: What exactly is their purpose?`,
  `Even if it appears {name} is one step behind, he invariably ends up five steps ahead. He seems to be the only Commander unit with actual tactical and strategic abilities, perceiving the multiverse as a complex chessboard of possibilities where everyone but him is a pawn. Unlike his counterparts, who often get lost in bureaucracy and confusion, {name} navigates these complexities with unmatched foresight and precision, masterfully turning tough situations to his advantage.`,
  10,
  EntityType.Infantry,
  MovementTypes.Soldier,
  {
    cost: Number.POSITIVE_INFINITY,
    fuel: 30,
    radius: 2,
    vision: 3,
  },
  DefaultUnitAbilitiesWithCapture,
  { type: AttackType.ShortRange, weapons: [Weapons.Pistol.withSupply(5)] },
  null,
  {
    attackStance: 'short',
    directionOffset: 2,
    explosionSprite: {
      frames: 8,
      offset: { y: 1 },
      position: sprite(7, 1),
    },
    name: 'Units-Commander',
    portrait: {
      position: sprite(32, 0),
      variants: 3,
    },
    slow: true,
  },
);

export const Cannon = new UnitInfo(
  UnitID.Cannon,
  'Cannon',
  'Spike',
  'male',
  'A prototype unit with a powerful cannon but almost no mobility. Only a limited number of these units were produced before the project was scrapped.',
  `{name} is a bit of a loose cannon himself and he’s a good guy to have on your side.`,
  40,
  EntityType.Artillery,
  MovementTypes.Tires,
  {
    cost: Number.POSITIVE_INFINITY,
    fuel: 40,
    radius: 1,
    vision: 1,
  },
  new UnitAbilities({
    accessBuildings: true,
    moveAndAct: true,
    unfold: true,
  }),
  {
    range: [2, 6],
    type: AttackType.LongRange,
    weapons: [Weapons.Cannon.withSupply(7)],
  },
  null,
  {
    name: 'Units-Cannon',
    offset: { y: 3 },
    portrait: {
      position: sprite(51, 0),
      variants: 3,
    },
    unfold: sprite(0, 4),
    unfoldSounds: {
      fold: 'Unit/CannonFold',
      unfold: 'Unit/CannonUnfold',
    },
    unfoldSprite: {
      frames: 8,
      position: sprite(0, 3),
    },
  },
);

export const SuperAPU = new UnitInfo(
  52,
  'Super APU',
  Brute,
  'male',
  `The Super APU, the original version of the APU, is equipped with a powerful minigun and has higher defense compared to the regular APU. It can tear through enemy units with ease and requires a concerted effort to be taken down.`,
  `{name} emerged from a war-torn upbringing to become a revered military figure known for solving problems with brute force. His legendary status was cemented during a standoff where he single-handedly defended against an enemy encampment. Despite his fearsome reputation, whispers circulate among his closest allies about his secretive support for war orphans—a stark contrast to his ruthless battlefield persona. {name} continues to navigate the fine line between brutal authority and unexpected compassion, leaving many to question his true intentions.`,
  30,
  EntityType.Ground,
  MovementTypes.HeavySoldier,
  {
    cost: Number.POSITIVE_INFINITY,
    fuel: 60,
    radius: 5,
    vision: 4,
  },
  DefaultUnitAbilities,
  {
    type: AttackType.ShortRange,
    weapons: [Weapons.SuperMiniGun.withSupply(10)],
  },
  null,
  {
    attackStance: 'short',
    directionOffset: 2,
    explosionSprite: {
      frames: 8,
      position: sprite(7, 1),
    },
    name: 'Units-SuperAPU',
    portrait: {
      position: sprite(53, 0),
      variants: 3,
    },
  },
);

export const BazookaBear = new UnitInfo(
  UnitID.BazookaBear,
  'Bazooka Bear',
  'Bazoo',
  'unknown',
  `As an all-rounder, the Bazooka Bear can attack every other unit. Its low mobility is compensated by high long-range attack power. Many have asked: Why is it a bear with a bazooka? You'll have to ask the squad leader that question!`,
  `After losing his partner in crime, {name} took up a bazooka to honor his fallen friend. Now, {name} has assembled a team of elite Bazooka Bears to avenge his friend's death. He is a loyal leader who will stop at nothing to protect those he cares about.`,
  10,
  EntityType.Infantry,
  MovementTypes.Soldier,
  {
    cost: Number.POSITIVE_INFINITY,
    fuel: 100,
    radius: 3,
    vision: 2,
  },
  DefaultUnitAbilities,
  {
    range: [1, 2],
    type: AttackType.LongRange,
    weapons: [Weapons.Bazooka.withSupply(5)],
  },
  null,
  {
    attackStance: 'short',
    directionOffset: 2,
    explosionSprite: {
      frames: 8,
      position: sprite(7, 1),
    },
    leaderAlternative: true,
    name: 'Units-BazookaBear',
    portrait: {
      position: sprite(31, 0),
      variants: 3,
    },
    slow: true,
  },
);

export const AIU = new UnitInfo(
  UnitID.AIU,
  'AIU',
  'Jaeger',
  'male',
  `The AIU, or Artificial Intelligence Unit, is a highly advanced robot — possibly sent from another universe — to wreak havoc on the battlefield. It boasts extremely strong defense and is equipped with a powerful minigun.`,
  `{name} is a killing machine through and through. He enjoys walks on the beach only when he can crush an opponent like the sand beneath his feet. We aren't sure if he is conscious or just stringing together random words to sound like he is, but he sure seems smarter than the average human.`,
  40,
  EntityType.Infantry,
  MovementTypes.HeavySoldier,
  {
    cost: Number.POSITIVE_INFINITY,
    fuel: 60,
    radius: 5,
    vision: 4,
  },
  DefaultUnitAbilitiesWithCapture,
  {
    type: AttackType.ShortRange,
    weapons: [Weapons.AIUMiniGun.withSupply(10)],
  },
  null,
  {
    attackStance: 'short',
    directionOffset: 2,
    explosionSprite: {
      frames: 8,
      position: sprite(7, 1),
    },
    name: 'Units-AIU',
    portrait: {
      position: sprite(54, 0),
      variants: 3,
    },
  },
);

// The order of units must not be changed.
const Units = [
  Pioneer,
  Infantry,
  RocketLauncher,
  APU,
  SmallTank,
  Jeep,
  Artillery,
  Battleship,
  Helicopter,
  Humvee,
  AntiAir,
  HeavyArtillery,
  Lander,
  Sniper,
  Flamethrower,
  Saboteur,
  TransportHelicopter,
  FighterJet,
  Bomber,
  Jetpack,
  SeaPatrol,
  AcidBomber,
  Drone,
  ReconDrone,
  XFighter,
  Medic,
  AmphibiousTank,
  Destroyer,
  Frigate,
  Hovercraft,
  PatrolShip,
  SupportShip,
  Corvette,
  Mammoth,
  TransportTrain,
  Dinosaur,
  HeavyTank,
  SuperTank,
  HumveeAvenger,
  ArtilleryHumvee,
  SupplyTrain,
  Truck,
  Octopus,
  Dragon,
  Bear,
  Alien,
  Zombie,
  Ogre,
  Brute,
  Commander,
  Cannon,
  SuperAPU,
  BazookaBear,
  AIU,
];

export const InitialPortraits = new Set([Pioneer, Sniper, Flamethrower]);

export const SpecialUnits = new Set([
  Alien,
  BazookaBear,
  Bear,
  Dinosaur,
  Dragon,
  Octopus,
  Ogre,
]);

export function getUnitInfo(id: number): UnitInfo | null {
  return Units[id - 1] || null;
}

export function getUnitInfoOrThrow(id: number): UnitInfo {
  const unit = getUnitInfo(id);
  if (!unit) {
    throw new Error(`getUnitInfoOrThrow: Could not find unit with id '${id}'.`);
  }
  return unit;
}

const units = Units.slice().sort((infoA, infoB) => {
  if (infoA.movementType.sortOrder === infoB.movementType.sortOrder) {
    return infoA.getCostFor(null) - infoB.getCostFor(null);
  }
  return infoA.movementType.sortOrder - infoB.movementType.sortOrder;
});

export function filterUnits(
  fn: (unitInfo: UnitInfo) => boolean | undefined,
): ReadonlyArray<UnitInfo> {
  return units.filter(fn);
}

export function mapUnits<T>(
  fn: (unitInfo: UnitInfo, index: number) => T,
): Array<T> {
  return units.map(fn);
}

export function mapUnitsWithContentRestriction<T>(
  fn: (unitInfo: UnitInfo, index: number) => T,
  skills: ReadonlySet<Skill>,
): Array<T> {
  return units
    .filter(
      (unit) =>
        (!SpecialUnits.has(unit) &&
          unit.getCostFor(null) < Number.POSITIVE_INFINITY) ||
        hasUnlockedUnit(unit, skills),
    )
    .map(fn);
}

export function getAllUnits(): ReadonlyArray<UnitInfo> {
  return units;
}

export function mapMovementTypes<T>(
  fn: (movementType: MovementType) => T,
): Array<T> {
  return (
    Object.keys(MovementTypes) as ReadonlyArray<keyof typeof MovementTypes>
  ).map((key) => fn(MovementTypes[key]));
}

export function mapWeapons<T>(fn: (weapon: Weapon) => T): Array<T> {
  return (Object.keys(Weapons) as ReadonlyArray<keyof typeof Weapons>).map(
    (key) => fn(Weapons[key]),
  );
}
