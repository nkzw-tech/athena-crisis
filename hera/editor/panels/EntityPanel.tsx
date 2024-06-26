import { Behavior, MaxSkills } from '@deities/athena/info/Building.tsx';
import { getSkillConfig, Skill, Skills } from '@deities/athena/info/Skill.tsx';
import { Plain } from '@deities/athena/info/Tile.tsx';
import { generateUnitName } from '@deities/athena/info/UnitNames.tsx';
import hasLeader from '@deities/athena/lib/hasLeader.tsx';
import removeLeader from '@deities/athena/lib/removeLeader.tsx';
import { AIBehaviors } from '@deities/athena/map/AIBehavior.tsx';
import {
  AnimationConfig,
  MaxHealth,
  TileSize,
} from '@deities/athena/map/Configuration.tsx';
import Entity, { isBuilding, isUnit } from '@deities/athena/map/Entity.tsx';
import { PlayerID, PlayerIDs } from '@deities/athena/map/Player.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import isPresent from '@deities/hephaestus/isPresent.tsx';
import parseInteger from '@deities/hephaestus/parseInteger.tsx';
import Box from '@deities/ui/Box.tsx';
import isControlElement from '@deities/ui/controls/isControlElement.tsx';
import useAlert from '@deities/ui/hooks/useAlert.tsx';
import Icon from '@deities/ui/Icon.tsx';
import Ammo from '@deities/ui/icons/Ammo.tsx';
import Magic from '@deities/ui/icons/Magic.tsx';
import Rescue from '@deities/ui/icons/Rescue.tsx';
import Supply from '@deities/ui/icons/Supply.tsx';
import Slider from '@deities/ui/Slider.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { css } from '@emotion/css';
import Heart from '@iconify-icons/pixelarticons/heart.js';
import { fbt } from 'fbt';
import { Fragment, useCallback, useEffect, useState } from 'react';
import AttributeGrid from '../../card/AttributeGrid.tsx';
import { useSprites } from '../../hooks/useSprites.tsx';
import { StateWithActions } from '../../Types.tsx';
import PlayerIcon from '../../ui/PlayerIcon.tsx';
import { SkillSelector } from '../../ui/SkillDialog.tsx';
import UnitTile from '../../Unit.tsx';
import AIBehaviorLink from '../lib/AIBehaviorLink.tsx';
import changePlayer from '../lib/changePlayer.tsx';
import updateUndoStack from '../lib/updateUndoStack.tsx';
import LabelSelector from '../selectors/LabelSelector.tsx';
import { EntityUndoKey } from '../Types.tsx';

const SkillsWithoutCosts = new Set(
  [...Skills].filter((skill) => getSkillConfig(skill).cost != null),
);

