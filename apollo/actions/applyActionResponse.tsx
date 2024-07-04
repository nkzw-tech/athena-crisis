import { applyPower, getSkillConfig } from '@deities/athena/info/Skill.tsx';
import { RailBridge, RailTrack, River } from '@deities/athena/info/Tile.tsx';
import getActivePlayers from '@deities/athena/lib/getActivePlayers.tsx';
import getHealCost from '@deities/athena/lib/getHealCost.tsx';
import getUnitsToRefill from '@deities/athena/lib/getUnitsToRefill.tsx';
import maybeConvertPlayer from '@deities/athena/lib/maybeConvertPlayer.tsx';
import mergeTeams from '@deities/athena/lib/mergeTeams.tsx';
import refillUnits from '@deities/athena/lib/refillUnits.tsx';
import updatePlayer from '@deities/athena/lib/updatePlayer.tsx';
import updatePlayers from '@deities/athena/lib/updatePlayers.tsx';
import verifyTiles from '@deities/athena/lib/verifyTiles.tsx';
import {
  Charge,
  CreateTracksCost,
  HealAmount,
  MaxHealth,
} from '@deities/athena/map/Configuration.tsx';
import MapData from '@deities/athena/MapData.tsx';
import toggleLightningTile from '@deities/athena/mutation/toggleLightningTile.tsx';
import writeTile from '@deities/athena/mutation/writeTile.tsx';
import { VisionT } from '@deities/athena/Vision.tsx';
import UnknownTypeError from '@deities/hephaestus/UnknownTypeError.tsx';
import { ActionResponse } from '../ActionResponse.tsx';
import { applyHiddenActionResponse } from '../HiddenAction.tsx';
import { applyObjectiveActionResponse } from '../Objective.tsx';
import applyEndTurnActionResponse from './applyEndTurnActionResponse.tsx';

