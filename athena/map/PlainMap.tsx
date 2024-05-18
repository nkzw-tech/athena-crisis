import type { Decorator } from '../info/Decorator.tsx';
import type { ModifierMap, TileMap } from '../MapData.tsx';
import type { PlainWinConditions } from '../WinConditions.tsx';
import type { Biome } from './Biome.tsx';
import type { PlainBuilding } from './Building.tsx';
import type { PlainTeams } from './Team.tsx';
import type { PlainUnit } from './Unit.tsx';

export type PlainEntitiesList<T> = ReadonlyArray<
  readonly [x: number, y: number, entity: T]
>;

export type PlainMapConfig = Readonly<{
  biome: Biome;
  blocklistedBuildings: ReadonlyArray<number>;
  blocklistedSkills?: ReadonlyArray<number>;
  blocklistedUnits: ReadonlyArray<number>;
  fog: boolean;
  multiplier: number;
  seedCapital: number;
  winConditions?: PlainWinConditions;
}>;

export type PlainMap = Readonly<{
  active: ReadonlyArray<number>;
  buildings: PlainEntitiesList<PlainBuilding>;
  config: PlainMapConfig;
  currentPlayer: number;
  decorators: PlainEntitiesList<Decorator>;
  map: TileMap;
  modifiers: ModifierMap;
  round: number;
  size: Readonly<{
    height: number;
    width: number;
  }>;
  teams: PlainTeams;
  units: PlainEntitiesList<PlainUnit>;
}>;
