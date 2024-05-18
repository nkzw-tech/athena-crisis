import type { Scenario } from '@deities/apollo/Effects.tsx';
import type { ClientLevelID } from '@deities/hermes/Types.tsx';
import type { BaseMapEditorProps } from '../editor/MapEditor.tsx';
import type { EditorMode } from '../editor/Types.tsx';
import type { PlayStyleType } from './lib/PlayStyle.tsx';

type CampaignEditorMode = 'settings';

export type MapNode = Readonly<{
  effects: string;
  id: ClientLevelID;
  name: string;
  slug: string;
  state: string;
  tags: ReadonlyArray<string>;
}>;

export type MapEditorContainerProps = BaseMapEditorProps &
  Readonly<{
    onCreate?: (map: MapNode) => void;
    onUpdate?: (map: MapNode) => void;
  }>;

export type CampaignEditorState = Readonly<{
  createMap?: boolean;
  map?: MapNode;
  mapEditorMode?: EditorMode;
  mapEditorScenario?: Scenario;
  mode: CampaignEditorMode;
}>;

export type SetCampaignEditorStateFunction = (
  state: Partial<CampaignEditorState>,
) => void;

export type CampaignObject = Readonly<{
  description: string;
  difficulty: number;
  id?: string;
  levels: string;
  name: string;
  next: ClientLevelID;
  playStyle: PlayStyleType | null | undefined;
  tags: ReadonlyArray<string>;
}>;

export type UpdateCampaignFunction = (
  campaign: Omit<CampaignObject, 'owners'> & {
    owners: ReadonlyArray<string>;
  },
  setSaveState: (state: CampaignEditorSaveState) => void,
  type?: 'Export',
) => void;

export type CampaignEditorSetMapFunction = (
  mapId: ClientLevelID,
  mode?: EditorMode,
  scenario?: Scenario,
) => void;

type CampaignEditorSaveMessageId =
  | 'cannot-remove-self'
  | 'cycle'
  | 'duplicate'
  | 'invalid-name'
  | 'name-exists'
  | 'saved'
  | string;

export type CampaignEditorSaveState = Readonly<
  | {
      id: CampaignEditorSaveMessageId;
    }
  | {
      message: string;
    }
>;
