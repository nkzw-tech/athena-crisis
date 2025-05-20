import { PlainMap } from '@deities/athena/map/PlainMap.tsx';
import { EncodedActionResponses } from '../EncodedActions.tsx';

export type MutableReplayEntry =
  | { mapName: string; timestamp: number; type: 'info' }
  | { state: PlainMap; timestamp: number; type: 'map' }
  | { actions: EncodedActionResponses; timestamp: number; type: 'actions' }
  | {
      type: 'users';
      users: ReadonlyArray<
        Readonly<{
          character: string;
          displayName: string;
          equippedUnitCustomizations: ReadonlyArray<number>;
          factionName: string;
          id: string;
          username: string;
        }>
      >;
    };

export type ReplayState = Readonly<ReadonlyArray<MutableReplayEntry>>;
