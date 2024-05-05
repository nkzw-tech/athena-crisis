import { Decorator } from '../info/Decorator.tsx';
import { ModifierMap, TileMap } from '../MapData.tsx';
import { PlainWinConditions } from '../WinConditions.tsx';
import { Biome } from './Biome.tsx';
import { PlainBuilding } from './Building.tsx';
import { PlainTeams } from './Team.tsx';
import { PlainUnit } from './Unit.tsx';

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
