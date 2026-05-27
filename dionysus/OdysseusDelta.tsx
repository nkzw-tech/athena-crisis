import {
  ActivatePowerAction,
  AttackBuildingAction,
  AttackUnitAction,
  BuySkillAction,
  CaptureAction,
  CompleteBuildingAction,
  CompleteUnitAction,
  CreateBuildingAction,
  CreateUnitAction,
  DropUnitAction,
  FoldAction,
  HealAction,
  MoveAction,
  RescueAction,
  SabotageAction,
  SupplyAction,
  ToggleLightningAction,
  UnfoldAction,
} from '@deities/apollo/action-mutators/ActionMutators.tsx';
import { execute } from '@deities/apollo/Action.tsx';
import { getActivatePowerTargetCluster } from '@deities/apollo/lib/getActivatePowerActionResponse.tsx';
import {
  Behavior,
  BuildableTiles,
  BuildingInfo,
  filterBuildings,
  getAllBuildings,
} from '@deities/athena/info/Building.tsx';
import { getSkillConfig, Skill } from '@deities/athena/info/Skill.tsx';
import { Lightning } from '@deities/athena/info/Tile.tsx';
import { Ability, UnitInfo } from '@deities/athena/info/Unit.tsx';
import calculateClusters from '@deities/athena/lib/calculateClusters.tsx';
import calculateFunds from '@deities/athena/lib/calculateFunds.tsx';
import canActivatePower from '@deities/athena/lib/canActivatePower.tsx';
import canBuild from '@deities/athena/lib/canBuild.tsx';
import canDeploy from '@deities/athena/lib/canDeploy.tsx';
import canPlaceLightning from '@deities/athena/lib/canPlaceLightning.tsx';
import determineUnitsToCreate from '@deities/athena/lib/determineUnitsToCreate.tsx';
import getDeployableVectors from '@deities/athena/lib/getDeployableVectors.tsx';
import getPossibleUnitAbilities, {
  getPossibleUnitAbilitiesForBuildings,
} from '@deities/athena/lib/getPossibleUnitAbilities.tsx';
import getRescuableVectors from '@deities/athena/lib/getRescuableVectors.tsx';
import getUnitsToRefill from '@deities/athena/lib/getUnitsToRefill.tsx';
import hasUnitsOrProductionBuildings from '@deities/athena/lib/hasUnitsOrProductionBuildings.tsx';
import needsSupply from '@deities/athena/lib/needsSupply.tsx';
import { AIBehavior } from '@deities/athena/map/AIBehavior.tsx';
import Building from '@deities/athena/map/Building.tsx';
import { Charge, MaxHealth } from '@deities/athena/map/Configuration.tsx';
import { EntityType, getEntityGroup, getEntityInfoGroup } from '@deities/athena/map/Entity.tsx';
import Player, { PlayerID } from '@deities/athena/map/Player.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { getOpponentPriorityLabels } from '@deities/athena/Objectives.tsx';
import { moveable } from '@deities/athena/Radius.tsx';
import { VisionT } from '@deities/athena/Vision.tsx';
import groupBy from '@nkzw/core/groupBy.js';
import maxBy from '@nkzw/core/maxBy.js';
import minBy from '@nkzw/core/minBy.js';
import sortBy from '@nkzw/core/sortBy.js';
import BaseAI from './BaseAI.tsx';
import estimateClosestTarget from './lib/estimateClosestTarget.tsx';
import findPathToTarget from './lib/findPathToTarget.tsx';
import getAttackableUnitsWithinRadius from './lib/getAttackableUnitsWithinRadius.tsx';
import getBuildingWeight from './lib/getBuildingWeight.tsx';
import getCurrentAttackUnits from './lib/getCurrentAttackUnits.tsx';
import getHealingWeight from './lib/getHealingWeight.tsx';
import getInterestingVectors from './lib/getInterestingVectors.tsx';
import getInterestingVectorsByAbilities from './lib/getInterestingVectorsByAbilities.tsx';
import getPossibleAttacks, { PossibleAttack } from './lib/getPossibleAttacks.tsx';
import getUnitInfosWithMaxVision from './lib/getUnitInfosWithMaxVision.tsx';
import isAttackOptionCurrent from './lib/isAttackOptionCurrent.tsx';
import shouldActivatePower from './lib/shouldActivatePower.tsx';
import shouldAttack from './lib/shouldAttack.tsx';
import shouldCaptureBuilding from './lib/shouldCaptureBuilding.tsx';
import sortByDamage from './lib/sortByDamage.tsx';

type CreateUnitCombination = {
  from: Vector;
  to: Vector;
  unitInfo: UnitInfo;
  weight: number;
};

// OdysseusDelta is a fork of DionysusAlpha for deliberate AI strength improvements.
// Keep changes local to this file so DionysusAlpha campaign behavior remains stable.
export default class OdysseusDelta extends BaseAI {
  protected action(map: MapData): MapData | null {
    const developBeforeMovement = shouldDevelopBeforeMovement(map);
    const develop = () => this.buySkills(map) || this.createUnit(map);
    const reposition = () => this.move(map) || this.unfold(map);

    return (
      this.activatePower(map) ||
      this.finishCapture(map) ||
      this.finishRescue(map) ||
      this.toggleLightning(map) ||
      this.rescue(map) ||
      this.healUnit(map) ||
      this.attack(map) ||
      this.capture(map) ||
      this.fold(map) ||
      this.createBuilding(map) ||
      (developBeforeMovement ? develop() || reposition() : reposition() || develop()) ||
      this.endTurn(map)
    );
  }

  private activatePower(map: MapData): MapData | null {
    const player = map.getCurrentPlayer();
    const { activeSkills, charge, skills } = player;

    if (!skills.size || charge < Charge) {
      return null;
    }

    const potentialSkills: Array<Readonly<{ charges: number; from: Vector | null; skill: Skill }>> =
      [];
    for (const skill of skills) {
      if (activeSkills.has(skill)) {
        continue;
      }

      const { charges, requiresTarget } = getSkillConfig(skill);
      if (charges != null && canActivatePower(player, skill) && shouldActivatePower(map, skill)) {
        potentialSkills.push({
          charges,
          from: requiresTarget ? getActivatePowerTargetCluster(map, player.id) : null,
          skill,
        } as const);
      }
    }

    if (potentialSkills.length) {
      const { from, skill } = sortBy(
        potentialSkills,
        ({ charges, skill }) => skill - charges * 1000,
      )[0];
      const currentMap = this.execute(map, ActivatePowerAction(skill, from));
      if (currentMap) {
        this.tryAttacking();
      }
      return currentMap;
    }

    return null;
  }

