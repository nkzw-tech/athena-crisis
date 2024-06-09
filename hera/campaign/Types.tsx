import { Scenario } from '@deities/apollo/Effects.tsx';
import { PlayStyle } from '@deities/hermes/PlayStyle.tsx';
import { ClientLevelID } from '@deities/hermes/Types.tsx';
import { BaseMapEditorProps } from '../editor/MapEditor.tsx';
import { EditorMode } from '../editor/Types.tsx';

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
    onCreate?: (map: MapNode & { local: boolean }) => void;
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
  playStyle: PlayStyle | null | undefined;
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
