import type { PlainBuilding } from '@deities/athena/map/Building.tsx';
import type Building from '@deities/athena/map/Building.tsx';
import type { PlainEntitiesList } from '@deities/athena/map/PlainMap.tsx';
import type { PlainUnit } from '@deities/athena/map/Unit.tsx';
import type Unit from '@deities/athena/map/Unit.tsx';
import type Vector from '@deities/athena/map/Vector.tsx';
import type MapData from '@deities/athena/MapData.tsx';
import type ImmutableMap from '@nkzw/immutable-map';
import type { ActionResponse } from './ActionResponse.tsx';
import type { Effects } from './Effects.tsx';
import type { EncodedActionResponse } from './EncodedActions.tsx';

export type GameStateEntry = readonly [ActionResponse, MapData];
export type GameState = ReadonlyArray<GameStateEntry>;
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
