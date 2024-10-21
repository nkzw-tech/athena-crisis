import {
  mapBuildings,
  mapBuildingsWithContentRestriction,
} from '@deities/athena/info/Building.tsx';
import { Skill, Skills } from '@deities/athena/info/Skill.tsx';
import { getTileInfo, Plain } from '@deities/athena/info/Tile.tsx';
import {
  mapUnits,
  mapUnitsWithContentRestriction,
} from '@deities/athena/info/Unit.tsx';
import getBiomeBuildingRestrictions from '@deities/athena/lib/getBiomeBuildingRestrictions.tsx';
import getBiomeUnitRestrictions from '@deities/athena/lib/getBiomeUnitRestrictions.tsx';
import Building from '@deities/athena/map/Building.tsx';
import { AnimationConfig } from '@deities/athena/map/Configuration.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import { ID } from '@deities/athena/MapData.tsx';
import Box from '@deities/ui/Box.tsx';
import InlineLink from '@deities/ui/InlineLink.tsx';
import Portal from '@deities/ui/Portal.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { useCallback, useMemo, useState } from 'react';
import InlineTileList from '../../card/InlineTileList.tsx';
import { UserWithUnlocks } from '../../hooks/useUserMap.tsx';
import getAnyBuildingTileField from '../../lib/getAnyBuildingTileField.tsx';
import getAnyUnitTile from '../../lib/getAnyUnitTile.tsx';
import Tick from '../../Tick.tsx';
import { StateWithActions } from '../../Types.tsx';
import SkillDialog from '../../ui/SkillDialog.tsx';
import { EditorState } from '../Types.tsx';

const mutate = (list: ReadonlySet<ID>, id: ID) => {
  const newList = new Set(list);
  newList[newList.has(id) ? 'delete' : 'add'](id);
  return newList;
};

export default function RestrictionsPanel({
  actions: { update },
  editor,
  hasContentRestrictions,
  setEditorState,
  state,
  user,
}: StateWithActions & {
  hasContentRestrictions: boolean;
  setEditorState: (setEditorState: Partial<EditorState>) => void;
  user: UserWithUnlocks;
}) {
  const currentPlayer = 1;
  const { config } = state.map;
  const { biome, blocklistedBuildings, blocklistedSkills, blocklistedUnits } =
    config;

  const biomeBuildingRestrictions = getBiomeBuildingRestrictions(biome);
  const biomeUnitRestrictions = getBiomeUnitRestrictions(biome);

  const skills = useMemo(() => new Set(user.skills), [user.skills]);
  const buildings = useMemo(
    () =>
      (hasContentRestrictions
        ? mapBuildingsWithContentRestriction
        : mapBuildings)((building) => building, skills)
        .filter((building) => !building.isStructure() && !building.isHQ())
        .map((info) => {
          const building = info.create(currentPlayer);
          return blocklistedBuildings.has(info.id)
            ? building.complete()
            : building;
        })
        .filter((building) => !biomeBuildingRestrictions?.has(building.info)),
    [
      biomeBuildingRestrictions,
      blocklistedBuildings,
      hasContentRestrictions,
      skills,
    ],
  );

  const units = useMemo(
    () =>
      (hasContentRestrictions ? mapUnitsWithContentRestriction : mapUnits)(
        (info) => {
          const unit = info.create(currentPlayer);
          return blocklistedUnits.has(info.id) ? unit.complete() : unit;
        },
        skills,
      ).filter((unit) => !biomeUnitRestrictions?.has(unit.info.type)),
    [biomeUnitRestrictions, blocklistedUnits, hasContentRestrictions, skills],
  );

  const selectBuilding = useCallback(
    (event: unknown, { building }: { building?: Building }) => {
      if (building) {
        update({
          map: state.map.copy({
            config: state.map.config.copy({
              blocklistedBuildings: mutate(blocklistedBuildings, building.id),
            }),
          }),
        });
        if (editor?.selected?.building?.id === building.id) {
          setEditorState({
            selected: {
              building: undefined,
            },
          });
        }
      }
    },
    [
      blocklistedBuildings,
      editor?.selected?.building?.id,
      setEditorState,
      state.map,
      update,
    ],
  );

  const selectUnit = useCallback(
    (event: unknown, { unit }: { unit?: Unit }) => {
      if (unit) {
        update({
          map: state.map.copy({
            config: state.map.config.copy({
              blocklistedUnits: mutate(blocklistedUnits, unit.id),
            }),
          }),
        });
        if (editor?.selected?.unit?.id === unit.id) {
          setEditorState({
            selected: {
              unit: undefined,
            },
          });
        }
      }
    },
    [
      update,
      state.map,
      blocklistedUnits,
      editor?.selected?.unit?.id,
      setEditorState,
    ],
  );

  const [showSkillSelector, setShowSkillSelector] = useState(false);

  const onClose = useCallback(() => {
    if (showSkillSelector) {
      setShowSkillSelector(false);
    }
  }, [showSkillSelector]);

  const onSelectSkill = useCallback(
    (skill: Skill | null) => {
      if (skill) {
        update({
          map: state.map.copy({
            config: config.copy({
              blocklistedSkills: mutate(blocklistedSkills, skill),
            }),
          }),
        });
      }
    },
    [blocklistedSkills, config, state.map, update],
  );

  return (
    <>
      <Stack alignNormal gap={24} start vertical verticalPadding>
        <Box>
          <fbt desc="Description for restricting buildings and units on maps">
            Select the entities that cannot be created by any player during
            play.
          </fbt>
        </Box>
        <Tick animationConfig={AnimationConfig}>
          <Stack gap={24} vertical>
            {buildings.length ? (
              <Box alignNormal>
                <InlineTileList
                  biome={biome}
                  buildings={buildings}
                  onSelect={selectBuilding}
                  size="tall"
                  tiles={buildings.map((building) =>
                    getTileInfo(getAnyBuildingTileField(building.info)),
                  )}
                />
              </Box>
            ) : null}
            {units.length ? (
              <Box alignNormal>
                <InlineTileList
                  biome={biome}
                  onSelect={selectUnit}
                  tiles={units.map(
                    (unit) => getAnyUnitTile(unit.info) || Plain,
                  )}
                  units={units}
                />
              </Box>
            ) : null}
          </Stack>
        </Tick>
        <Box gap={24} vertical>
          <h2>
            <fbt desc="Headline for skill restrictions">Skill Restrictions</fbt>
          </h2>
          <InlineLink onClick={() => setShowSkillSelector(true)}>
            <fbt desc="Link to restrict skills">Restrict Skills</fbt>
          </InlineLink>
        </Box>
      </Stack>
      {showSkillSelector && (
        <Portal>
          <SkillDialog
            availableSkills={Skills}
            blocklistedSkills={blocklistedSkills}
            onClose={onClose}
            onSelect={onSelectSkill}
            toggleBlocklist
          />
        </Portal>
      )}
    </>
  );
}