  private attack(map: MapData): MapData | null {
    if (!this.shouldAttack()) {
      return null;
    }

    const currentPlayer = map.getCurrentPlayer();
    const vision = this.getVision(map);
    const labelsToPrioritize = getOpponentPriorityLabels(map.config.objectives, currentPlayer.id);
    let possibleAttacks = getPossibleAttacks(
      map,
      vision,
      map.units
        .filter(
          (unit) =>
            !unit.isCompleted() &&
            unit.info.hasAttack() &&
            !unit.isCapturing() &&
            map.matchesPlayer(currentPlayer, unit),
        )
        .toArray(),
      labelsToPrioritize,
    );
    possibleAttacks = sortOdysseusPossibleAttacks(map, currentPlayer, vision, possibleAttacks);

    if (!possibleAttacks.length) {
      this.finishAttacking();
      return null;
    }

    let currentMap: MapData | null = map;
    let didAct = false;
    while (possibleAttacks.length) {
      const attackOption = possibleAttacks.pop();
      if (!currentMap || !attackOption) {
        return null;
      }

      if (!isAttackOptionCurrent(currentMap, currentPlayer, attackOption)) {
        continue;
      }

      let hasMoved = false;
      let { from } = attackOption;
      const { entityB, parent, sabotage, to, unitA } = attackOption;
      if (
        (unitA.info.isShortRange() || unitA.info.canAct(currentMap.getPlayer(unitA))) &&
        from.distance(parent) >= 1
      ) {
        if (currentMap.units.has(parent)) {
          continue;
        }

        let isBlocked;
        [currentMap, isBlocked] = this.executeMove(currentMap, MoveAction(from, parent));
        if (isBlocked) {
          return currentMap;
        }

        if (!currentMap) {
          throw new Error('Error executing unit move.');
        }
        didAct = true;
        from = parent;
        hasMoved = true;
      }

      // If the target becomes hidden after a move, skip the current attack and attempt to target another unit.
      // This might happen when X-Fighters move away from a target hidden in a forest.
      if (!vision.isVisible(currentMap, to.vector)) {
        return currentMap;
      } else {
        currentMap = this.execute(
          currentMap,
          sabotage
            ? SabotageAction(from, to.vector)
            : entityB.info.type === EntityType.Building ||
                entityB.info.type === EntityType.Structure
              ? AttackBuildingAction(from, to.vector)
              : AttackUnitAction(from, to.vector),
        );
      }

      if (!currentMap) {
        throw new Error(
          'Error executing unit attack. ' +
            JSON.stringify({ entityB, from, to: to.vector, unitA }, null, 2),
        );
      }
      didAct = true;

      const dirtyUnits = new Set<Vector>();
      possibleAttacks = possibleAttacks.filter((item) => {
        if (item.from.equals(attackOption.from)) {
          return false;
        }

        if (
          // Consider original position via `attackOption.from`.
          (hasMoved && item.attackable.has(attackOption.from)) ||
          item.attackable.has(from) ||
          item.attackable.has(to.vector)
        ) {
          dirtyUnits.add(item.from);
          return false;
        }
        return true;
      });

      if (dirtyUnits.size) {
        possibleAttacks = [
          ...possibleAttacks,
          ...getPossibleAttacks(
            currentMap,
            vision,
            getCurrentAttackUnits(currentMap, currentPlayer, dirtyUnits),
            labelsToPrioritize,
          ),
        ];
        possibleAttacks = sortOdysseusPossibleAttacks(
          currentMap,
          currentPlayer,
          vision,
          possibleAttacks,
        );
      }
    }
    if (!didAct) {
      this.finishAttacking();
      return null;
    }
    return currentMap;
  }

  private finishCapture(map: MapData): MapData | null {
    const currentPlayer = map.getCurrentPlayer();
    const [from, unit] =
      map.units.findEntry(
        (unit) =>
          unit.isCapturing() && !unit.isCompleted() && map.matchesPlayer(currentPlayer, unit),
      ) || [];

    return from && unit ? this.execute(map, CaptureAction(from)) : null;
  }

  private capture(map: MapData): MapData | null {
    const currentPlayer = map.getCurrentPlayer();
    const units = map.units.filter(
      (unit) =>
        !unit.isCompleted() &&
        !unit.isCapturing() &&
        map.matchesPlayer(currentPlayer, unit) &&
        unit.canCapture(currentPlayer),
    );

    if (!units.size) {
      return null;
    }

    if (shouldPreferLocalCapture(map)) {
      for (const [from, unit] of units) {
        const { to } =
          (shouldMove(unit) &&
            maxBy(
              filterMap(
                moveable(this.applyVision(map), unit, from, undefined, undefined, true),
                ({ cost, vector }) => {
                  const building = map.buildings.get(vector);
                  const info = building?.info;
                  return info &&
                    map.isOpponent(unit, building) &&
                    (vector.equals(from) || !map.units.has(vector))
                    ? {
                        to: vector,
                        weight: getBuildingWeight(info) - cost + (map.isNeutral(building) ? 0 : 5),
                      }
                    : null;
                },
              ),
              (item) => item?.weight || Number.NEGATIVE_INFINITY,
            )) ||
          {};

        if (!to || to.equals(from)) {
          const building = map.buildings.get(from);
          if (building && map.isOpponent(unit, building)) {
            return this.execute(map, CaptureAction(from));
          }

          continue;
        }

        const [currentMap, isBlocked] = this.executeMove(map, MoveAction(from, to));
        if (isBlocked) {
          return currentMap;
        }
        if (!currentMap) {
          throw new Error('Error executing unit move.');
        }
        return this.execute(currentMap, CaptureAction(to));
      }

      return null;
    }

    const mapWithVision = this.applyVision(map);
    const capture = maxBy(
      [...units].flatMap(([from, unit]) => {
        const candidates: Array<
          Readonly<{ from: Vector; to: Vector; unit: Unit; weight: number }>
        > = [];
        const building = map.buildings.get(from);
        if (building && map.isOpponent(unit, building)) {
          candidates.push({
            from,
            to: from,
            unit,
            weight: getOdysseusCaptureWeight(map, currentPlayer, building, from, 0) + 100,
          });
        }

        if (shouldMove(unit)) {
          for (const [, { cost, vector }] of moveable(
            mapWithVision,
            unit,
            from,
            undefined,
            undefined,
            true,
          )) {
            const building = map.buildings.get(vector);
            if (
              building &&
              map.isOpponent(unit, building) &&
              (vector.equals(from) || !map.units.has(vector))
            ) {
              candidates.push({
                from,
                to: vector,
                unit,
                weight: getOdysseusCaptureWeight(map, currentPlayer, building, vector, cost),
              });
            }
          }
        }
        return candidates;
      }),
      (item) => item?.weight || Number.NEGATIVE_INFINITY,
    );

    if (capture) {
      const { from, to } = capture;
      if (to.equals(from)) {
        return this.execute(map, CaptureAction(from));
      }

      const [currentMap, isBlocked] = this.executeMove(map, MoveAction(from, to));
      if (isBlocked) {
        return currentMap;
      }
      if (!currentMap) {
        throw new Error('Error executing unit move.');
      }
      return this.execute(currentMap, CaptureAction(to));
    }

    return null;
  }

