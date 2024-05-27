import Building, { PlainBuilding } from '@deities/athena/map/Building.tsx';
import { PlainEntitiesList, PlainMap } from '@deities/athena/map/PlainMap.tsx';
import Unit, { PlainUnit } from '@deities/athena/map/Unit.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import ImmutableMap from '@nkzw/immutable-map';
import { ActionResponse } from './ActionResponse.tsx';
import { Effects } from './Effects.tsx';
import { EncodedActionResponse } from './EncodedActions.tsx';

export type GameStateEntry = readonly [ActionResponse, MapData];
export type EncodedGameStateEntry = readonly [EncodedActionResponse, PlainMap];
export type GameState = ReadonlyArray<GameStateEntry>;
export type EncodedGameState = ReadonlyArray<EncodedGameStateEntry>;
export type MutableGameState = Array<GameStateEntry>;
export type GameStateWithEffects = ReadonlyArray<
  readonly [...GameStateEntry, Effects]
>;

export type EncodedGameActionResponseWithError =
  | EncodedGameActionResponse
  // Error
  | { n: 'x' }
  // Passthrough
  | { n: 'p' };

export type EncodedGameActionResponseItem = [
  EncodedActionResponse,
  PlainEntitiesList<PlainBuilding>?,
  PlainEntitiesList<PlainUnit>?,
];

export type EncodedGameActionResponse = [
  actionResponse: EncodedGameActionResponseItem | null,
  actionResponseItems?: ReadonlyArray<
    [
      EncodedActionResponse,
      PlainEntitiesList<PlainBuilding>?,
      PlainEntitiesList<PlainUnit>?,
    ]
  >,
  timeout?: number | null,
];

export type GameActionResponses = ReadonlyArray<{
  actionResponse: ActionResponse;
  buildings?: ImmutableMap<Vector, Building>;
  units?: ImmutableMap<Vector, Unit>;
}>;

export type GameActionResponse = {
  others?: GameActionResponses | undefined;
  self: {
    actionResponse: ActionResponse;
    buildings?: ImmutableMap<Vector, Building>;
    units?: ImmutableMap<Vector, Unit>;
  } | null;
  timeout?: number | null;
};
