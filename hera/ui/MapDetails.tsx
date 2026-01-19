import { isValidTimer } from '@deities/apollo/lib/GameTimerValue.tsx';
import getUserRoute from '@deities/apollo/routes/getUserRoute.tsx';
import getMapSize from '@deities/athena/lib/getMapSize.tsx';
import MapData from '@deities/athena/MapData.tsx';
import Breakpoints from '@deities/ui/Breakpoints.tsx';
import clipBorder from '@deities/ui/clipBorder.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import Icon from '@deities/ui/Icon.tsx';
import NoSkill from '@deities/ui/icons/NoSkill.tsx';
import Size from '@deities/ui/icons/Size.tsx';
import Skills from '@deities/ui/icons/Skills.tsx';
import Tag from '@deities/ui/Tag.tsx';
import TagList from '@deities/ui/TagList.tsx';
import { css, cx } from '@emotion/css';
import Charge from '@iconify-icons/pixelarticons/ac.js';
import Chess from '@iconify-icons/pixelarticons/chess.js';
import Coin from '@iconify-icons/pixelarticons/coin.js';
import Watch from '@iconify-icons/pixelarticons/device-watch.js';
import Campaign from '@iconify-icons/pixelarticons/git-branch.js';
import Hourglass from '@iconify-icons/pixelarticons/hourglass.js';
import Timeline from '@iconify-icons/pixelarticons/timeline.js';
import Tournament from '@iconify-icons/pixelarticons/tournament.js';
import User from '@iconify-icons/pixelarticons/user.js';
import Users from '@iconify-icons/pixelarticons/users.js';
import Stack, { VStack } from '@nkzw/stack';
import { ReactNode } from 'react';
import getMapSizeName from '../lib/getMapSizeName.tsx';
import getTranslatedBiomeName from '../lib/getTranslatedBiomeName.tsx';
import getTranslatedTimerName from '../lib/getTranslatedTimerName.tsx';
import MapSize from '../lib/MapSize.tsx';

export type MapCreator = Readonly<{
  displayName: string;
  id: string;
  username: string;
}>;

export type MapDetailsProps = Readonly<{
  buttons?: ReactNode;
  creator: MapCreator | null;
  gap?: 8 | 16;
  hasSkills?: boolean;
  isCampaign?: boolean;
  isRanked?: boolean;
  map: MapData;
  rating?: number;
  showCampaign?: boolean;
  showGameState?: boolean;
  showRound?: 'ended' | 'ongoing';
  showSeedCapital?: boolean;
  subText?: ReactNode;
  tags?: ReadonlyArray<string>;
  teamPlay?: boolean;
  timer?: number | null;
}>;

export const SpecialUsers = new Set(['User-1', 'User-2876']);

