import type Player from '@deities/athena/map/Player.tsx';
import { PlayerID } from '@deities/athena/map/Player.tsx';
import type Team from '@deities/athena/map/Team.tsx';
import type MapData from '@deities/athena/MapData.tsx';
import { VisionT } from '@deities/athena/Vision.tsx';
import isPresent from '@deities/hephaestus/isPresent.tsx';
import sortBy from '@deities/hephaestus/sortBy.tsx';
import Portal from '@deities/ui/Portal.tsx';
import PrimaryExpandableMenuButton from '@deities/ui/PrimaryExpandableMenuButton.tsx';
import { css } from '@emotion/css';
import ImmutableMap from '@nkzw/immutable-map';
import React, { memo, useCallback, useState } from 'react';
import useCurrentGameTeams from '../hooks/useCurrentGameTeams.tsx';
import { UserLike, UserLikeWithID } from '../hooks/useUserMap.tsx';
import { Actions } from '../Types.tsx';
import maybeFade from './lib/maybeFade.tsx';
import PlayerCard from './PlayerCard.tsx';
import Vs from './Vs.tsx';

type TeamList = ReadonlyArray<
  Readonly<{
    team: Team;
    users: ImmutableMap<number, UserLike>;
  }>
>;

const TeamItem = ({
  actions,
  animate,
  currentViewer,
  focusPlayer,
  map,
  team,
  users,
  vision,
  wide,
}: {
  actions: Actions;
  animate: boolean;
  currentViewer: PlayerID | null;
  focusPlayer?: Player | null;
  map: MapData;
  team: Team;
  users: ImmutableMap<number, UserLike>;
  vision: VisionT;
  wide: boolean;
}) => (
  <>
    {sortBy([...team.players.values()], ({ id }) => id)
      .map((player: Player) => {
        if (focusPlayer && focusPlayer.id !== player.id) {
          return null;
        }

        const user = users.get(player.id);
        return (
          user && (
            <PlayerCard
              actions={actions}
              animate={!!(focusPlayer && animate)}
              currentViewer={currentViewer}
              key={player.id}
              map={map}
              player={player}
              user={user}
              vision={vision}
              wide={wide && !focusPlayer}
            />
          )
        );
      })
      .filter(isPresent)}
  </>
);

const arrangeTeams = (focusPlayer: Player | null, teams: TeamList) => {
  if (focusPlayer) {
    const team = teams.find(({ team }) => team.id === focusPlayer.teamId);
    return team ? [team] : [];
  }
  return teams;
};

const TeamsCard = ({
  actions,
  animatePlayer,
  currentViewer,
  focusPlayer,
  map,
  teams,
  vision,
}: {
  actions: Actions;
  animatePlayer: boolean;
  currentViewer: PlayerID | null;
  focusPlayer: Player | null;
  map: MapData;
  teams: TeamList;
  vision: VisionT;
}) => {
  const [first, ...remainingTeams] = arrangeTeams(focusPlayer, teams);
  return (
    <>
      {first && (
        <TeamItem
          actions={actions}
          animate={animatePlayer}
          currentViewer={currentViewer}
          focusPlayer={focusPlayer}
          map={map}
          team={first.team}
          users={first.users}
          vision={vision}
          wide
        />
      )}
      {remainingTeams.flatMap(({ team, users }) => [
        <Vs key={'vs' + team.id} />,
        <TeamItem
          actions={actions}
          animate={animatePlayer}
          currentViewer={currentViewer}
          key={team.id}
          map={map}
          team={team}
          users={users}
          vision={vision}
          wide
        />,
      ])}
    </>
  );
};

export default memo(function CurrentGameCard({
  actions,
  animatePlayer,
  currentViewer,
  hide,
  inlineUI,
  inset = 0,
  map,
  users,
  vision,
  zIndex,
}: {
  actions: Actions;
  animatePlayer: boolean;
  currentViewer: PlayerID | null;
  hide?: boolean;
  inlineUI: boolean;
  inset?: number;
  map: MapData;
  users: Map<string, UserLikeWithID>;
  vision: VisionT;
  zIndex: number;
}) {
  const teams = useCurrentGameTeams(map, users);
  const [isExpanded, setIsExpanded] = useState(false);
  const toggleExpanded = useCallback(
    () => setIsExpanded((isExpanded) => !isExpanded),
    [],
  );

  const content = (
    <div className={maybeFade(hide)}>
      <PrimaryExpandableMenuButton
        gap={16}
        inset={inlineUI ? 1 : inset}
        isExpanded={isExpanded}
        key={map.getPlayers().length}
        toggleExpanded={toggleExpanded}
      >
        <TeamsCard
          actions={actions}
          animatePlayer={animatePlayer}
          currentViewer={currentViewer}
          focusPlayer={isExpanded ? null : map.getCurrentPlayer()}
          map={map}
          teams={teams}
          vision={vision}
        />
      </PrimaryExpandableMenuButton>
    </div>
  );
  return inlineUI ? (
    <div className={inlineContainerStyle} style={{ zIndex: zIndex - 1 }}>
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
