import { AIRegistryT } from '@deities/apollo/actions/executeGameAction.tsx';
import { Skill } from '@deities/athena/info/Skill.tsx';
import Player, { isBot, PlayerID } from '@deities/athena/map/Player.tsx';
import MapData from '@deities/athena/MapData.tsx';
import Box from '@deities/ui/Box.tsx';
import useHorizontalNavigation from '@deities/ui/controls/useHorizontalNavigation.tsx';
import useInput from '@deities/ui/controls/useInput.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import getColor, { playerToColor } from '@deities/ui/getColor.tsx';
import Icon from '@deities/ui/Icon.tsx';
import InlineLink, { InlineLinkColor } from '@deities/ui/InlineLink.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { css, cx } from '@emotion/css';
import Android from '@iconify-icons/pixelarticons/android.js';
import { ReactNode, useCallback, useState } from 'react';
import MiniPortrait from '../character/MiniPortrait.tsx';
import { CharacterImage } from '../character/PortraitPicker.tsx';
import AISelector from './AISelector.tsx';
import PlayerIcon from './PlayerIcon.tsx';
import PlayerPosition from './PlayerPosition.tsx';
import { SkillIcon, SkillSelector } from './SkillDialog.tsx';
import Vs from './Vs.tsx';

type UserLike =
  | {
      displayName: string;
    }
  | {
      character: CharacterImage;
      displayName: string;
      username: string;
    };

export default function PlayerSelector({
  activePlayer,
  aiRegistry,
  availableSkills,
  children,
  hasSkills,
  inline,
  locked,
  map,
  onClick,
  onSelect,
  onSelectAI,
  onSelectSkill,
  onSelectSkills,
  selectedPlayer,
  skillSlots,
  users,
  viewerPlayerID,
}: {
  activePlayer?: PlayerID | null;
  aiRegistry?: AIRegistryT | null;
  availableSkills?: ReadonlySet<Skill> | null;
  children?: ReactNode;
  hasSkills: boolean;
  inline?: boolean;
  locked?: boolean;
  map: MapData;
  onClick?: ((player: PlayerID) => void) | null;
  onSelect?: ((player: PlayerID) => void) | null;
  onSelectAI?: ((player: PlayerID, ai: number) => void) | null;
  onSelectSkill?: ((slot: number, skill: Skill | null) => void) | null;
  onSelectSkills?:
    | ((player: PlayerID, slot: number, skill: Skill | null) => void)
    | null;
  selectedPlayer?: PlayerID | null;
  skillSlots?: number;
  users: ReadonlyMap<PlayerID, UserLike | undefined>;
  viewerPlayerID?: PlayerID;
}) {
  if (onSelectSkill && onSelectSkills) {
    throw new Error(
      `PlayerSelector: Cannot use both 'onSelectSkill' and 'onSelectSkills' at the same time.`,
    );
  }

  const teams = map.teams
    .filter((team) => team.players.size)
    .map((team) =>
      team.players
        .sortBy(({ id }) => id)
        .filter(({ id }) => id > 0)
        .map((player: Player) => (
          <PlayerItem
            aiRegistry={aiRegistry}
            availableSkills={availableSkills}
            blocklistedSkills={map.config.blocklistedSkills}
            hasSkills={hasSkills}
            isActive={activePlayer === player.id}
            isDisabled={!map.active.includes(player.id)}
            isFocused={selectedPlayer === player.id}
            key={player.id}
            locked={!!locked}
            onClick={onClick ? () => onClick(player.id) : undefined}
            onSelect={onSelect ? () => onSelect(player.id) : undefined}
            onSelectAI={onSelectAI}
            onSelectSkill={onSelectSkill}
            onSelectSkills={onSelectSkills}
            player={player}
            skillSlots={skillSlots}
            user={users.get(player.id)}
            viewerPlayerID={viewerPlayerID}
          />
        ))
        .valueSeq(),
    )
    .filter((players) => players.size && players.size > 0)
    .valueSeq()
    .toArray()
    .flatMap((players, index) => [...players, <Vs key={'vs' + index} />])
    .slice(0, -1);

  const Component = inline ? Stack : Box;
  return (
    <Component
      className={boxStyle}
      gap={16}
      selected={selectedPlayer != null}
      vertical
    >
      <h2>
        {onSelect ? (
          <fbt desc="headline to choose player position">
            Choose your position
          </fbt>
        ) : onSelectSkill ? (
          skillSlots && skillSlots > 1 ? (
            <fbt desc="headline for picking skills">Pick your skills</fbt>
          ) : (
            <fbt desc="headline for picking a skill">Pick a skill</fbt>
          )
        ) : onSelectSkills ? (
          <fbt desc="headline for picking default skills">
            Pick the default skills for each player
          </fbt>
        ) : (
          <fbt desc="headline for players">Players</fbt>
        )}
      </h2>
      <Stack gap={16} vertical>
        {teams}
      </Stack>
      {children}
    </Component>
  );
}

