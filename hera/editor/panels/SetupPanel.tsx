import { Skill, Skills } from '@deities/athena/info/Skill.tsx';
import reorderActive from '@deities/athena/lib/reorderActive.tsx';
import updatePlayer from '@deities/athena/lib/updatePlayer.tsx';
import updatePlayers from '@deities/athena/lib/updatePlayers.tsx';
import { DefaultMapSkillSlots } from '@deities/athena/map/Configuration.tsx';
import { HumanPlayer, PlayerID } from '@deities/athena/map/Player.tsx';
import AIRegistry from '@deities/dionysus/AIRegistry.tsx';
import Box from '@deities/ui/Box.tsx';
import InfoBox from '@deities/ui/InfoBox.tsx';
import Stack from '@deities/ui/Stack.tsx';
import isPresent from '@nkzw/core/isPresent.js';
import sortBy from '@nkzw/core/sortBy.js';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useMemo } from 'react';
import getTranslatedFactionName from '../../lib/getTranslatedFactionName.tsx';
import { State } from '../../Types.tsx';
import PlayerIcon from '../../ui/PlayerIcon.tsx';
import PlayerSelector from '../../ui/PlayerSelector.tsx';
import TeamSelector from '../../ui/TeamSelector.tsx';
import changePlayer from '../lib/changePlayer.tsx';
import { SetMapFunction } from '../Types.tsx';

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
      <Box gap={16} vertical>
        <h2>
          <fbt desc="Pick the main campaign faction">Primary Faction</fbt>
        </h2>
        <Stack center gap={24}>
          <AnimatePresence mode="popLayout">
            {map.active.map((id) => (
              <motion.div key={id} layoutId={`${id}`}>
                <PlayerIcon
                  id={id}
                  key={id}
                  onClick={() => {
                    setMap(
                      'teams',
                      changePlayer(
                        map.copy({
                          active: reorderActive(map.active, id),
                        }),
                        id,
                      ).map,
                    );
                  }}
                  selected={map.active[0] === id}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </Stack>
        <InfoBox>
          <p>
            <fbt desc="Explanation for the main faction">
              In a campaign, the first faction will be controlled by the player.
            </fbt>
          </p>
        </InfoBox>
      </Box>
      <PlayerSelector
        aiRegistry={aiRegistry.size > 1 ? aiRegistry : null}
        availableSkills={Skills}
        hasSkills
        map={mapWithPlayers}
        onSelect={null}
        onSelectAI={onSelectAI}
        onSelectSkills={onSelectSkills}
        skillSlots={DefaultMapSkillSlots.length}
        users={placeholderUsers}
      >
        <InfoBox>
          <p>
            <fbt desc="Skill explanation">
              Bots can use any skills, but players can only use predefined
              skills if they&apos;ve unlocked them already.
            </fbt>
          </p>
        </InfoBox>
      </PlayerSelector>
    </Stack>
  );
}