export default function EntityPanel({
  actions,
  editor,
  state,
}: StateWithActions) {
  const { update } = actions;
  const {
    map: {
      config: { biome },
    },
    selectedBuilding,
    selectedPosition,
    selectedUnit,
  } = state;
  const currentState = state;
  const entity = selectedUnit || selectedBuilding;
  const entityIsBuilding = entity && isBuilding(entity);
  const isStructure = entityIsBuilding && entity.info.isStructure();

  const hasSprites = useSprites('all');
  const updateEntity = useCallback(
    async (undoKey: EntityUndoKey, entity: Entity, state = currentState) => {
      if (!selectedPosition || !editor) {
        return;
      }

      const entityIsUnit = isUnit(entity);
      const newState = entityIsUnit
        ? {
            map: state.map.copy({
              units: state.map.units.set(selectedPosition, entity),
            }),
            selectedUnit: entity,
          }
        : isBuilding(entity)
          ? {
              map: state.map.copy({
                buildings: state.map.buildings.set(selectedPosition, entity),
              }),
              selectedBuilding: entity,
            }
          : null;

      if (newState) {
        updateUndoStack(actions, editor, [
          `entity-${
            entityIsUnit ? 'unit' : 'building'
          }-${undoKey}-${selectedPosition}-${entity.id}`,
          newState.map,
        ]);

        return update(newState);
      }
    },
    [actions, currentState, editor, selectedPosition, update],
  );

  const updatePlayer = useCallback(
    async (entity: Entity, player: PlayerID | null) => {
      if (editor && player != null) {
        const { map } = state;
        if (
          isBuilding(entity) &&
          entity.info.isHQ() &&
          (map.buildings.some(
            (building) =>
              building.info.isHQ() && map.matchesPlayer(building, player),
          ) ||
            player === 0)
        ) {
          return;
        }

        updateEntity(
          `player-${player}`,
          isUnit(entity)
            ? entity.setPlayer(player).removeLeader()
            : entity.setPlayer(player),
          await update(changePlayer(state.map, player)),
        );
      }
    },
    [editor, state, update, updateEntity],
  );

  const updateRescue = useCallback(
    async (unit: Unit, player: PlayerID | null) => {
      if (player != null) {
        updateEntity(
          `player-${player}`,
          unit.isBeingRescuedBy(player)
            ? unit.stopBeingRescued()
            : unit.rescue(player),
        );
      }
    },
    [updateEntity],
  );

  const { alert } = useAlert();
  const toggleLeader = useCallback(() => {
    if (editor && entity && isUnit(entity)) {
      const isLeader = entity.isLeader();
      const update = () => {
        const { map } = state;
        updateEntity(
          'leader',
          entity.withName(isLeader ? null : generateUnitName(true)),
          isLeader
            ? state
            : {
                ...state,
                map: removeLeader(map, entity.player, entity.info),
              },
        );
      };

      if (!isLeader && hasLeader(state.map, entity.player, entity.info)) {
        (document.activeElement as HTMLElement)?.blur?.();
        alert({
          onAccept: update,
          text: fbt(
            'Another unit of this type for this faction is already marked as the leader. Are you sure you want to make this unit the leader unit for this faction?',
            'Explanation for overwriting the leader unit',
          ),
        });
      } else {
        update();
      }
    }
  }, [alert, editor, entity, state, updateEntity]);

  useEffect(() => {
    if (!entity || !selectedPosition || !editor) {
      return;
    }

    const listener = (event: KeyboardEvent) => {
      if (isControlElement() || isStructure) {
        return;
      }

      const key =
        event.code === 'Backquote'
          ? 0
          : (parseInteger(event.key) as PlayerID | null);
      if (key != null) {
        updatePlayer(entity, PlayerIDs.includes(key) ? key : null);
      }
    };
    document.body.addEventListener('keydown', listener);
    return () => document.body.removeEventListener('keydown', listener);
  }, [editor, entity, isStructure, selectedPosition, updatePlayer]);

  const [skills, setSkills] = useState<ReadonlyArray<Skill | null>>(() =>
    entityIsBuilding ? [...(entity.skills || [])] : [],
  );

  if (
    !selectedPosition ||
    !entity ||
    !editor ||
    (selectedBuilding && selectedUnit)
  ) {
    return (
      <Stack gap={24} verticalPadding>
        <Box>
          <fbt desc="Message to request user to select an entity on the map">
            Select a building or unit on the map to edit their properties.
          </fbt>
        </Box>
      </Stack>
    );
  }

  return (
    <Stack alignNormal key={String(selectedPosition)}>
      <Stack gap={24} start verticalPadding>
        <Box flex1 gap={16} vertical>
          <Stack gap start>
            <div className={pixelatedStyle}>
              {hasSprites && isUnit(entity) && (
                <UnitTile
                  animationConfig={AnimationConfig}
                  biome={biome}
                  firstPlayerID={1}
                  size={TileSize}
                  tile={Plain}
                  unit={entity}
                />
              )}
            </div>
            <h2>{entity.info.name}</h2>
          </Stack>
          <AttributeGrid rowGap={16}>
            <Stack alignCenter start>
              <Icon icon={Heart} />
              <fbt desc="Label for unit health">Health</fbt>
            </Stack>
            <Slider
              max={String(MaxHealth)}
              min="1"
              onChange={(event) => {
                const health = parseInteger(event.target.value);
                if (health != null) {
                  updateEntity('health', entity.setHealth(health));
                }
              }}
              type="range"
              value={entity.health}
            />
            <div className={textStyle}>
              {entity.health}/{MaxHealth}
            </div>
            {isUnit(entity) && (
              <>
                <Stack alignCenter start>
                  <Icon icon={Supply} />
                  <fbt desc="Label for supplies">Supplies</fbt>
                </Stack>
                <Slider
                  max={String(entity.info.configuration.fuel)}
                  min="0"
                  onChange={(event) => {
                    const fuel = parseInteger(event.target.value);
                    if (fuel != null) {
                      updateEntity('fuel', entity.setFuel(fuel));
                    }
                  }}
                  type="range"
                  value={entity.fuel}
                />
                <div className={textStyle}>
                  {entity.fuel}/{entity.info.configuration.fuel}
                </div>
                {entity.info.attack.weapons
                  ? [...entity.info.attack.weapons]
                      .filter(([, weapon]) => weapon.supply)
                      .map(([id, weapon]) => {
                        const ammo = entity.ammo?.get(id);
                        if (ammo === undefined) {
                          return null;
                        }

                        return (
                          <Fragment key={id}>
                            <Stack alignCenter start>
                              <Icon icon={Ammo} />
                              {weapon.name}
                            </Stack>
                            <Slider
                              max={String(weapon.supply)}
                              min="0"
                              onChange={(event) => {
                                const ammo = parseInteger(event.target.value);
                                if (ammo != null) {
                                  updateEntity(
                                    `ammo-${id}`,
                                    entity.setAmmo(
                                      new Map(entity.ammo).set(id, ammo),
                                    ),
                                  );
                                }
                              }}
                              type="range"
                              value={ammo}
                            />
                            <div className={textStyle}>
                              {ammo}/{weapon.supply}
                            </div>
                          </Fragment>
                        );
                      })
                  : null}
              </>
            )}
          </AttributeGrid>
          {isUnit(entity) && entity.player > 0 && (
            <label>
              <Stack alignCenter gap start>
                <input
                  checked={entity.isLeader()}
                  onChange={toggleLeader}
                  type="checkbox"
                />
                <span>
                  <fbt desc="Label for changing the leader unit">Leader</fbt>
                </span>
              </Stack>
            </label>
          )}
        </Box>
        {(isUnit(entity) ||
          (entityIsBuilding &&
            !entity.info.getAllBuildableUnits()[Symbol.iterator]().next()
              .done)) && (
          <Box className={fitContentStyle} gap={16} start vertical>
            <Stack alignCenter start>
              <Icon className={iconStyle} icon={Magic} />
              {isUnit(entity) ? (
                <fbt desc="Label for AI behavior">AI Behavior</fbt>
              ) : (
                <fbt desc="Label for AI behaviors">AI Behaviors</fbt>
              )}
            </Stack>
            <Stack gap>
              {[...AIBehaviors].map((behavior) => (
                <AIBehaviorLink
                  behavior={behavior}
                  entity={entity}
                  key={behavior}
                  updateEntity={updateEntity}
                />
              ))}
            </Stack>
          </Box>
        )}
        {entityIsBuilding && entity.info.hasBehavior(Behavior.SellSkills) ? (
          <Box gap={16} start vertical>
            <fbt desc="Headline for skills">Skills</fbt>
            <Stack gap={16} nowrap>
              {Array(MaxSkills)
                .fill(null)
                .map((_, index) => (
                  <SkillSelector
                    availableSkills={SkillsWithoutCosts}
                    blocklistedAreDisabled
                    blocklistedSkills={entity.skills}
                    currentSkill={skills[index]}
                    key={index}
                    onSelect={(skill: Skill | null) => {
                      const newSkills = [...skills];
                      newSkills[index] = skill || null;
                      setSkills(newSkills);

                      updateEntity(
                        `skill-${index}`,
                        entity.withSkills(new Set(newSkills.filter(isPresent))),
                      );
                    }}
                    showCost
                  />
                ))}
            </Stack>
          </Box>
        ) : null}
        {!isStructure && (
          <Box gap={16} start>
            {PlayerIDs.filter(
              (id) =>
                (entityIsBuilding && !entity.info.isHQ()) ||
                isUnit(entity) ||
                id > 0,
            ).map((id) => (
              <PlayerIcon
                id={id}
                key={id}
                onClick={() => updatePlayer(entity, id)}
                selected={entity.player === id}
              />
            ))}
          </Box>
        )}
        {isUnit(entity) && entity.player === 0 && (
          <Box gap={16} vertical>
            <Stack alignCenter start>
              <Icon className={iconStyle} icon={Rescue} />
              <fbt desc="Label for rescued by <player>">Rescued By</fbt>
            </Stack>
            <Stack gap={16} start>
              {PlayerIDs.slice(1).map((id) => (
                <PlayerIcon
                  id={id}
                  key={id}
                  onClick={() => updateRescue(entity, id)}
                  selected={entity.isBeingRescuedBy(id)}
                />
              ))}
            </Stack>
          </Box>
        )}
        <Box start>
          <LabelSelector
            active={entity.label}
            onChange={(label) =>
              updateEntity(`label-${label}`, entity.copy({ label }))
            }
          />
        </Box>
      </Stack>
    </Stack>
  );
}

const iconStyle = css`
  margin: 6px 8px 4px 0;
`;

const pixelatedStyle = css`
  image-rendering: pixelated;
  margin-top: -1px;
`;

const textStyle = css`
  text-align: right;
  width: 100px;
`;

const fitContentStyle = css`
  height: fit-content;
`;