export default function MapDetails({
  buttons,
  creator,
  gap = 16,
  hasSkills,
  isCampaign,
  isRanked,
  map,
  rating,
  showCampaign,
  showGameState,
  showRound,
  showSeedCapital,
  subText,
  tags,
  teamPlay,
  timer,
}: MapDetailsProps) {
  const { initialCharge, seedCapital } = map.config;
  const shouldShowSeedCapital = !showGameState || showSeedCapital;
  return map ? (
    <VStack between gap={16} stretch wrap>
      <VStack between gap={gap === 8 ? true : gap} wrap>
        {creator &&
        !SpecialUsers.has(creator.id) &&
        !tags?.includes('official') ? (
          <div>
            <fbt desc="Map created by">
              by{' '}
              <fbt:param name="username">
                <Tag
                  tag={creator.displayName}
                  to={getUserRoute(creator.username)}
                />
              </fbt:param>
            </fbt>
          </div>
        ) : null}
        {!isCampaign && tags?.length ? (
          <div className={cx(containerStyle, tagStyle)}>
            <TagList tags={[...tags].sort()} />
          </div>
        ) : null}
        {subText}
        {isCampaign && showCampaign ? (
          <Stack alignCenter gap wrap>
            <Icon icon={Campaign} />{' '}
            <fbt desc="Label for campaign games">Campaign</fbt>
          </Stack>
        ) : null}
        {rating && rating > 0 ? (
          <Stack alignCenter gap wrap>
            <Icon icon={Timeline} /> {rating.toFixed(1)}
          </Stack>
        ) : null}
        <Stack alignCenter gap wrap>
          <Icon icon={User} /> {map.active.length}
          {' - '}
          {map.teams.map(({ players }) => players.size).join('v')}
        </Stack>
        <Stack alignCenter gap wrap>
          <Icon icon={Size} /> {getMapSizeName(getMapSize(map.size, MapSize))}{' '}
          {map.size.width}x{map.size.height}
        </Stack>
        <Stack alignCenter gap wrap>
          <Icon icon={Chess} /> {getTranslatedBiomeName(map.config.biome)}
        </Stack>
        {shouldShowSeedCapital && (
          <Stack alignCenter gap wrap>
            <Icon className={iconOffsetStyle} icon={Coin} /> {seedCapital}
          </Stack>
        )}
        {!showGameState && initialCharge > 0 && (
          <Stack alignCenter gap wrap>
            <Icon className={iconOffsetStyle} icon={Charge} />{' '}
            {initialCharge === 1 ? (
              <fbt desc="Label for initial charges">1 Charge</fbt>
            ) : (
              <fbt desc="Label for initial charges">
                <fbt:param name="charges">{initialCharge}</fbt:param> Charges
              </fbt>
            )}
          </Stack>
        )}
        {teamPlay && (
          <Stack alignCenter gap wrap>
            <Icon icon={Users} />{' '}
            <fbt desc="Label for teamplay maps">Teamplay</fbt>
          </Stack>
        )}
        {showGameState && (
          <>
            {isValidTimer(timer) ? (
              <Stack alignCenter gap wrap>
                <Icon icon={Watch} /> {getTranslatedTimerName(timer)}
              </Stack>
            ) : null}

            {!isCampaign && (
              <>
                <Stack alignCenter gap wrap>
                  <Icon icon={hasSkills ? Skills : NoSkill} />{' '}
                  {hasSkills ? (
                    <fbt desc="Label for a game with skills">Skills</fbt>
                  ) : (
                    <fbt desc="Label for a game without skills">No skills</fbt>
                  )}
                </Stack>
                <Stack alignCenter gap wrap>
                  <Icon icon={Tournament} />{' '}
                  {isRanked ? (
                    <fbt desc="Label for ranked game">Ranked</fbt>
                  ) : (
                    <fbt desc="Label for casual game">Casual</fbt>
                  )}
                </Stack>
              </>
            )}
          </>
        )}
        {showRound && (
          <Stack alignCenter gap wrap>
            <Icon className={iconOffsetStyle} icon={Hourglass} />{' '}
            {showRound === 'ended' ? (
              <fbt desc="Description for map rounds">
                <fbt:param name="round">{map.round}</fbt:param>{' '}
                <fbt:plural
                  count={map.round}
                  many="Rounds"
                  name="number of rounds"
                >
                  Round
                </fbt:plural>
              </fbt>
            ) : (
              <fbt desc="Description for current map round of an ongoing game">
                Round <fbt:param name="round">{map.round}</fbt:param>
              </fbt>
            )}
          </Stack>
        )}
      </VStack>
      {buttons && (
        <Stack alignCenter className={buttonStyle} gap={24} wrap>
          {buttons}
        </Stack>
      )}
    </VStack>
  ) : null;
}

const containerStyle = css`
  backdrop-filter: blur(8px);
  background-color: ${applyVar('background-color-light')};
  margin: -4px;
  padding: 4px;
  width: fit-content;
`;

const tagStyle = css`
  ${clipBorder()};
`;

const iconOffsetStyle = css`
  margin: 2px 0 -2px;
`;

const buttonStyle = css`
  ${Breakpoints.sm} {
    max-width: 240px;
  }

  ${Breakpoints.lg} {
    max-width: unset;
  }
`;
