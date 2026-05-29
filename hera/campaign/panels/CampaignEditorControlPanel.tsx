import { AttributeRange, AttributeRangeWithZero } from '@deities/athena/lib/getAttributeRange.tsx';
import { PlayStyle } from '@deities/hermes/PlayStyle.tsx';
import { TypeaheadDataSource } from '@deities/ui/Typeahead.tsx';
import UnknownTypeError from '@nkzw/core/UnknownTypeError.js';
import Drawer from '../../drawer/Drawer.tsx';
import { CampaignEditorState } from '../Types.tsx';
import CampaignEditorSettingsPanel, { UserNode } from './CampaignEditorSettingsPanel.tsx';

export default function CampaignEditorControlPanel({
  allowSuperHard,
  campaignEditorState,
  campaignExists,
  campaignName,
  description,
  difficulty,
  exportMaps,
  isAdmin,
  playStyle,
  saveCampaign,
  setAllowSuperHard,
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
  allowSuperHard: boolean;
  campaignEditorState: CampaignEditorState;
  campaignExists: boolean;
  campaignName: string;
  description: string;
  difficulty: AttributeRangeWithZero;
  exportMaps: () => void;
  isAdmin?: boolean;
  playStyle: PlayStyle | null;
  saveCampaign: (type?: 'Export') => void;
  setAllowSuperHard: (allowSuperHard: boolean) => void;
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
                allowSuperHard={allowSuperHard}
                campaignExists={campaignExists}
                campaignName={campaignName}
                description={description}
                difficulty={difficulty}
                exportMaps={exportMaps}
                isAdmin={isAdmin}
                playStyle={playStyle}
                saveCampaign={saveCampaign}
                setAllowSuperHard={setAllowSuperHard}
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