export default function applyActionResponse(
  map: MapData,
  vision: VisionT,
  actionResponse: ActionResponse,
): MapData {
  const { type } = actionResponse;

  const currentPlayer = map.getCurrentPlayer();
  if (
    currentPlayer.misses > 0 &&
    (type !== 'EndTurn' ||
      (actionResponse.current.player === currentPlayer.id &&
        !actionResponse.miss))
  ) {
    map = map.copy({
      teams: updatePlayer(map.teams, currentPlayer.copy({ misses: 0 })),
    });
  }

  switch (type) {
    case 'Move': {
      const { completed, from, fuel, to } = actionResponse;
      let unitA = map.units.get(from);
      const units = map.units.delete(from);
      const unitB = units.get(to);
      const canAct = !completed && unitA?.info.canAct(map.getPlayer(unitA));
      if (unitA) {
        unitA = unitA.setFuel(fuel).move();
      }
      return map.copy({
        units: unitA
          ? units.set(
              to,
              unitB
                ? unitB.load(unitA.transport())
                : canAct
                  ? unitA
                  : unitA.complete(),
            )
          : map.units,
      });
    }
    case 'AttackUnit': {
      const {
        chargeA,
        chargeB,
        from,
        hasCounterAttack,
        playerA,
        playerB,
        to,
        unitA,
        unitB,
      } = actionResponse;
      let { units } = map;
      const originalUnitA = map.units.get(from);
      const originalUnitB = map.units.get(to);

      units =
        unitA && originalUnitA
          ? units.set(
              from,
              maybeConvertPlayer(
                originalUnitA.copy(unitA).maybeUpdateAIBehavior().complete(),
                hasCounterAttack ? originalUnitB : null,
                'recover',
              ),
            )
          : units.delete(from);
      units =
        unitB && originalUnitB
          ? units.set(
              to,
              maybeConvertPlayer(
                originalUnitB.copy(unitB).maybeUpdateAIBehavior(),
                originalUnitA,
                'complete',
              ),
            )
          : units.delete(to);

      const lostUnits =
        unitA &&
        originalUnitA &&
        units.get(from)?.player === originalUnitA?.player
          ? 0
          : 1;
      const destroyedUnits =
        unitB &&
        originalUnitB &&
        units.get(to)?.player === originalUnitB?.player
          ? 0
          : 1;
      const oneShotB =
        originalUnitB && originalUnitB.health >= MaxHealth && !unitB ? 1 : 0;
      const oneShotA =
        originalUnitA && originalUnitA.health >= MaxHealth && !unitA ? 1 : 0;
      return map.copy({
        teams: updatePlayers(map.teams, [
          map
            .getPlayer(playerA)
            .modifyStatistics({
              damage: originalUnitB
                ? Math.max(0, originalUnitB.health - (unitB?.health || 0))
                : 0,
              destroyedUnits,
              lostUnits,
              oneShots: oneShotB,
            })
            .maybeSetCharge(chargeA),
          playerB !== 0
            ? map
                .getPlayer(playerB)
                .modifyStatistics({
                  damage: Math.max(
                    0,
                    hasCounterAttack && originalUnitA
                      ? originalUnitA.health - (unitA?.health || 0)
                      : 0,
                  ),
                  destroyedUnits: lostUnits,
                  lostUnits: destroyedUnits,
                  oneShots: oneShotA,
                })
                .maybeSetCharge(chargeB)
            : null,
        ]),
        units,
      });
    }
    case 'AttackBuilding': {
      const {
        building,
        chargeA,
        chargeB,
        chargeC,
        from,
        hasCounterAttack,
        playerA,
        playerC,
        to,
        unitA,
        unitC,
      } = actionResponse;
      let { units } = map;
      const originalUnitA = map.units.get(from);
      const originalBuilding = map.buildings.get(to);
      const originalUnitC = map.units.get(to);
      units =
        unitA && originalUnitA
          ? units.set(
              from,
              maybeConvertPlayer(
                originalUnitA.copy(unitA).maybeUpdateAIBehavior().complete(),
                hasCounterAttack ? originalUnitC : null,
                'recover',
              ),
            )
          : units.delete(from);
      units =
        unitC && originalUnitC
          ? units.set(to, originalUnitC.copy(unitC).maybeUpdateAIBehavior())
          : !building
            ? units.delete(to)
            : units;

      const lostUnits =
        unitA &&
        originalUnitA &&
        units.get(from)?.player === originalUnitA?.player
          ? 0
          : 1;
      const oneShotC =
        originalUnitC &&
        ((originalUnitC?.health >= MaxHealth && !unitC) || !building)
          ? 1
          : 0;
      const oneShotA =
        originalUnitA && originalUnitA?.health >= MaxHealth && !unitA ? 1 : 0;
      // Update `playerA` and `playerB` first, then update `playerC` which might equal `playerB`.
      const teams = originalBuilding
        ? updatePlayers(map.teams, [
            map
              .getPlayer(playerA)
              .modifyStatistics({
                damage: Math.max(
                  0,
                  originalBuilding.health - (building?.health || 0),
                ),
                destroyedBuildings: building ? 0 : 1,
                lostUnits,
                oneShots: oneShotC,
              })
              .maybeSetCharge(chargeA),
            originalBuilding.player > 0
              ? map
                  .getPlayer(originalBuilding.player)
                  .modifyStatistics({
                    lostBuildings: building ? 0 : 1,
                  })
                  .maybeSetCharge(chargeB)
              : null,
          ])
        : map.teams;

      return map.copy({
        buildings: building
          ? map.buildings.set(to, building)
          : map.buildings.delete(to),
        teams:
          originalUnitC && originalUnitC.player > 0 && playerC
            ? updatePlayer(
                teams,
                map
                  .getPlayer(playerC)
                  .modifyStatistics({
                    damage:
                      hasCounterAttack && originalUnitA
                        ? Math.max(
                            0,
                            originalUnitA.health - (unitA?.health || 0),
                          )
                        : 0,
                    destroyedUnits: lostUnits,
                    lostUnits: unitC ? 0 : 1,
                    oneShots: oneShotA,
                  })
                  .maybeSetCharge(chargeC),
              )
            : teams,
        units,
      });
    }
    case 'Capture': {
      const { building, from } = actionResponse;
      const unit = map.units.get(from);
      return building
        ? map.copy({
            buildings: map.buildings.set(
              from,
              building.setHealth(MaxHealth).complete(),
            ),
            teams: updatePlayer(
              map.teams,
              map.getPlayer(building.player).modifyStatistics({
                captured: 1,
              }),
            ),
            units: unit
              ? map.units.set(from, unit.move().complete())
              : map.units,
          })
        : map.copy({
            units: unit
              ? map.units.set(from, unit.capture().complete())
              : map.units,
          });
    }
    case 'Supply': {
      const { from, player } = actionResponse;
      const unit = map.units.get(from);
      const units = unit ? map.units.set(from, unit.complete()) : map.units;
      return map.copy({
        units: refillUnits(
          map.copy({ units }),
          getUnitsToRefill(map, vision, map.getPlayer(player), from),
        ).units,
      });
    }
    case 'CreateUnit': {
      const { free, from, skipBehaviorRotation, to, unit } = actionResponse;
      const building = map.buildings.get(from)!;
      const player = map.getPlayer(unit);
      return map.copy({
        buildings: map.buildings.set(
          from,
          (skipBehaviorRotation
            ? building
            : building.rotateAIBehavior()
          ).complete(),
        ),
        teams: updatePlayer(
          map.teams,
          player
            .modifyFunds(free ? 0 : -unit.info.getCostFor(player))
            .modifyStatistic('createdUnits', 1),
        ),
        units: map.units.set(to, unit),
      });
    }
    case 'DropUnit': {
      const { from, index, to } = actionResponse;
      const unitA = map.units.get(from);
      const unitB = unitA?.getTransportedUnit(index);
      return map.copy({
        units:
          unitA && unitB
            ? map.units
                .set(from, unitA.move().drop(unitB))
                .set(to, unitB.deploy())
            : map.units,
      });
    }
    case 'CreateBuilding': {
      const { building, from } = actionResponse;
      const teams = map.isNeutral(building)
        ? map.teams
        : updatePlayer(
            map.teams,
            map
              .getPlayer(building)
              .modifyFunds(-building.info.configuration.cost)
              .modifyStatistic('createdBuildings', 1),
          );
      return map.copy({
        buildings: map.buildings.set(from, building),
        teams,
        units: map.units.delete(from),
      });
    }
    case 'CreateTracks': {
      const { from } = actionResponse;
      const newMap = map.map.slice();
      const newModifiers = map.modifiers.slice();

      const unit = map.units.get(from);
      const tile = map.getTileInfo(from);
      writeTile(
        newMap,
        newModifiers,
        map.getTileIndex(from),
        tile === River ? RailBridge : RailTrack,
        0,
      );
      return verifyTiles(
        map.copy({
          map: newMap,
          modifiers: newModifiers,
          teams: unit
            ? updatePlayer(
                map.teams,
                map.getPlayer(unit.player).modifyFunds(-CreateTracksCost),
              )
            : map.teams,
          units: unit ? map.units.set(from, unit.complete()) : map.units,
        }),
        new Set(from.expandWithDiagonals()),
      );
    }
    case 'Fold': {
      const { from } = actionResponse;
      const unit = map.units.get(from);
      return unit
        ? map.copy({
            units: map.units.set(from, unit.fold().complete()),
          })
        : map;
    }
    case 'Unfold': {
      const { from } = actionResponse;
      const unit = map.units.get(from);
      return unit
        ? map.copy({
            units: map.units.set(from, unit.unfold().complete()),
          })
        : map;
    }
    case 'CompleteUnit': {
      const { from } = actionResponse;
      const unit = map.units.get(from);
      return unit
        ? map.copy({ units: map.units.set(from, unit.complete()) })
        : map;
    }
    case 'CompleteBuilding': {
      const { from } = actionResponse;
      const building = map.buildings.get(from)!;
      return map.copy({
        buildings: map.buildings.set(from, building.complete()),
      });
    }
    case 'EndTurn':
      return applyEndTurnActionResponse(map, actionResponse);
    case 'Heal': {
      const { from, to } = actionResponse;
      const unitA = from && map.units.get(from);
      const unitB = map.units.get(to)!;
      const player = map.getPlayer(unitB);
      const units = map.units.set(to, unitB.modifyHealth(HealAmount));
      return map.copy({
        teams: updatePlayer(
          map.teams,
          player.modifyFunds(-getHealCost(unitB, player)),
        ),
        units: unitA ? units.set(from, unitA.complete()) : units,
      });
    }
    case 'Message':
    case 'CharacterMessage':
      return map;
    case 'MoveUnit': {
      const { from } = actionResponse;
      const unit = map.units.get(from)!;
      return map.copy({ units: map.units.set(from, unit.move()) });
    }
    case 'Rescue': {
      const { from, name, player, to } = actionResponse;
      const unitA = from && map.units.get(from)!;
      const unitB = map.units.get(to)!;
      const rescueFinished = unitB.isBeingRescuedBy(player);
      let newUnit = rescueFinished
        ? unitB
            .stopBeingRescued()
            .setPlayer(player)
            .setHealth(MaxHealth)
            .recover()
        : unitB.rescue(player);
      if (name != null) {
        newUnit = newUnit.withName(name);
      }
      const units = map.units.set(to, newUnit);
      return map.copy({
        teams: rescueFinished
          ? updatePlayer(
              map.teams,
              map.getPlayer(player).modifyStatistic('rescuedUnits', 1),
            )
          : map.teams,
        units: unitA ? units.set(from, unitA.complete()) : units,
      });
    }
    case 'Sabotage': {
      const { from, to } = actionResponse;
      const unitA = from && map.units.get(from)!;
      const unitB = map.units.get(to)!;
      const units = map.units.set(to, unitB.sabotage());
      return map.copy({
        units: unitA ? units.set(from, unitA.complete()) : units,
      });
    }
    case 'Spawn': {
      const { teams, units } = actionResponse;
      const newMap = mergeTeams(map, teams).copy({
        units: map.units.merge(units),
      });
      return newMap.copy({
        active: getActivePlayers(newMap),
      });
    }
    case 'ToggleLightning': {
      const { from, player: playerID, to } = actionResponse;
      const building = from && map.buildings.get(from);
      const unit = map.units.get(to);
      const player = map.getPlayer((playerID || building?.player)!);
      return toggleLightningTile(map, to).copy({
        buildings: building
          ? map.buildings.set(from, building.complete())
          : undefined,
        teams: updatePlayers(map.teams, [
          player.setCharge(player.charge - Charge).modifyStatistics({
            damage: unit ? unit.health : 0,
            destroyedUnits: unit ? 1 : 0,
            oneShots: unit && unit.health >= MaxHealth ? 1 : 0,
          }),
          unit
            ? map.getPlayer(unit.player).modifyStatistic('lostUnits', 1)
            : null,
        ]),
        units: unit ? map.units.delete(to) : map.units,
      });
    }
    case 'HiddenFundAdjustment':
    case 'HiddenMove':
    case 'HiddenSourceAttackBuilding':
    case 'HiddenSourceAttackUnit':
    case 'HiddenDestroyedBuilding':
    case 'HiddenTargetAttackBuilding':
    case 'HiddenTargetAttackUnit':
      return applyHiddenActionResponse(map, vision, actionResponse);
    case 'OptionalObjective':
    case 'AttackUnitGameOver':
    case 'BeginTurnGameOver':
    case 'CaptureGameOver':
    case 'GameEnd':
    case 'PreviousTurnGameOver':
      return applyObjectiveActionResponse(map, actionResponse);
    case 'SetViewer': {
      const currentPlayer = map.maybeGetPlayer(vision.currentViewer)?.id;
      return currentPlayer
        ? map.copy({
            currentPlayer,
          })
        : map;
    }
    case 'BuySkill': {
      const { from, player, skill } = actionResponse;
      const building = map.buildings.get(from);
      const playerA = map.getPlayer(player);
      const { cost } = getSkillConfig(skill);
      return map.copy({
        buildings:
          building && vision.isVisible(map, from)
            ? map.buildings.set(from, building.complete())
            : map.buildings,
        teams: updatePlayer(
          map.teams,
          playerA.modifyFunds(cost != null ? -cost : 0).copy({
            skills: new Set([...playerA.skills, skill]),
          }),
        ),
      });
    }
    case 'ActivatePower': {
      const { skill } = actionResponse;
      const playerA = map.getCurrentPlayer();
      const { charges } = getSkillConfig(skill);

      return applyPower(
        skill,
        map.copy({
          teams: updatePlayer(
            map.teams,
            playerA
              .activateSkill(skill)
              .setCharge(playerA.charge - (charges || 0) * Charge),
          ),
        }),
      );
    }
    case 'ReceiveReward': {
      const { player, reward } = actionResponse;
      const rewardType = reward.type;
      switch (rewardType) {
        case 'Skill': {
          const playerA = map.getPlayer(player);
          return map.copy({
            teams: updatePlayer(
              map.teams,
              playerA.copy({
                skills: new Set([...playerA.skills, reward.skill]),
              }),
            ),
          });
        }
        case 'UnitPortraits':
          return map;
        default: {
          rewardType satisfies never;
          throw new UnknownTypeError(
            'applyActionResponse:ReceiveReward',
            rewardType,
          );
        }
      }
    }
    case 'BeginGame':
    case 'SecretDiscovered':
    case 'Start':
      return map;
    default: {
      actionResponse satisfies never;
      throw new UnknownTypeError('applyActionResponse', type);
    }
  }
}
