import {
  AttributeRange,
  AttributeRangeWithZero,
} from '@deities/athena/lib/getAttributeRange.tsx';
import UnknownTypeError from '@deities/hephaestus/UnknownTypeError.tsx';
import { PlayStyle } from '@deities/hermes/PlayStyle.tsx';
import { TypeaheadDataSource } from '@deities/ui/Typeahead.tsx';
import Drawer from '../../drawer/Drawer.tsx';
import { CampaignEditorState } from '../Types.tsx';
import CampaignEditorSettingsPanel, {
  UserNode,
} from './CampaignEditorSettingsPanel.tsx';

export default function CampaignEditorControlPanel({
  campaignEditorState,
  campaignExists,
  campaignName,
  description,
  difficulty,
  exportMaps,
  isAdmin,
  playStyle,
  saveCampaign,
  setCampaignName,
  setDescription,
  setDifficulty,
  setPlayStyle,
  setTags,
  setUsers,
  tags,
  userDataSource,
  users,
}: {
  campaignEditorState: CampaignEditorState;
  campaignExists: boolean;
  campaignName: string;
  description: string;
  difficulty: AttributeRangeWithZero;
  exportMaps: () => void;
  isAdmin?: boolean;
  playStyle: PlayStyle | null;
  saveCampaign: (type?: 'Export') => void;
  setCampaignName: (name: string) => void;
  setDescription: (description: string) => void;
  setDifficulty: (rating: AttributeRange) => void;
  setPlayStyle: (playStyle: PlayStyle | null) => void;
  setTags: (tags: ReadonlyArray<string>) => void;
  setUsers: (users: ReadonlyArray<UserNode>) => void;
  tags: ReadonlyArray<string>;
  userDataSource: TypeaheadDataSource<UserNode>;
  users: ReadonlyArray<UserNode>;
}) {
  return (
    <Drawer expand={false} mode={campaignEditorState.mode} visible>
      {(() => {
        const { mode } = campaignEditorState;
        switch (mode) {
          case 'settings':
            return (
              <CampaignEditorSettingsPanel
                campaignExists={campaignExists}
                campaignName={campaignName}
                description={description}
                difficulty={difficulty}
                exportMaps={exportMaps}
                isAdmin={isAdmin}
                playStyle={playStyle}
                saveCampaign={saveCampaign}
                setCampaignName={setCampaignName}
                setDescription={setDescription}
                setDifficulty={setDifficulty}
                setPlayStyle={setPlayStyle}
                setTags={setTags}
                setUsers={setUsers}
                tags={tags}
                userDataSource={userDataSource}
                users={users}
              />
            );
          default: {
            mode satisfies never;
            throw new UnknownTypeError('CampaignEditorControlPanel', mode);
          }
        }
      })()}
    </Drawer>
  );
}
