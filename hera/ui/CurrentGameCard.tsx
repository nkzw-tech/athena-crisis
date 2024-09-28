import type Player from '@deities/athena/map/Player.tsx';
import { PlayerID } from '@deities/athena/map/Player.tsx';
import type Team from '@deities/athena/map/Team.tsx';
import type MapData from '@deities/athena/MapData.tsx';
import { VisionT } from '@deities/athena/Vision.tsx';
import isPresent from '@deities/hephaestus/isPresent.tsx';
import sortBy from '@deities/hephaestus/sortBy.tsx';
import useInput from '@deities/ui/controls/useInput.tsx';
import Portal from '@deities/ui/Portal.tsx';
import PrimaryExpandableMenuButton from '@deities/ui/PrimaryExpandableMenuButton.tsx';
import { css, cx } from '@emotion/css';
import ImmutableMap from '@nkzw/immutable-map';
import { memo, ReactElement, useCallback, useState } from 'react';
import useCurrentGameTeams from '../hooks/useCurrentGameTeams.tsx';
import { UserLike, UserLikeWithID } from '../hooks/useUserMap.tsx';
import {
  Animations,
  hasCharacterMessage,
  hasNotableAnimation,
} from '../MapAnimations.tsx';
import { Actions, GameInfoState } from '../Types.tsx';
import maybeFade from './lib/maybeFade.tsx';
import PlayerCard from './PlayerCard.tsx';
import Vs from './Vs.tsx';

type TeamList = ReadonlyArray<
  Readonly<{
    team: Team;
    users: ImmutableMap<number, UserLike>;
  }>
>;

export type GameCardProps = Readonly<{
  actions: Actions;
  currentViewer: PlayerID | null;
  hideIfNoCrystals: boolean;
  invasions: boolean;
  map: MapData;
  spectatorLink: ReactElement | null;
  vision: VisionT;
}>;

type OptionalFields = 'hideIfNoCrystals' | 'invasions' | 'spectatorLink';

const TeamItem = ({
  animate,
  focusPlayer,
  team,
  users,
  wide,
  ...props
}: GameCardProps & {
  animate: boolean;
  focusPlayer?: Player | null;
  team: Team;
  users: ImmutableMap<number, UserLike>;
  wide: boolean;
}) =>
  sortBy([...team.players.values()], ({ id }) => id)
    .map((player: Player) => {
      if (focusPlayer && focusPlayer.id !== player.id) {
        return null;
      }

      const user = users.get(player.id);
      return (
        user && (
          <PlayerCard
            animate={!!(focusPlayer && animate)}
            key={player.id}
            player={player}
            user={user}
            wide={wide && !focusPlayer}
            {...props}
          />
        )
      );
    })
    .filter(isPresent);

const arrangeTeams = (focusPlayer: Player | null, teams: TeamList) => {
  if (focusPlayer) {
    const team = teams.find(({ team }) => team.id === focusPlayer.teamId);
    return team ? [team] : [];
  }
  return teams;
};

const TeamsCard = ({
  animatePlayer,
  focusPlayer,
  teams,
  ...props
}: GameCardProps & {
  animatePlayer: boolean;
  focusPlayer: Player | null;
  teams: TeamList;
}) => {
  const [first, ...remainingTeams] = arrangeTeams(focusPlayer, teams);
  return (
    <>
      {first && (
        <TeamItem
          animate={animatePlayer}
          focusPlayer={focusPlayer}
          team={first.team}
          users={first.users}
          wide
          {...props}
        />
      )}
      {remainingTeams.flatMap(({ team, users }) => [
        <Vs key={'vs' + team.id} />,
        <TeamItem
          animate={animatePlayer}
          key={team.id}
          team={team}
          users={users}
          wide
          {...props}
        />,
      ])}
    </>
  );
};

export default memo(function CurrentGameCard({
  actions,
  animations,
  currentViewer,
  gameInfoState,
  hide,
  hideIfNoCrystals,
  inlineUI,
  inset = 0,
  invasions = false,
  map,
  spectatorLink,
  users,
  vision,
  zIndex,
}: Omit<GameCardProps, OptionalFields> &
  Partial<Pick<GameCardProps, OptionalFields>> & {
    animations: Animations;
    gameInfoState: GameInfoState | null;
    hide?: boolean;
    inlineUI: boolean;
    inset?: number;
    users: Map<string, UserLikeWithID>;
    zIndex: number;
  }) {
  const teams = useCurrentGameTeams(map, users);
  const [isExpanded, setIsExpanded] = useState(false);
  const toggleExpanded = useCallback(
    () => setIsExpanded((isExpanded) => !isExpanded),
    [],
  );
  const players = map.getPlayers();
  const hasSkills = players.some(({ skills }) => skills.size > 0);

  const animatePlayer = hasNotableAnimation(animations);
  const hasMessages = hasCharacterMessage(animations);

  useInput(
    'info',
    useCallback(() => {
      if (!isExpanded) {
        setIsExpanded(true);
      }
    }, [isExpanded]),
  );

  useInput(
    'cancel',
    useCallback(
      async (event) => {
        if (isExpanded && !gameInfoState) {
          event.preventDefault();
          setIsExpanded(false);
        }
      },
      [gameInfoState, isExpanded],
    ),
    'top',
  );

  const content = (
    <div className={cx(maybeFade(hide), hasMessages && diabledStyle)}>
      <PrimaryExpandableMenuButton
        gap={16}
        inset={inlineUI ? 1 : inset}
        isExpanded={isExpanded}
        key={players.length}
        size={hasSkills || invasions ? 'large' : undefined}
        toggleExpanded={toggleExpanded}
      >
        <TeamsCard
          actions={actions}
          animatePlayer={animatePlayer}
          currentViewer={currentViewer}
          focusPlayer={isExpanded ? null : map.getCurrentPlayer()}
          hideIfNoCrystals={!!hideIfNoCrystals}
          invasions={invasions}
          map={map}
          spectatorLink={spectatorLink || null}
          teams={teams}
          vision={vision}
        />
      </PrimaryExpandableMenuButton>
    </div>
  );

  return inlineUI ? (
    <div
      className={inlineContainerStyle}
      style={{ zIndex: isExpanded ? zIndex + 3 : zIndex - 1 }}
    >
      {content}
    </div>
  ) : (
    <Portal>{content}</Portal>
  );
});

const inlineContainerStyle = css`
  inset: 0;
  pointer-events: none;
  position: absolute;
  transform: translate3d(0, -76px, 0);
  zoom: 0.333334;
`;

const diabledStyle = css`
  pointer-events: none;

  * {
    pointer-events: none !important;
  }
`;