  private finishRescue(map: MapData): MapData | null {
    if (!map.hasNeutralUnits()) {
      return null;
    }

    const currentPlayer = map.getCurrentPlayer();
    const [from, unit] =
      map.units.findEntry(
        (unit) =>
          !unit.isCompleted() &&
          unit.info.hasAbility(Ability.Rescue) &&
          map.matchesPlayer(currentPlayer, unit),
      ) || [];

    if (from && unit) {
      const rescuable = getRescuableVectors(map, from);
      const to = [...rescuable].find((vector) =>
        map.units.get(vector)?.isBeingRescuedBy(unit.player),
      );
      if (to) {
        this.tryAttacking();
        return this.execute(map, RescueAction(from, to));
      }
    }

    return null;
  }

  private rescue(map: MapData): MapData | null {
    if (!map.hasNeutralUnits()) {
      return null;
    }

    const currentPlayer = map.getCurrentPlayer();
    const entry = map.units.findEntry(
      (unit) =>
        !unit.isCompleted() &&
        unit.info.hasAbility(Ability.Rescue) &&
        map.matchesPlayer(currentPlayer, unit),
    );

    if (!entry) {
      return null;
    }

    const [from, unit] = entry;
    const { parent, to } =
      (shouldMove(unit) &&
        maxBy(
          [...moveable(this.applyVision(map), unit, from, undefined, undefined, true)].flatMap(
            ([, { cost, vector }]) => {
              const vectors: Array<Readonly<{ parent: Vector; to: Vector; weight: number }>> = [];
              if (vector.equals(from) || !map.units.has(vector)) {
                for (const adjacent of vector.adjacent()) {
                  const unit = map.units.get(adjacent);
                  if (unit?.player === 0) {
                    const { info } = unit;
                    vectors.push({
                      parent: vector,
                      to: adjacent,
                      weight:
                        Math.max(
                          info.defense +
                            [...(info.attack?.weapons || [])]
                              .flatMap(([, weapon]) => weapon.damage.values())
                              .reduce((sum, [, damage]) => sum + damage, 0) -
                            cost,
                          0,
                        ) *
                        (unit.isBeingRescuedBy(currentPlayer.id)
                          ? 100
                          : unit.isBeingRescued() &&
                              map.isOpponent(currentPlayer, unit.getRescuer()!)
                            ? 10
                            : 1),
                    });
                  }
                }
              }
              return vectors;
            },
          ),
          (item) => item?.weight || Number.NEGATIVE_INFINITY,
        )) ||
      {};

    if (!to || !parent) {
      return null;
    }

    if (parent.equals(from)) {
      if (map.units.get(to)?.isBeingRescuedBy(currentPlayer.id)) {
        this.tryAttacking();
      }
      return this.execute(map, RescueAction(from, to));
    }

    const [currentMap, isBlocked] = this.executeMove(map, MoveAction(from, parent));
    if (isBlocked) {
      return currentMap;
    }
    if (!currentMap) {
      throw new Error('Error executing unit move.');
    }

    if (map.units.get(to)?.isBeingRescuedBy(currentPlayer.id)) {
      this.tryAttacking();
    }
    return this.execute(currentMap, RescueAction(parent, to));
  }

  private _canBuildFundsBuildings: boolean | null = null;
  private getCanBuildFundsBuildings(map: MapData, player: Player, exampleVector: Vector) {
    if (this._canBuildFundsBuildings === null) {
      const check = (vector: Vector) => {
        for (const building of getAllBuildings()) {
          if (
            building.configuration.funds > 0 &&
            !map.config.blocklistedBuildings.has(building.id) &&
            building.getCostFor(player) < Number.POSITIVE_INFINITY &&
            canBuild(map, building, player, vector)
          ) {
            return true;
          }
        }
        return false;
      };

      this._canBuildFundsBuildings =
        check(exampleVector) ||
        map.reduceEachField((canBuildFundsBuilding, vector) => {
          if (canBuildFundsBuilding) {
            return true;
          }

          if (!BuildableTiles.has(map.getTileInfo(vector)) || map.buildings.get(vector)) {
            return false;
          }

          return check(vector);
        }, false);
    }
    return this._canBuildFundsBuildings;
  }

  private createBuilding(map: MapData): MapData | null {
    const currentPlayer = map.getCurrentPlayer();
    const [from, unit] =
      map.units.findEntry(
        (unit) =>
          !unit.isCompleted() &&
          unit.info.hasAbility(Ability.CreateBuildings) &&
          map.matchesPlayer(currentPlayer, unit),
      ) || [];

    if (!from || !unit) {
      return null;
    }

    let _funds: number | null = null;
    const getFundsPerTurn = () =>
      _funds == null ? (_funds = calculateFunds(map, currentPlayer)) : _funds;

    let _allowAnyBuilding: boolean | null = null;
    const getAllowAnyBuilding = () =>
      _allowAnyBuilding === null
        ? (_allowAnyBuilding = hasUnitsOrProductionBuildings(map, currentPlayer, 'with-attack'))
        : _allowAnyBuilding;

    const shouldBuild = (info: BuildingInfo) =>
      getAllowAnyBuilding()
        ? info.configuration.funds > 0 ||
          getFundsPerTurn() > 0 ||
          !this.getCanBuildFundsBuildings(map, currentPlayer, from)
        : info.canBuildUnits();

    // Find a building to construct based on importance.
    const { info, to } =
      maxBy(
        filterMap(
          moveable(this.applyVision(map), unit, from, undefined, undefined, true),
          (item) => {
            const tile = map.getTileInfo(item.vector);
            if (!BuildableTiles.has(tile)) {
              return null;
            }

            const currentUnit = map.units.get(item.vector);
            if (map.buildings.has(item.vector) || (currentUnit && !from.equals(item.vector))) {
              return null;
            }

            const buildingInfos = filterBuildings(
              (info) =>
                info.getCostFor(currentPlayer) <= currentPlayer.funds &&
                canBuild(map, info, unit.player, item.vector) &&
                shouldBuild(info),
            );

            if (!buildingInfos.length) {
              return null;
            }

            // Determine which buildings to build. This algorithm usually
            // prioritizes buildings that generate funds over production
            // by keeping a 3:1 ratio between fund generating buildings and
            // production buildings. Note that production facilities that generate
            // funds are considered as resource buildings in this algorithm.
            //
            // Depending on the map configuration, the algorithm might choose
            // to build map-specific buildings like Radar Stations.
            const userBuildings = map.buildings.filter((building) =>
              map.matchesPlayer(building, currentPlayer),
            );

            const buildingPartition = groupBy(userBuildings, ([, building]) => {
              const canBuildUnits = building.canBuildUnits(currentPlayer);
              return building.info.configuration.funds > 0 && !canBuildUnits
                ? 'funds'
                : canBuildUnits
                  ? 'production'
                  : null;
            });

            const productionBuildings = buildingPartition.get('production') || [];
            const fundBuildings = buildingPartition.get('funds') || [];

            const shouldBuildFundsBuilding =
              productionBuildings.length && fundBuildings.length / 3 < productionBuildings.length;

            const radarBuilding = buildingInfos.find((info) => info.hasBehavior(Behavior.Radar));
            const shouldBuildRadar =
              radarBuilding &&
              !userBuildings.some((building) => building.info.hasBehavior(Behavior.Radar)) &&
              map.reduceEachField(
                (hasLightning, vector) =>
                  map.getTileInfo(vector) === Lightning ? true : hasLightning,
                false,
              );
            const info = shouldBuildRadar
              ? radarBuilding
              : sortBy(
                  buildingInfos.filter((info) =>
                    shouldBuildFundsBuilding
                      ? info.configuration.funds > 0
                      : info.configuration.funds === 0 &&
                        !info.getAllBuildableUnits()[Symbol.iterator]().next().done,
                  ),
                  (info) =>
                    (shouldBuildFundsBuilding
                      ? -info.configuration.funds * 1000
                      : info.getCostFor(null)) +
                    info.id / 100,
                )[0] || buildingInfos[0];

            if (info) {
              return {
                info,
                to: item.vector,
                weight:
                  -item.vector.distance(from) *
                  (userBuildings.some((building) => building.info === info) ? 0.5 : 1),
              };
            }
            return null;
          },
        ),
        (item) => item?.weight || 0,
      ) || {};

    if (!to || !info) {
      return null;
    }
    let currentMap: MapData | null = map;
    if (!from.equals(to) && from.distance(to) !== 0) {
      if (!shouldMove(unit)) {
        return null;
      }

      let isBlocked;
      [currentMap, isBlocked] = this.executeMove(currentMap, MoveAction(from, to));
      if (isBlocked) {
        return currentMap;
      }

      if (!currentMap) {
        throw new Error('Error executing unit move.');
      }
    }

    currentMap = this.execute(currentMap, CreateBuildingAction(to, info.id));
    if (currentMap) {
      this._canBuildFundsBuildings = null;
    }
    return currentMap;
  }

