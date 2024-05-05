import updatePlayer from '@deities/athena/lib/updatePlayer.tsx';
import { PlayerID, toPlayerID } from '@deities/athena/map/Player.tsx';
import Team, { Teams } from '@deities/athena/map/Team.tsx';
import MapData from '@deities/athena/MapData.tsx';
import parseInteger from '@deities/hephaestus/parseInteger.tsx';
import sortBy from '@deities/hephaestus/sortBy.tsx';
import AudioPlayer from '@deities/ui/AudioPlayer.tsx';
import Box from '@deities/ui/Box.tsx';
import Breakpoints from '@deities/ui/Breakpoints.tsx';
import useHorizontalMenuNavigation from '@deities/ui/controls/useHorizontalMenuNavigation.tsx';
import useHorizontalNavigation from '@deities/ui/controls/useHorizontalNavigation.tsx';
import useInput from '@deities/ui/controls/useInput.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import gradient from '@deities/ui/gradient.tsx';
import useScrollIntoView from '@deities/ui/hooks/useScrollIntoView.tsx';
import pixelBorder from '@deities/ui/pixelBorder.tsx';
import { SquarePulseStyle } from '@deities/ui/RainbowPulseStyle.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { css, cx } from '@emotion/css';
import ImmutableMap from '@nkzw/immutable-map';
import { motion } from 'framer-motion';
import {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import PlayerIcon from './PlayerIcon.tsx';

export default function TeamSelector({
  isFocused,
  map,
  onTeamChange,
  placeholders,
}: {
  isFocused?: boolean;
  map: MapData;
  onTeamChange?: (teams: Teams) => void;
  placeholders?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hasChanged, setHasChanged] = useState(false);
  const [currentTeam, setCurrentTeam] = useState<PlayerID | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<PlayerID | null>(null);
  const [showGhost, setShowGhost] = useState(false);
  const [previousPlayer, setPreviousPlayer] = useState<PlayerID | null>(null);
  const [originalMap] = useState(map);
  const isTeamPlayMap =
    originalMap && originalMap.getPlayers().length !== originalMap.teams.size;

  const teams = useMemo(
    () =>
      onTeamChange && map.getPlayers().length !== map.teams.size
        ? map.teams.merge(
            ImmutableMap(
              map
                .getPlayers()
                .filter(({ id }) => !map.teams.get(id))
                .map(({ id }) => [id, new Team(id, '', ImmutableMap())]),
            ),
          )
        : map.teams,
    [map, onTeamChange],
  );

  const sortedTeams = useMemo(
    () => [...teams.sortBy(({ id }) => id).values()],
    [teams],
  );
  const players: ReadonlyArray<PlayerID> = useMemo(
    () =>
      sortedTeams.flatMap(({ players }) =>
        [...players.values()].map(({ id }) => id),
      ),

    [sortedTeams],
  );

  const [selected] = useHorizontalMenuNavigation(
    isFocused && !currentPlayer ? players.length : 0,
    'dialog',
    true,
    previousPlayer ? players.indexOf(previousPlayer) : -1,
  );

  const { height, width } = useWindowSize();

  useScrollIntoView(ref, isFocused);

  const onDrop = onTeamChange
    ? (id: PlayerID) => {
        setCurrentPlayer(null);
        setPreviousPlayer(id);

        const player = map.getPlayer(id);
        if (currentTeam !== null && currentTeam !== player.teamId) {
          const newTeams = updatePlayer(
            teams.map((team) =>
              team.copy({ players: team.players.delete(player.id) }),
            ),
            player.copy({ teamId: currentTeam }),
          );
          const newTeam = newTeams.get(currentTeam)!;

          const sortedTeams = newTeams.set(
            newTeam.id,
            newTeam.copy({
              players: newTeam.players.sortBy(({ id }) => id),
            }),
          );

          setHasChanged(
            !sortedTeams.every(({ players }) =>
              players.every(
                ({ id, teamId }) => originalMap.getPlayer(id).teamId === teamId,
              ),
            ),
          );

          onTeamChange(sortedTeams);
        }
      }
    : null;

  return map.active.length > 2 || placeholders ? (
    <Box gap={16} ref={ref} selected={isFocused} vertical>
      <h2>
        {onTeamChange ? (
          <fbt desc="Headline for defining the team setup">Team Setup</fbt>
        ) : (
          <fbt desc="Headline for teams">Teams</fbt>
        )}
      </h2>
      <div className={containerStyle}>
        {sortedTeams.map((team, teamIndex) => {
          const ghostID =
            showGhost &&
            currentTeam === team.id &&
            currentPlayer &&
            !team.players.has(currentPlayer)
              ? currentPlayer
              : null;

          const teamPlayers = sortBy(
            [
              ...team.players.map(({ id }) => id).values(),
              ...(ghostID ? [ghostID] : []),
            ],
            (id) => id,
          );

          return (
            <Stack
              className={teamStyle}
              data-drop-target={team.id}
              gap={16}
              key={team.id}
              style={{
                background: gradient(
                  [
                    ...new Set([
                      ...team.players.map(({ id }) => id).valueSeq(),
                      ...(currentPlayer && currentTeam === team.id
                        ? [currentPlayer]
                        : []),
                    ]),
                  ],
                  0.5,
                ),
                zIndex:
                  currentPlayer && team.players.has(currentPlayer) ? 2 : 1,
              }}
              vertical
            >
              <div style={{ alignSelf: 'center' }}>
                <fbt desc="Team label">
                  Team <fbt:param name="team id">{team.id}</fbt:param>
                </fbt>
              </div>
              <Stack center gap={16}>
                {teamPlayers.map((id) => {
                  const currentTeamIndex = currentTeam
                    ? sortedTeams.findIndex(({ id }) => id === currentTeam)
                    : teamIndex;

                  return ghostID === id ? (
                    <PlayerIcon className={ghostStyle} id={ghostID} />
                  ) : onDrop ? (
                    <PlayerIconWithDrag
                      container={ref}
                      id={id}
                      // Wipe away this element when the screen size changes because
                      // framer fails to reposition them.
                      key={`${id}-${height}-${width}`}
                      navigate={[
                        sortedTeams[currentTeamIndex - 1],
                        sortedTeams[currentTeamIndex + 1],
                      ]}
                      onDrag={(id, ghost) => {
                        setCurrentPlayer(id);
                        setPreviousPlayer(null);
                        setShowGhost(ghost);
                      }}
                      onDrop={onDrop}
                      onEnter={(id) => setCurrentTeam(id)}
                      onLeave={() => setCurrentTeam(null)}
                      selected={isFocused && players[selected] === id}
                    />
                  ) : (
                    <PlayerIcon id={id} key={id} />
                  );
                })}
              </Stack>
            </Stack>
          );
        })}
      </div>
      {isTeamPlayMap && hasChanged ? (
        <p className={lightStyle}>
          <fbt desc="Explanation for imbalanced team selection">
            This map was designed with teamplay in mind. Changing the team setup
            might imbalance the game and make it unenjoyable for some players.
          </fbt>
        </p>
      ) : null}
    </Box>
  ) : null;
}

const PlayerIconWithDrag = ({
  container,
  id,
  navigate: [left, right],
  onDrag,
  onDrop,
  onEnter,
  onLeave,
  selected,
}: {
  container: RefObject<Element>;
  id: PlayerID;
  navigate: [Team | undefined, Team | undefined];
  onDrag: (id: PlayerID | null, ghost: boolean) => void;
  onDrop: (id: PlayerID) => void;
  onEnter: (id: PlayerID) => void;
  onLeave: () => void;
  selected?: boolean;
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isSelected, setIsSelected] = useState(false);

  const cancel = useCallback(
    (event?: Event) => {
      if (isDragging) {
        if (event) {
          event.preventDefault();
          AudioPlayer.playSound('UI/Cancel');
        }

        setIsDragging(false);
        setIsSelected(false);
        onDrag(null, false);
        onLeave();
      }
    },
    [isDragging, onDrag, onLeave],
  );

  useInput(
    'accept',
    useCallback(() => {
      if (selected || isSelected) {
        setIsDragging(!isDragging);
        setIsSelected(!isDragging);
        if (isDragging) {
          AudioPlayer.playSound('UI/Cancel');
          onDrop(id);
        } else {
          AudioPlayer.playSound('UI/Accept');
          onDrag(id, true);
          onLeave();
        }
      }
    }, [id, isDragging, isSelected, onDrag, onDrop, onLeave, selected]),
    'dialog',
  );

  useInput('cancel', cancel, 'dialog');
  useInput(
    'navigate',
    useCallback(
      ({ detail }) => {
        if (detail.y) {
          cancel();
        }
      },
      [cancel],
    ),
    'dialog',
  );

  useHorizontalNavigation(
    useCallback(
      (change) => {
        const teamId = (change === -1 ? left : right)?.id;
        if ((selected || isSelected) && isDragging && teamId) {
          onEnter(teamId);
          return true;
        }
        return false;
      },
      [isDragging, isSelected, left, onEnter, right, selected],
    ),
    'dialog',
  );

  const applySelectedStyle = selected || isSelected;

  return (
    <motion.div
      className={cx(
        dragHandleStyle,
        !applySelectedStyle && isDragging && dragStyle,
        applySelectedStyle && selectedStyle,
        applySelectedStyle && isDragging && SquarePulseStyle,
      )}
      drag
      dragConstraints={container}
      dragSnapToOrigin
      onDragEnd={() => {
        setIsDragging(false);
        setIsSelected(false);
        onDrop(id);
      }}
      onDragStart={() => {
        setIsDragging(true);
        setIsSelected(false);
        onDrag(id, false);
      }}
      onPointerMove={(event) => {
        if (isDragging) {
          const element = [
            ...document.elementsFromPoint(event.clientX, event.clientY),
          ].find((element) => element.hasAttribute('data-drop-target'));
          if (element) {
            const maybePlayerID = parseInteger(
              element.getAttribute('data-drop-target') || '',
            );
            if (maybePlayerID) {
              onEnter(toPlayerID(maybePlayerID));
            }
          } else {
            onLeave();
          }
        }
      }}
      whileDrag={{
        scale: 1.2,
      }}
    >
      <PlayerIcon
        button
        cursorStyle={isDragging ? 'grabbing' : 'grab'}
        id={id}
        selected={selected || isSelected}
      />
    </motion.div>
  );
};

const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState<
    Readonly<{ height?: number; width?: number }>
  >({
    height: undefined,
    width: undefined,
  });
  useEffect(() => {
    const handleResize = () =>
      setWindowSize({
        height: window.innerHeight,
        width: window.innerWidth,
      });
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return windowSize;
};

const containerStyle = css`
  display: grid;
  gap: 24px;
  grid-auto-rows: min-content;
  grid-template-columns: repeat(2, 1fr);

  ${Breakpoints.lg} {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const teamStyle = css`
  ${pixelBorder(applyVar('background-color-active'))}

  background-color: ${applyVar('background-color-light')};
  white-space: nowrap;
  padding: 8px;
  min-width: 160px;
  min-height: 90px;
`;

const dragHandleStyle = css`
  touch-action: none;
  z-index: 3;
`;

const dragStyle = css`
  filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.3));
`;

const selectedStyle = css`
  transition: transform 150ms ease;
`;

const lightStyle = css`
  color: ${applyVar('text-color-light')};
`;

const ghostStyle = css`
  opacity: 0.5;
`;
