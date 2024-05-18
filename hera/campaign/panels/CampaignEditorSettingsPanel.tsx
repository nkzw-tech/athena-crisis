import type {
  AttributeRange,
  AttributeRangeWithZero,
} from '@deities/athena/lib/getAttributeRange.tsx';
import { DoubleSize } from '@deities/athena/map/Configuration.tsx';
import Box from '@deities/ui/Box.tsx';
import InlineLink from '@deities/ui/InlineLink.tsx';
import Stack from '@deities/ui/Stack.tsx';
import Tag from '@deities/ui/Tag.tsx';
import TagInput from '@deities/ui/TagInput.tsx';
import type { TypeaheadDataSource } from '@deities/ui/Typeahead.tsx';
import { TypeaheadDataSourceEntry } from '@deities/ui/Typeahead.tsx';
import { css } from '@emotion/css';
import { fbt } from 'fbt';
import { RangeSelector } from '../../card/Range.tsx';
import useTagDataSource from '../../hooks/useTagDataSource.tsx';
import type { PlayStyleType } from '../lib/PlayStyle.tsx';
import PlayStyle, { getTranslatedPlayStyleName } from '../lib/PlayStyle.tsx';

export type UserNode = Readonly<{
  displayName: string;
  id: string;
}>;

const emptySuggestions = [
  new TypeaheadDataSourceEntry('published', 'published', 'published'),
];

export default function CampaignEditorSettingsPanel({
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
  campaignExists: boolean;
  campaignName: string;
  description: string;
  difficulty: AttributeRangeWithZero;
  exportMaps: () => void;
  isAdmin?: boolean;
  playStyle: PlayStyleType | null;
  saveCampaign: (type?: 'Export') => void;
  setCampaignName: (name: string) => void;
  setDescription: (description: string) => void;
  setDifficulty: (rating: AttributeRange) => void;
  setPlayStyle: (playStyle: PlayStyleType | null) => void;
  setTags: (tags: ReadonlyArray<string>) => void;
  setUsers: (users: ReadonlyArray<UserNode>) => void;
  tags: ReadonlyArray<string>;
  userDataSource: TypeaheadDataSource<UserNode>;
  users: ReadonlyArray<UserNode>;
}) {
  const dataSource = useTagDataSource();

  return (
    <Stack className={marginStyle} gap={24} vertical verticalPadding>
      <Box gap vertical>
        <label>
          <Stack gap start vertical>
            <div className="input-label">
              <fbt desc="Campaign name label">Name</fbt>
            </div>
            <input
              className={inputStyle}
              onBlur={(event) => event.target.classList.add('validate')}
              onChange={(event) => setCampaignName(event.target.value)}
              placeholder={String(
                fbt('campaign name', 'placeholder for campaign name'),
              )}
              required
              type="text"
              value={campaignName}
            />
          </Stack>
        </label>
      </Box>
      <Box gap vertical>
        <Stack gap vertical>
          <span>
            <fbt desc="Label for campaign tags">Tags</fbt>
          </span>
          <TagInput
            dataSource={dataSource}
            emptySuggestions={emptySuggestions}
            freeform
            setTags={setTags}
            tags={tags}
          />
          <p>
            <fbt desc="Explanation for tags">
              Campaigns with the{' '}
              <fbt:param name="tag-name">
                <Tag tag="published" />
              </fbt:param>{' '}
              tag will be visible in the campaign list and on your profile.
            </fbt>
          </p>
        </Stack>
      </Box>
      <Box gap vertical>
        <span>
          <fbt desc="Label for campaign owners">Owners</fbt>
        </span>
        <TagInput
          dataSource={userDataSource}
          setTags={setUsers}
          stringify={({ displayName }) => displayName}
          tags={users}
          toValue={({ id }) => id}
        />
        <div>
          <fbt desc="Description for campaign owners">
            Owners can edit every map that is part of the campaign.
          </fbt>
        </div>
      </Box>
      <Box gap vertical>
        <span>
          <fbt desc="Label for campaign description">Description</fbt>
        </span>
        <textarea
          className={descriptionStyle}
          onChange={(event) => setDescription(event.target.value)}
          value={description}
        />
      </Box>
      <Box alignCenter gap={16}>
        <span>
          <fbt desc="Label for campaign playstyle">Playstyle</fbt>
        </span>
        <Stack gap={16}>
          <InlineLink
            className={buttonStyle}
            onClick={() => setPlayStyle(null)}
            selected={playStyle == null}
          >
            <fbt desc="Button to allow the user to select their playstyle">
              User Selectable
            </fbt>
          </InlineLink>
          {Object.values(PlayStyle).map((currentPlayStyle) => (
            <InlineLink
              className={buttonStyle}
              key={currentPlayStyle}
              onClick={() => setPlayStyle(currentPlayStyle)}
              selected={currentPlayStyle === playStyle}
            >
              {getTranslatedPlayStyleName(currentPlayStyle)}
            </InlineLink>
          ))}
        </Stack>
      </Box>
      <Box gap={16}>
        <span>
          <fbt desc="Label for campaign difficulty">
            Campaign Difficulty Rating
          </fbt>
        </span>
        <RangeSelector invert onSelect={setDifficulty} value={difficulty} />
      </Box>
      <Box gap={16}>
        <InlineLink onClick={() => saveCampaign()}>
          <fbt desc="Button to save a campaign">Save Campaign</fbt>
        </InlineLink>
        {isAdmin ? (
          <>
            {campaignExists && (
              <InlineLink onClick={() => saveCampaign('Export')}>
                <fbt desc="Button to export a campaign">Save and Export</fbt>
              </InlineLink>
            )}
            <InlineLink onClick={exportMaps}>
              <fbt desc="Button to export all maps from a campaign">
                Export all Maps
              </fbt>
            </InlineLink>
          </>
        ) : null}
      </Box>
    </Stack>
  );
}

const inputStyle = css`
  max-width: 320px;
`;

const descriptionStyle = css`
  height: 96px;
  line-height: 1.4em;
  width: 100%;
`;

const marginStyle = css`
  margin-bottom: ${DoubleSize * 1.5}px;
`;

const buttonStyle = css`
  padding: 4px;
`;