  private buySkills(map: MapData): MapData | null {
    const currentPlayer = map.getCurrentPlayer();
    if (currentPlayer.funds <= 0) {
      return null;
    }

    const [from, building] =
      map.buildings.findEntry(
        (building) =>
          !!(
            !building.isCompleted() &&
            map.matchesPlayer(currentPlayer, building) &&
            building.skills?.size
          ),
      ) || [];

    if (!from || !building || !building.skills?.size) {
      return null;
    }

    const buyableSkills = [...building.skills].filter((skill) => {
      const { cost } = getSkillConfig(skill);
      return (
        cost != null && cost > 0 && cost <= currentPlayer.funds && !currentPlayer.skills.has(skill)
      );
    });

    if (buyableSkills.length) {
      return this.execute(map, BuySkillAction(from, sortBy(buyableSkills, (skill) => skill)[0]));
    }

    return null;
  }

  private createUnit(map: MapData): MapData | null {
    const currentPlayer = map.getCurrentPlayer();
    if (currentPlayer.funds <= 0) {
      return null;
    }

    const buildings = map.buildings.filter((building, vector) => {
      if (
        building.isCompleted() ||
        !map.matchesPlayer(currentPlayer, building) ||
        !building.canBuildUnits(currentPlayer)
      ) {
        return false;
      }

      const unit = map.units.get(vector);
      return !unit || map.matchesTeam(unit, building);
    });

    if (!buildings.size) {
      return null;
    }

    const buildCapabilities = getPossibleUnitAbilitiesForBuildings(
      [...buildings.values()],
      currentPlayer,
    );

    const playerUnits = [
      ...map.units.filter((unit) => map.matchesPlayer(unit, currentPlayer)).values(),
    ];

    const avoidNavalUnits =
      map.round >= 5 && !shouldBuildNavalUnits(map, currentPlayer, playerUnits);

    const getBestUnit = (unitInfos: ReadonlyArray<UnitInfo>): UnitInfo =>
      unitInfos.length > 1 &&
      hasTooManyOfType(playerUnits, unitInfos[0]) &&
      !hasTooManyOfType(playerUnits, unitInfos[1])
        ? unitInfos[1]
        : unitInfos[0];

    const clusterMap = new Map<PlayerID | null, ReadonlyArray<Vector>>();
    const getClusters = (building: Building, unitInfos: ReadonlyArray<UnitInfo>) => {
      if (!clusterMap.has(building.label)) {
        const clusters = calculateClusters(
          map.size,
          getInterestingVectorsByAbilities(
            map,
            currentPlayer,
            building.label,
            getPossibleUnitAbilities(unitInfos),
          ),
          4,
        );
        clusterMap.set(building.label, clusters);
        return clusters;
      }
      return clusterMap.get(building.label)!;
    };

    const unitInfoMap = new Map<number, ReadonlyArray<UnitInfo>>();
    const getUnitInfos = (building: Building, vector: Vector) => {
      if (!unitInfoMap.has(building.id)) {
        const unitInfos = determineUnitsToCreate(
          map,
          currentPlayer,
          playerUnits,
          [...building.getBuildableUnits(currentPlayer)].filter(
            (info) =>
              info.getCostFor(currentPlayer) <=
                currentPlayer.funds /
                  (map.round > 3 && !((map.round + 3) % 6) ? Math.min(buildings.size - 1, 3) : 1) &&
              getDeployableVectors(map, info, vector, currentPlayer.id).length,
          ),
          buildCapabilities,
        );
        unitInfoMap.set(building.id, unitInfos);
        return unitInfos;
      }

      return unitInfoMap.get(building.id)!;
    };

    const combinations: Array<CreateUnitCombination> = [];
    for (const [from, building] of buildings) {
      const unitInfos = getUnitInfos(building, from);
      if (
        !unitInfos.length ||
        // If the player only generates enough funds to build the same unit each turn,
        // and there are already enough of the same unit on the map, don't build any more.
        (unitInfos.length === 1 &&
          unitInfos[0].getCostFor(currentPlayer) === calculateFunds(map, currentPlayer) &&
          playerUnits.filter((unit) => unit.id === unitInfos[0].id).length >=
            Math.ceil((map.size.width * map.size.height) / 100))
      ) {
        continue;
      }

      const clusters = getClusters(building, unitInfos);
      if (!clusters.length) {
        const unitInfo = minBy(unitInfos, (info) => info.getCostFor(currentPlayer));
        if (!unitInfo) {
          continue;
        }

        const newCluster = map.buildings
          .filter((buildingB, vector) =>
            shouldCaptureBuilding(map, currentPlayer.id, buildingB, vector),
          )
          .keySeq()
          .minBy((vector) => vector.distance(from));
        const to =
          newCluster &&
          minBy(getDeployableVectors(map, unitInfo, from, currentPlayer.id), (vector) =>
            vector.distance(newCluster),
          );
        if (to) {
          const [item] = estimateClosestTarget(
            map,
            unitInfo.create(currentPlayer),
            newCluster,
            to,
            true,
          );
          combinations.push({ from, to, unitInfo, weight: item?.cost || 0 });
        }
        continue;
      }

      const cluster = minBy(clusters, (cluster) => from.distance(cluster)) || clusters[0];
      const unitInfo = getBestUnit(
        rankOdysseusUnitChoices(
          map,
          currentPlayer,
          playerUnits,
          map.config.fog && (map.round === 3 || (map.round > 4 && !(map.round % 4)))
            ? getUnitInfosWithMaxVision(unitInfos)
            : sortByDamage(
                map,
                getAttackableUnitsWithinRadius(
                  map,
                  cluster,
                  // Look at a radius roughly correlated with map size.
                  Math.max(3, Math.ceil((map.size.width + map.size.height) / 6)),
                ),
                unitInfos,
                currentPlayer,
              ),
          cluster,
        ),
      );
      const to = minBy(getDeployableVectors(map, unitInfo, from, currentPlayer.id), (vector) =>
        vector.distance(cluster),
      );
      if (to) {
        const [item, , isObstructed] = estimateClosestTarget(
          map,
          unitInfo.create(currentPlayer),
          to,
          cluster,
          true,
        );
        // Only build units without attacks if they can reach their target
        // without obstruction.
        if (
          unitInfo.hasAttack() ||
          map.round <= 4 ||
          !isObstructed ||
          (isNaval(unitInfo) &&
            (unitInfo.canTransportUnits() || unitInfo.hasAbility(Ability.Supply)))
        ) {
          combinations.push({
            from,
            to,
            unitInfo,
            weight:
              (item?.cost || 0) +
              (avoidNavalUnits && isNaval(unitInfo) ? 10 : 0) +
              getOdysseusProductionWeight(map, currentPlayer, playerUnits, unitInfo, cluster),
          });
        }
      }
    }

    const bestCombination = sortBy(combinations, ({ weight }) => weight)[0];
    if (bestCombination) {
      const { from, to, unitInfo } = bestCombination;

      if (map.config.fog) {
        this.tryAttacking();
      }

      return this.execute(map, CreateUnitAction(from, unitInfo.id, to));
    }

    return null;
  }

