import type { SoundName } from './Music.tsx';

export class MovementType {
  constructor(
    public readonly id: number,
    private readonly internalName: string,
    public readonly sound: SoundName,
    public readonly endSound: SoundName | null,
    public readonly endDelay: 'quarter' | 'none',
    public readonly sortOrder: number,
    public readonly alternative?: MovementType,
  ) {}

  get name() {
    Object.defineProperty(this, 'name', { value: this.internalName });
    return this.internalName;
  }
}
const Tread = new MovementType(
  4,
  'Tread',
  'Movement/Tread',
  'Movement/TreadEnd',
  'none',
  3,
);
export const MovementTypes = {
  Air: new MovementType(
    5,
    'Air',
    'Movement/Air',
    'Movement/AirEnd',
    'quarter',
    5,
  ),
  AirInfantry: new MovementType(
    7,
    'Air Infantry',
    'Movement/AirInfantry',
    'Movement/AirInfantryEnd',
    'quarter',
    1,
  ),
  Amphibious: new MovementType(
    8,
    'Amphibious',
    'Movement/Amphibious',
    null,
    'none',
    6,
    Tread,
  ),
  HeavySoldier: new MovementType(
    2,
    'Heavy Soldier',
    'Movement/HeavySoldier',
    'Movement/HeavySoldierEnd',
    'none',
    1,
  ),
  LowAltitude: new MovementType(
    10,
    'Low Altitude',
    'Movement/LowAltitude',
    null,
    'none',
    4,
  ),
  Rail: new MovementType(
    9,
    'Rail',
    'Movement/Rail',
    'Movement/RailEnd',
    'quarter',
    8,
  ),
  Ship: new MovementType(6, 'Ship', 'Movement/Ship', null, 'none', 7),
  Soldier: new MovementType(
    1,
    'Soldier',
    'Movement/Soldier',
    'Movement/SoldierEnd',
    'quarter',
    1,
  ),
  Tires: new MovementType(
    3,
    'Tires',
    'Movement/Tires',
    'Movement/TiresEnd',
    'quarter',
    2,
  ),
  Tread,
};
