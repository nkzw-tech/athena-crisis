import { PlainMap } from '@deities/athena/map/PlainMap.tsx';
import { PlayerID } from '@deities/athena/map/Player.tsx';
import { EncodedEffects } from '../Effects.tsx';
import { EncodedActionResponses } from '../EncodedActions.tsx';

export type ReplayActionsEntry = {
  actions: EncodedActionResponses;
  timestamp: number;
  type: 'actions';
};

export type MutableReplayEntry =
  | ReplayActionsEntry
  | { mapName: string; timestamp: number; type: 'info' }
  | { state: PlainMap; timestamp: number; type: 'map' }
  | { effects: EncodedEffects; type: 'effects' }
  | {
      campaignPlayerID: PlayerID | null;
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