  private fold(map: MapData): MapData | null {
    const currentPlayer = map.getCurrentPlayer();

    const [from, unit] =
      map.units.findEntry(
        (unit) =>
          !unit.isCompleted() &&
          unit.isUnfolded() &&
          map.matchesPlayer(currentPlayer, unit) &&
          !unit.matchesBehavior(AIBehavior.Stay),
      ) || [];

    if (!from || !unit) {
      return null;
    }

    const maxRange = unit.info.getRangeFor(currentPlayer)?.[1] || 0;
    const closestCluster = minBy(
      calculateClusters(
        map.size,
        Array.from(
          new Set([
            ...map.units.filter((unit) => map.isOpponent(unit, currentPlayer)).keys(),
            ...map.buildings.filter((building) => map.isOpponent(building, currentPlayer)).keys(),
          ]),
        ),
      ),
      (cluster) => from.distance(cluster),
    );
    if (!closestCluster || from.distance(closestCluster) > maxRange * 1.5) {
      return this.execute(map, FoldAction(from));
    }

    return null;
  }

  private unfold(map: MapData): MapData | null {
    const from = map.units.findKey(canUnfold.bind(null, map));
    return from ? this.unfoldUnit(map, from) : null;
  }

  private unfoldUnit(map: MapData, from: Vector) {
    const unit = map.units.get(from);
    if (unit && canUnfold(map, unit)) {
      const currentPlayer = map.getCurrentPlayer();
      const vision = this.getVision(map);
      const unfoldedUnit = unit.unfold();
      const unfoldedMap = map.copy({
        units: map.units.set(from, unfoldedUnit),
      });
      const attackableUnits = getAttackableUnitsWithinRadius(
        map,
        from,
        (unit.info.getRangeFor(currentPlayer)?.[1] ||
          Math.max(2, Math.ceil(map.size.width + map.size.height) / 6)) + 2,
      );
      const target = attackableUnits.filter(([vector]) =>
        shouldAttack(unfoldedMap, vision, unfoldedUnit, from, vector),
      )?.[0]?.[0];

      if (
        target &&
        unit.info.canAttackAt(from.distance(target), unit.info.getRangeFor(currentPlayer))
      ) {
        const currentMap = this.execute(map, UnfoldAction(from));
        if (!currentMap) {
          throw new Error('Error executing unit unfold.');
        }
        // Unfolding may increase visibility of the unit.
        this.tryAttacking();
        return currentMap;
      }
    }
    return null;
  }

  private move(map: MapData): MapData | null {
    const currentPlayer = map.getCurrentPlayer();
    const units = map.units.filter(
      (unit) => shouldMove(unit) && !unit.isCapturing() && map.matchesPlayer(currentPlayer, unit),
    );

    const supplyEntry = units.findEntry((unit) => unit.info.abilities.has(Ability.Supply));
    const [from, unit] =
      // Prioritize units with supply ability.
      (supplyEntry &&
        map.units.filter((unit) => map.matchesPlayer(currentPlayer, unit) && needsSupply(unit))
          .size &&
        supplyEntry) ||
      // In fog, move units with the highest vision first.
      (map.config.fog &&
        maxBy(units.toArray(), ([, { info }]) =>
          !info.canTransportUnits() ? info.configuration.vision : 1,
        )) ||
      // Prioritize any unit that cannot transport other units.
      units.findEntry((unit) => !unit.info.canTransportUnits()) ||
      // Make sure units that aren't transporting units move out of the way if necessary.
      units.findEntry((unit) => !unit.isTransportingUnits()) ||
      // Pick any remaining unit.
      units.findEntry(() => true) ||
      [];

    if (!from || !unit) {
      return null;
    }

    const mapWithVision = this.applyVision(map);
    const clusters = calculateClusters(map.size, getInterestingVectors(map, from, unit));

    const [target, radiusToTarget, isObstructed, realTarget] = estimateClosestTarget(
      mapWithVision,
      unit,
      from,
      clusters,
    );
    const moveableRadius = moveable(mapWithVision, unit, from);
    let to =
      target && findPathToTarget(mapWithVision, unit, target, moveableRadius, radiusToTarget, true);
    let currentMap: MapData | null = map,
      isBlocked;

    if (
      !to ||
      isObstructed ||
      clusters.every(
        (vector) => vector.distance(from!) > unit.info.getRadiusFor(map.getPlayer(unit)) * 2.5,
      )
    ) {
      for (const [vector] of moveableRadius) {
        const unitB = map.units.get(vector);
        if (
          unitB &&
          !unitB.isFull() &&
          unitB.info.canTransport(unit.info, map.getTileInfo(vector)) &&
          map.matchesPlayer(unit, unitB)
        ) {
          to = vector;
        }
      }
    }

    if (to && realTarget && !map.units.has(to)) {
      to = chooseOdysseusMove(
        mapWithVision,
        currentPlayer,
        unit,
        from,
        to,
        moveableRadius,
        realTarget,
      );
    }

    if (to) {
      [currentMap, isBlocked] = this.executeMove(currentMap, MoveAction(from, to));
      if (isBlocked) {
        // Wipe away attack cache as the radius might have changed.
        this.tryAttacking();
        return currentMap;
      }
    } else {
      const maybeMap = this.unfoldUnit(map, from);
      if (maybeMap) {
        return maybeMap;
      }

      currentMap = this.maybeDropUnit(currentMap, from, realTarget);
      if (!currentMap) {
        return null;
      }

      currentMap = this.execute(currentMap, CompleteUnitAction(from));
      if (!currentMap) {
        throw new Error('Error executing unit completion.');
      }
      return currentMap;
    }

    if (!currentMap) {
      throw new Error('Error executing unit move.');
    }

    // If there was previously a unit at this location it means that the acted
    // upon unit was loaded into the existing unit. We can't keep actioning on the
    // loaded unit so we return here.
    const previousUnit = to && map.units.get(to);
    if (previousUnit) {
      return currentMap;
    }

    return this.actionsAfterMove(currentMap, to, realTarget);
  }

