import type { Skill } from '@deities/athena/info/Skill.tsx';
import { Skills } from '@deities/athena/info/Skill.tsx';
import updatePlayer from '@deities/athena/lib/updatePlayer.tsx';
import updatePlayers from '@deities/athena/lib/updatePlayers.tsx';
import { DefaultMapSkillSlots } from '@deities/athena/map/Configuration.tsx';
import type { PlayerID } from '@deities/athena/map/Player.tsx';
import { HumanPlayer } from '@deities/athena/map/Player.tsx';
import AIRegistry from '@deities/dionysus/AIRegistry.tsx';
import isPresent from '@deities/hephaestus/isPresent.tsx';
import sortBy from '@deities/hephaestus/sortBy.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { useCallback, useMemo } from 'react';
import getTranslatedFactionName from '../../lib/getTranslatedFactionName.tsx';
import type { State } from '../../Types.tsx';
import PlayerSelector from '../../ui/PlayerSelector.tsx';
import TeamSelector from '../../ui/TeamSelector.tsx';
import type { SetMapFunction } from '../Types.tsx';

const aiRegistry =
  process.env.NODE_ENV === 'development'
    ? AIRegistry
    : new Map([...AIRegistry].filter(([, { published }]) => published));

export default function MapEditorSetupPanel({
  setMap,
  state,
}: {
  setMap: SetMapFunction;
  state: State;
}) {
  const { map } = state;

  const mapWithPlayers = useMemo(
    () =>
      map.copy({
        teams: updatePlayers(
          map.teams,
          map
            .getPlayers()
            .map((player) => HumanPlayer.from(player, String(-player.id))),
        ),
      }),
    [map],
  );
  const placeholderUsers = useMemo(
    () =>
      new Map(
        mapWithPlayers
          .getPlayers()
          .map(({ id }) => [
            id,
            { displayName: getTranslatedFactionName(new Map(), id) },
          ]),
      ),
    [mapWithPlayers],
  );

  const onSelectAI = useCallback(
    (playerID: PlayerID, ai: number) => {
      const player = map.getPlayer(playerID);
      setMap(
        'teams',
        map.copy({
          teams: updatePlayer(map.teams, player.copy({ ai })),
        }),
      );
    },
    [map, setMap],
  );

  const onSelectSkills = useCallback(
    (playerID: PlayerID, slot: number, skill: Skill | null) => {
      const player = map.getPlayer(playerID);
      const skills = [...player.skills];
      if (skill) {
        skills[slot] = skill;
      } else {
        delete skills[slot];
      }
      setMap(
        'teams',
        map.copy({
          teams: updatePlayer(
            map.teams,
            player.copy({ skills: new Set(skills.filter(isPresent)) }),
          ),
        }),
      );
    },
    [map, setMap],
  );

  return (
    <Stack gap={24} vertical verticalPadding>
      <TeamSelector
        key={sortBy([...map.teams.keySeq()], (id) => id).join('-')}
        map={map.copy({
          teams: map.teams.filter(({ id }) => id),
        })}
        onTeamChange={(teams) => setMap('teams', map.copy({ teams }))}
        placeholders
      />
      <PlayerSelector
        aiRegistry={aiRegistry.size > 1 ? aiRegistry : null}
        availableSkills={Skills}
        hasSkills
        map={mapWithPlayers}
        onSelect={null}
        onSelectAI={onSelectAI}
        onSelectSkills={onSelectSkills}
        skillSlots={DefaultMapSkillSlots}
        users={placeholderUsers}
      >
        <p>
          <fbt desc="Skill explanation">
            Bots can use any skills, but players can only use predefined skills
            if they&apos;ve unlocked them already.
          </fbt>
        </p>
      </PlayerSelector>
    </Stack>
  );
}