const PlayerSkillSelectors = ({
  availableSkills,
  blocklistedSkills,
  isFocused,
  onSelectSkill,
  onSelectSkills,
  player,
  skillSlots,
}: {
  availableSkills: ReadonlySet<Skill>;
  blocklistedSkills?: ReadonlySet<Skill>;
  isFocused?: boolean;
  onSelectSkill?: ((slot: number, skill: Skill | null) => void) | null;
  onSelectSkills?:
    | ((player: PlayerID, slot: number, skill: Skill | null) => void)
    | null;
  player: Player;
  skillSlots: number;
}) => {
  const [focused, setFocused] = useState(0);

  useHorizontalNavigation(
    useCallback(
      (change) => {
        if (isFocused) {
          setFocused((focused + change) % skillSlots);
          return true;
        }
        return false;
      },
      [focused, skillSlots, isFocused],
    ),
  );

  useInput(
    'navigate',
    useCallback(
      (event) => {
        if (isFocused) {
          const { detail } = event;
          if (detail.x === -1) {
            setFocused((focused - 1) % skillSlots);
          } else if (detail.x === 1) {
            setFocused((focused + 1) % skillSlots);
          }
        }
      },
      [focused, skillSlots, isFocused],
    ),
    'menu',
  );

  return (
    <Stack className={cx(nameStyle, skillStyle)} gap={16} nowrap>
      {Array(skillSlots)
        .fill(0)
        .map((_, id) => {
          const skills = [...player.skills];
          const currentSkill = skills[id];
          const selectedSkills = new Set(skills);
          selectedSkills.delete(currentSkill);

          return (
            <SkillSelector
              availableSkills={availableSkills}
              blocklistedSkills={blocklistedSkills}
              currentSkill={currentSkill}
              isFocused={isFocused && focused === id}
              key={id}
              onSelect={(skill) => {
                onSelectSkills?.(player.id, id, skill);
                onSelectSkill?.(id, skill);
              }}
              selectedSkills={selectedSkills}
              slot={skillSlots > 1 ? id + 1 : undefined}
            />
          );
        })}
    </Stack>
  );
};