  private maybeDropUnit(currentMap: MapData, position: Vector, target?: Vector | null) {
    if (!currentMap) {
      return null;
    }

    const player = currentMap.getCurrentPlayer();
    const unit = currentMap.units.get(position);
    if (
      unit &&
      !unit.isCompleted() &&
      currentMap.matchesPlayer(player, unit) &&
      target &&
      unit.isTransportingUnits() &&
      unit.transports.some(
        (transportedUnit) =>
          currentMap &&
          unit.info.canDropFrom(transportedUnit.info, currentMap.getTileInfo(position)),
      )
    ) {
      const isNaval = isNavalUnit(unit);
      for (let index = unit.transports.length - 1; index >= 0; index--) {
        const transportedUnit = unit.transports[index];
        const multiplier = isNaval ? 2.5 : 1.5;
        if (
          target.distance(position) >
          transportedUnit.info.getRadiusFor(currentMap.getPlayer(transportedUnit)) * multiplier
        ) {
          continue;
        }

        const dropTo = minBy(
          position
            .adjacent()
            .filter(
              (vector) =>
                canDeploy(currentMap!, transportedUnit.info, vector, true) &&
                unit.info.canDropFrom(transportedUnit.info, currentMap.getTileInfo(position)),
            ),
          (vector) => vector.distance(target),
        );

        if (dropTo) {
          const map = this.execute(currentMap, DropUnitAction(position, index, dropTo));
          if (!map) {
            throw new Error('Error executing unit drop.');
          }

          this.tryAttacking();

          return map;
        }
      }
    }

    return currentMap;
  }

  private actionsAfterMove(currentMap: MapData | null, position: Vector, target?: Vector | null) {
    if (!currentMap) {
      return null;
    }

    if (currentMap.config.fog) {
      this.tryAttacking();
    }

    let unit = position && currentMap.units.get(position);
    if (!unit || unit.isCompleted()) {
      return currentMap;
    }

    if (unit.info.isLongRange()) {
      this.tryAttacking();
      return currentMap;
    }

    currentMap = this.maybeDropUnit(currentMap, position, target);
    if (!currentMap) {
      return null;
    }

    // While not currently possible, a unit may be able to transport and/or supply all in the same turn.
    // Here we retrieve the unit again after each action to ensure its state is fresh.
    unit = currentMap.units.get(position);
    if (
      unit &&
      unit.info.hasAbility(Ability.Supply) &&
      getUnitsToRefill(currentMap, this.getVision(currentMap), currentMap.getPlayer(unit), position)
        .size > 0
    ) {
      this.tryAttacking();

      currentMap = this.execute(currentMap, SupplyAction(position));
      if (!currentMap) {
        throw new Error('Error executing unit supply.');
      }
    }

    unit = currentMap.units.get(position);
    if (
      unit &&
      !unit.isCompleted() &&
      !unit.info.hasAttack() &&
      unit.canCapture(currentMap.getCurrentPlayer())
    ) {
      // Mark units with the capture ability as completed so that `beginCapture`
      // will not attempt to process the same unit on every action.
      currentMap = this.execute(currentMap, CompleteUnitAction(position));
      if (!currentMap) {
        throw new Error('Error executing unit complete.');
      }
    }

    return currentMap;
  }

  private toggleLightning(map: MapData) {
    const currentPlayer = map.getCurrentPlayer();
    if (currentPlayer.charge < Charge) {
      return false;
    }

    const buildings = map.buildings.filter(
      (building) =>
        !building.isCompleted() &&
        building.info.hasBehavior(Behavior.Radar) &&
        map.matchesPlayer(currentPlayer, building),
    );

    const from = buildings.keys().next().value as Vector;
    if (!from) {
      return null;
    }

    const mapWithvision = this.applyVision(map);
    const fields = map.reduceEachField<{
      off: Array<Vector>;
      on: Array<Vector>;
    }>(
      (fields, vector) =>
        map.getTileInfo(vector) === Lightning
          ? { ...fields, off: [...fields.off, vector] }
          : mapWithvision.units.has(vector) && canPlaceLightning(map, vector)
            ? { ...fields, on: [...fields.on, vector] }
            : fields,
      { off: [], on: [] },
    );

    if (fields.on.length) {
      return this.execute(map, ToggleLightningAction(from, fields.on[0]));
    } else if (fields.off.length) {
      return this.execute(map, ToggleLightningAction(from, fields.off[0]));
    }

    return this.execute(map, CompleteBuildingAction(from));
  }

  private healUnit(map: MapData): MapData | null {
    const currentPlayer = map.getCurrentPlayer();
    let mapWithVision: MapData | null = null;

    for (const [from, unit] of map.units) {
      if (
        unit.isCompleted() ||
        !unit.info.hasAbility(Ability.Heal) ||
        !map.matchesPlayer(currentPlayer, unit)
      ) {
        continue;
      }

      const fields: ReadonlyMap<Vector, Readonly<{ cost: number; vector: Vector }>> = shouldMove(
        unit,
      )
        ? moveable(
            mapWithVision || (mapWithVision = this.applyVision(map)),
            unit,
            from,
            undefined,
            undefined,
            true,
          )
        : new Map([[from, { cost: 0, vector: from }]]);
      const { parent, to } =
        maxBy(
          [...fields].flatMap(([, { cost, vector }]) => {
            const vectors: Array<Readonly<{ parent: Vector; to: Vector; weight: number }>> = [];
            if (vector.equals(from) || !map.units.has(vector)) {
              for (const adjacent of vector.adjacent()) {
                const targetUnit = map.units.get(adjacent);
                const healingWeight = targetUnit && getHealingWeight(map, targetUnit);
                const validVector =
                  healingWeight &&
                  !adjacent.equals(from) &&
                  map.matchesPlayer(unit, targetUnit) &&
                  targetUnit.health < MaxHealth &&
                  unit.info.configuration.healTypes?.has(targetUnit.info.type);
                if (validVector) {
                  vectors.push({
                    parent: vector,
                    to: adjacent,
                    weight: healingWeight * 10 - cost,
                  });
                }
              }
            }
            return vectors;
          }),
          (item) => item?.weight || Number.NEGATIVE_INFINITY,
        ) || {};

      if (!to || !parent) {
        continue;
      }

      if (parent.equals(from)) {
        return this.execute(map, HealAction(parent, to));
      }

      const [currentMap, isBlocked] = this.executeMove(map, MoveAction(from, parent));
      if (isBlocked) {
        return currentMap;
      }

      if (!currentMap) {
        throw new Error('Error executing unit move.');
      }

      return this.execute(currentMap, HealAction(parent, to));
    }

    return null;
  }
}

