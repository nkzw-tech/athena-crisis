import { MapMetadata } from '@deities/apollo/MapMetadata.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { CampaignMapName } from './CampaignMapName.tsx';

export type ClientLevelID = string;
export type LevelID = number;

export type Level<T> = Readonly<{
  mapId: T;
  next?: Array<Level<T> | [number, Level<T>]>;
}>;

export type PlainLevel<T = number> = Readonly<{
  mapId: T;
  next?: ReadonlyArray<T | [number, T]>;
}>;

export type LevelEntry<T> = [T, PlainLevel<T>];

export type Campaign<T> = Readonly<{
  description: string;
  name: string;
  next: Level<T>;
}>;

export type CampaignLevel = Level<CampaignMapName>;

export type LevelMap<T, S = Level<T>> = ReadonlyMap<T, S>;
export type PlainCampaign<T> = Readonly<{
  description: string;
  levels: LevelMap<T, PlainLevel<T>>;
  name: string;
  next: T;
}>;

export type CharacterNameEntry = readonly [number, string];
export type CharacterNameMap = ReadonlyMap<number, string>;

export type CampaignModule = Readonly<{
  default: Campaign<CampaignMapName>;
  metadata: { tags: ReadonlyArray<string> };
}>;

export type MapModule = Readonly<{
  default: MapData;
  metadata: Partial<MapMetadata>;
}>;