const PlayerItem = ({
  aiRegistry,
  availableSkills,
  blocklistedSkills,
  hasSkills,
  isActive,
  isDisabled,
  isFocused,
  locked,
  onClick,
  onSelect,
  onSelectAI,
  onSelectSkill,
  onSelectSkills,
  player,
  skillSlots,
  user,
  viewerPlayerID,
}: {
  aiRegistry?: AIRegistryT | null;
  availableSkills?: ReadonlySet<Skill> | null;
  blocklistedSkills?: ReadonlySet<Skill>;
  hasSkills: boolean;
  isActive?: boolean;
  isDisabled: boolean;
  isFocused?: boolean;
  locked: boolean;
  onClick?: () => void;
  onSelect?: () => void;
  onSelectAI?: ((player: PlayerID, ai: number) => void) | null;
  onSelectSkill?: ((slot: number, skill: Skill | null) => void) | null;
  onSelectSkills?:
    | ((player: PlayerID, slot: number, skill: Skill | null) => void)
    | null;
  player: Player;
  skillSlots?: number;
  user: UserLike | undefined;
  viewerPlayerID?: PlayerID;
}) => {
  if (!player.isPlaceholder()) {
    const bot = !user || isBot(player);
    const isInteractive =
      onSelect || onSelectSkill || onSelectSkills || (onClick && !bot);
    const Component = isInteractive ? InlineLink : 'div';
    const props = isInteractive
      ? {
          hover: isFocused,
          pixelBorderSize: 4,
        }
      : null;
    return (
      <Stack gap nowrap start>
        <Component
          className={itemStyle}
          onClick={!bot ? onClick : undefined}
          {...props}
        >
          <PlayerIcon id={player.id} selected={player.id === viewerPlayerID} />
          <div
            className={cx(nameStyle, isDisabled && disabledStyle)}
            style={isDisabled ? undefined : { color: getColor(player.id) }}
          >
            {user && 'character' in user && user.character && user.username && (
              <div className={playerImageStyle}>
                <MiniPortrait
                  player={player}
                  user={{
                    character: user.character,
                    displayName: user.displayName,
                    username: null,
                  }}
                />
              </div>
            )}
            <span className={InlineLinkColor}>{user?.displayName}</span>
            {bot && <Icon className={botIconStyle} icon={Android} />}
          </div>
        </Component>
        {hasSkills ? (
          (viewerPlayerID === player.id || onSelectSkills) &&
          (onSelectSkill || onSelectSkills) &&
          skillSlots &&
          availableSkills?.size ? (
            <PlayerSkillSelectors
              availableSkills={availableSkills}
              blocklistedSkills={blocklistedSkills}
              isFocused={isFocused}
              onSelectSkill={onSelectSkill}
              onSelectSkills={onSelectSkills}
              player={player}
              skillSlots={skillSlots}
            />
          ) : (
            <div className={cx(nameStyle, skillStyle)}>
              {[...player.skills].map((skill) => (
                <SkillIcon key={skill} skill={skill} />
              ))}
            </div>
          )
        ) : null}
        {aiRegistry && (
          <AISelector
            currentAI={player.ai != null ? player.ai : undefined}
            registry={aiRegistry}
            setAI={(id) => onSelectAI?.(player.id, id)}
          />
        )}
      </Stack>
    );
  }

  return locked && viewerPlayerID !== player.id ? (
    <Stack className={cx(itemStyle, lightStyle)}>
      <PlayerIcon id={player.id} />
      <div className={nameStyle}>
        <fbt desc="Text when waiting for a player to join">
          Waiting for a player…
        </fbt>
      </div>
    </Stack>
  ) : (
    <InlineLink
      active={isActive}
      className={itemStyle}
      hover={isFocused}
      onClick={onSelect}
      pixelBorderSize={isActive ? 0 : 4}
    >
      <PlayerIcon id={player.id} />
      <div className={selfCenterStyle}>
        <PlayerPosition
          color={playerToColor(player.id)}
          hasPlayer={!!viewerPlayerID}
        />
      </div>
    </InlineLink>
  );
};

const boxStyle = css`
  width: 100%;
`;

const itemStyle = css`
  align-self: flex-start;
  cursor: pointer;
  display: flex;
  gap: 8px;
  margin: 0 4px;
  padding: 2px 4px;

  > :first-child {
    margin-right: 8px;
  }
`;

const playerImageStyle = css`
  margin-right: 12px;
`;

const disabledStyle = css`
  opacity: 0.7;
  color: ${applyVar('text-color-inactive')};
`;

const botIconStyle = css`
  margin: 2px 0 0 4px;

  a:hover & {
    color: ${applyVar('text-color-bright')};
  }
`;

const selfCenterStyle = css`
  align-self: center;
`;

const nameStyle = css`
  align-items: center;
  align-self: center;
  display: flex;
  line-height: 1.3em;
`;

const skillStyle = css`
  padding-top: 4px;
`;

const lightStyle = css`
  color: ${applyVar('text-color-inactive')};
`;