const canUnfold = (map: MapData, unit: Unit) =>
  unit.info.hasAbility(Ability.Unfold) &&
  !unit.isCompleted() &&
  !unit.isUnfolded() &&
  map.matchesPlayer(map.getCurrentPlayer(), unit);

const shouldMove = (unit: Unit) => unit.canMove() && !unit.matchesBehavior(AIBehavior.Stay);

const filterMap = <T, K, V>(
  initialMap: ReadonlyMap<K, V>,
  fn: (item: V, key: K) => T | null,
): ReadonlyArray<T> => {
  const array = [];
  for (const [key, value] of initialMap) {
    const result = fn(value, key);
    if (result) {
      array.push(result);
    }
  }
  return array;
};

const isNavalUnit = (unit: Unit) => getEntityGroup(unit) === 'naval';
const isNaval = (entity: Readonly<{ type: EntityType }>) => getEntityInfoGroup(entity) === 'naval';

const rankOdysseusUnitChoices = (
  map: MapData,
  currentPlayer: Player,
  playerUnits: ReadonlyArray<Unit>,
  unitInfos: ReadonlyArray<UnitInfo>,
  cluster: Vector,
) =>
  sortBy(
    unitInfos.map((unitInfo, index) => ({
      unitInfo,
      weight:
        index * 4 + getOdysseusProductionWeight(map, currentPlayer, playerUnits, unitInfo, cluster),
    })),
    ({ weight }) => weight,
  ).map(({ unitInfo }) => unitInfo);

const getOdysseusProductionWeight = (
  map: MapData,
  currentPlayer: Player,
  playerUnits: ReadonlyArray<Unit>,
  unitInfo: UnitInfo,
  cluster: Vector,
) => {
  const ownUnits = Math.max(1, playerUnits.length);
  const sameTypeRatio = playerUnits.filter((unit) => unit.id === unitInfo.id).length / ownUnits;
  const ownLongRangeUnits = playerUnits.filter((unit) => unit.info.isLongRange()).length;
  const enemyUnits = [...map.units.filter((unit) => map.isOpponent(unit, currentPlayer)).values()];
  const enemyLongRangeUnits = enemyUnits.filter((unit) => unit.info.isLongRange()).length;
  const enemyTransports = enemyUnits.filter((unit) => unit.isTransportingUnits()).length;
  const mapArea = map.size.width * map.size.height;
  const capturableBuildings = map.buildings.filter((building, vector) =>
    shouldCaptureBuilding(map, currentPlayer.id, building, vector),
  );

  let weight = 0;

  if (sameTypeRatio > 0.22 && ownUnits > 8) {
    weight += 4;
  }

  if (map.round <= 8 && unitInfo.hasAbility(Ability.Capture) && capturableBuildings.size > 3) {
    weight -=
      cluster.distance(
        minBy(capturableBuildings.keySeq(), (vector) => vector.distance(cluster)) || cluster,
      ) >
      unitInfo.getRadiusFor(currentPlayer) * 2
        ? 1
        : 3;
  }

  if (
    mapArea >= 400 &&
    unitInfo.isLongRange() &&
    ownLongRangeUnits < Math.max(1, Math.ceil(ownUnits / 7))
  ) {
    weight -= 3;
  }

  if (enemyLongRangeUnits && unitInfo.isShortRange() && unitInfo.getRadiusFor(currentPlayer) >= 4) {
    weight -= 2;
  }

  if (enemyTransports && unitInfo.hasAttack() && !unitInfo.isLongRange()) {
    weight -= 1;
  }

  if (
    map.round > 6 &&
    !unitInfo.hasAttack() &&
    !unitInfo.hasAbility(Ability.Capture) &&
    !unitInfo.canTransportUnits()
  ) {
    weight += 5;
  }

  return weight;
};

const chooseOdysseusMove = (
  map: MapData,
  currentPlayer: Player,
  unit: Unit,
  from: Vector,
  to: Vector,
  moveableRadius: ReadonlyMap<Vector, Readonly<{ cost: number; vector: Vector }>>,
  target: Vector,
) => {
  const currentThreat = getOdysseusThreat(map, currentPlayer, unit, to);
  if (currentThreat < 12) {
    return to;
  }

  const currentDistance = to.distance(target);
  const currentScore = getOdysseusMoveScore(map, currentPlayer, unit, to, target);
  let best = to;
  let bestScore = currentScore;

  for (const [vector] of moveableRadius) {
    if (!vector.equals(from) && map.units.has(vector)) {
      continue;
    }

    const distance = vector.distance(target);
    if (distance > currentDistance + 2) {
      continue;
    }

    const score = getOdysseusMoveScore(map, currentPlayer, unit, vector, target);
    if (score < bestScore - 3) {
      best = vector;
      bestScore = score;
    }
  }

  return best;
};

const getOdysseusMoveScore = (
  map: MapData,
  currentPlayer: Player,
  unit: Unit,
  vector: Vector,
  target: Vector,
) => vector.distance(target) * 3 + getOdysseusThreat(map, currentPlayer, unit, vector) * 2;

const getOdysseusThreat = (map: MapData, currentPlayer: Player, unit: Unit, vector: Vector) => {
  let threat = 0;

  for (const [enemyVector, enemy] of map.units) {
    if (!map.isOpponent(enemy, currentPlayer) || !enemy.info.hasAttack()) {
      continue;
    }

    const enemyPlayer = map.getPlayer(enemy);
    const radius = enemy.info.getRadiusFor(enemyPlayer);
    const distance = enemyVector.distance(vector);
    const range = enemy.info.getRangeFor(enemyPlayer);
    const canThreaten = enemy.info.isShortRange()
      ? distance <= radius + 1
      : !!range && distance <= radius + range[1] && distance >= Math.max(1, range[0] - radius);

    if (canThreaten) {
      const cost = enemy.info.getCostFor(enemyPlayer);
      threat += (Number.isFinite(cost) ? cost / 100 : 5) * (enemy.health / MaxHealth);

      if (unit.info.isLongRange() || unit.canCapture(currentPlayer)) {
        threat += 5;
      }
    }
  }

  return threat;
};

const shouldPreferLocalCapture = (map: MapData) =>
  map.size.width <= 18 && map.size.height <= 18 && map.buildings.size > 40;

const getOdysseusCaptureWeight = (
  map: MapData,
  currentPlayer: Player,
  building: Building,
  vector: Vector,
  cost: number,
) => {
  const info = building.info;
  const contestedBonus =
    map.units.some((unit, unitVector) => {
      if (!map.isOpponent(unit, currentPlayer) || !unit.canCapture(map.getPlayer(unit))) {
        return false;
      }
      return unitVector.distance(vector) <= unit.info.getRadiusFor(map.getPlayer(unit)) + 1;
    }) && map.isNeutral(building)
      ? 20
      : 0;

  return (
    getBuildingWeight(info) -
    cost +
    (map.isNeutral(building) ? 0 : 8) +
    (info.isHQ() ? 300 : 0) +
    (info.canBuildUnits() ? 40 : 0) +
    info.configuration.funds / 5 +
    contestedBonus
  );
};

const shouldDevelopBeforeMovement = (map: MapData) =>
  // On compact ranked maps the first player benefits from committing production
  // before spending remaining movement; the second player usually needs to
  // reposition first to avoid blocking lanes around fresh units.
  map.size.width <= 18 && map.size.height <= 18 && map.currentPlayer === map.getFirstPlayerID();

const sortOdysseusPossibleAttacks = (
  map: MapData,
  currentPlayer: Player,
  vision: VisionT,
  possibleAttacks: ReadonlyArray<PossibleAttack>,
): Array<PossibleAttack> =>
  sortBy(
    possibleAttacks.map((attack) => ({
      attack,
      weight:
        getOdysseusAttackWeight(map, currentPlayer, attack) +
        getAttackOutcomeWeight(map, currentPlayer, vision, attack) * 0.25,
    })),
    ({ weight }) => weight,
  ).map(({ attack }) => attack);

const getOdysseusAttackWeight = (map: MapData, currentPlayer: Player, item: PossibleAttack) => {
  const { entityB, vector } = item;
  const targetPlayer = entityB.player > 0 ? map.getPlayer(entityB) : null;
  const targetCost = (entityB.info as UnitInfo | BuildingInfo).getCostFor(targetPlayer);
  const finiteTargetCost = Number.isFinite(targetCost) ? targetCost : 0;
  const targetBuilding = map.buildings.get(vector);
  const isStructure =
    entityB.info.type === EntityType.Building || entityB.info.type === EntityType.Structure;
  const longRangeTarget = !isStructure && (entityB as Unit).info?.isLongRange?.() ? 40 : 0;
  const loadedTransport = !isStructure && (entityB as Unit).isTransportingUnits?.() ? 40 : 0;
  const captureThreat =
    !isStructure && targetBuilding && (entityB as Unit).canCapture?.(targetPlayer || currentPlayer)
      ? targetBuilding.info.isHQ()
        ? 120
        : 50
      : 0;
  const productionBuilding =
    isStructure && targetBuilding?.canBuildUnits(targetPlayer || currentPlayer) ? 50 : 0;
  const killLikelyBonus = item.getWeight() >= MaxHealth ? finiteTargetCost / 10 : 0;
  const longRangeAttackerBonus = item.unitA.info.isLongRange() ? 10 : 0;

  return (
    item.getWeight() +
    finiteTargetCost / 40 +
    killLikelyBonus +
    longRangeTarget +
    loadedTransport +
    captureThreat +
    productionBuilding +
    longRangeAttackerBonus
  );
};

const getAttackOutcomeWeight = (
  map: MapData,
  currentPlayer: Player,
  vision: VisionT,
  attackOption: PossibleAttack,
) => {
  const { entityB, from, parent, sabotage, to, unitA } = attackOption;
  let currentMap = map;
  let attackFrom = from;

  if (
    (unitA.info.isShortRange() || unitA.info.canAct(map.getPlayer(unitA))) &&
    from.distance(parent) >= 1
  ) {
    const moveResult = execute(currentMap, vision, MoveAction(from, parent));
    if (!moveResult) {
      return Number.NEGATIVE_INFINITY;
    }
    [, currentMap] = moveResult;
    attackFrom = parent;
  }

  const attackResult = execute(
    currentMap,
    vision,
    sabotage
      ? SabotageAction(attackFrom, to.vector)
      : entityB.info.type === EntityType.Building || entityB.info.type === EntityType.Structure
        ? AttackBuildingAction(attackFrom, to.vector)
        : AttackUnitAction(attackFrom, to.vector),
  );
  if (!attackResult) {
    return Number.NEGATIVE_INFINITY;
  }

  return (
    getBoardValueForPlayer(attackResult[1], currentPlayer) -
    getBoardValueForPlayer(map, currentPlayer)
  );
};

const getBoardValueForPlayer = (map: MapData, player: Player) => {
  let value = 0;

  for (const [, unit] of map.units) {
    const cost = unit.info.getCostFor(map.getPlayer(unit));
    const unitValue = (Number.isFinite(cost) ? cost : 500) * (unit.health / MaxHealth);
    value += map.matchesTeam(unit, player) ? unitValue : -unitValue;
  }

  for (const [vector, building] of map.buildings) {
    if (building.player === 0) {
      continue;
    }

    const funds = building.info.configuration.funds || 0;
    const production = building.canBuildUnits(map.getPlayer(building)) ? 700 : 0;
    const hq = building.info.isHQ() ? 2500 : 0;
    const buildingValue = funds * 8 + production + hq + building.health;
    const unit = map.units.get(vector);
    const capturePressure =
      unit && unit.canCapture(map.getPlayer(unit)) && map.isOpponent(unit, building) ? 450 : 0;
    value += map.matchesTeam(building, player)
      ? buildingValue - capturePressure
      : -buildingValue + capturePressure;
  }

  for (const currentPlayer of map.getPlayers()) {
    value += map.matchesTeam(currentPlayer, player)
      ? currentPlayer.funds / 4
      : -currentPlayer.funds / 4;
  }

  return value;
};

const shouldBuildNavalUnits = (
  map: MapData,
  currentPlayer: Player,
  playerUnits: ReadonlyArray<Unit>,
) => {
  if (!playerUnits.length) {
    return true;
  }

  const playerNavalUnits = playerUnits.filter(isNavalUnit).length;
  const playerNavalRatio = playerNavalUnits / playerUnits.length;
  if (playerNavalRatio < 0.3) {
    return true;
  }

  const opposingUnits = map.units.filter((unit) => map.isOpponent(unit, currentPlayer));
  const opposingNavalUnits = opposingUnits.filter(isNavalUnit).size;
  return !opposingUnits.size || opposingNavalUnits / opposingUnits.size > playerNavalRatio - 0.2;
};

const hasTooManyOfType = (units: ReadonlyArray<Unit>, unitInfo: UnitInfo) =>
  units.length > 10 && units.filter(({ id }) => id === unitInfo.id).length / units.length > 0.2;
