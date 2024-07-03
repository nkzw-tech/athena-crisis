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
  MoveAction,
  RescueAction,
  SabotageAction,
  SupplyAction,
  ToggleLightningAction,
  UnfoldAction,
} from '@deities/apollo/action-mutators/ActionMutators.tsx';
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
import canBuild from '@deities/athena/lib/canBuild.tsx';
import canDeploy from '@deities/athena/lib/canDeploy.tsx';
import determineUnitsToCreate from '@deities/athena/lib/determineUnitsToCreate.tsx';
import getDeployableVectors from '@deities/athena/lib/getDeployableVectors.tsx';
import getRescuableVectors from '@deities/athena/lib/getRescuableVectors.tsx';
import getUnitsToRefill from '@deities/athena/lib/getUnitsToRefill.tsx';
import hasUnitsOrProductionBuildings from '@deities/athena/lib/hasUnitsOrProductionBuildings.tsx';
import { AIBehavior } from '@deities/athena/map/AIBehavior.tsx';
import Building from '@deities/athena/map/Building.tsx';
import { Charge } from '@deities/athena/map/Configuration.tsx';
import {
  EntityType,
  getEntityGroup,
  getEntityInfoGroup,
} from '@deities/athena/map/Entity.tsx';
import Player, { PlayerID } from '@deities/athena/map/Player.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { getOpponentPriorityLabels } from '@deities/athena/Objectives.tsx';
import { moveable } from '@deities/athena/Radius.tsx';
import groupBy from '@deities/hephaestus/groupBy.tsx';
import maxBy from '@deities/hephaestus/maxBy.tsx';
import minBy from '@deities/hephaestus/minBy.tsx';
import randomEntry from '@deities/hephaestus/randomEntry.tsx';
import sortBy from '@deities/hephaestus/sortBy.tsx';
import BaseAI from './BaseAI.tsx';
import estimateClosestTarget from './lib/estimateClosestTarget.tsx';
import findPathToTarget from './lib/findPathToTarget.tsx';
import getAttackableUnitsWithinRadius from './lib/getAttackableUnitsWithinRadius.tsx';
import getBuildingWeight from './lib/getBuildingWeight.tsx';
import getInterestingVectors from './lib/getInterestingVectors.tsx';
import getInterestingVectorsByAbilities from './lib/getInterestingVectorsByAbilities.tsx';
import getPossibleAttacks from './lib/getPossibleAttacks.tsx';
import getPossibleUnitAbilities, {
  getPossibleUnitAbilitiesForBuildings,
} from './lib/getPossibleUnitAbilities.tsx';
import getUnitInfosWithMaxVision from './lib/getUnitInfosWithMaxVision.tsx';
import needsSupply from './lib/needsSupply.tsx';
import shouldAttack from './lib/shouldAttack.tsx';
import shouldCaptureBuilding from './lib/shouldCaptureBuilding.tsx';
import sortByDamage from './lib/sortByDamage.tsx';
import sortPossibleAttacks from './lib/sortPossibleAttacks.tsx';

type CreateUnitCombination = {
  from: Vector;
  to: Vector;
  unitInfo: UnitInfo;
  weight: number;
};

// DionysusAlpha is the first AI, and it is the most aggressive one.
// At each turn, it checks which unit can do the most damage to another unit and then attacks.
export default class DionysusAlpha extends BaseAI {
  protected action(map: MapData): MapData | null {
    return (
      this.activatePower(map) ||
      this.finishCapture(map) ||
      this.finishRescue(map) ||
      this.toggleLightning(map) ||
      this.rescue(map) ||
      this.attack(map) ||
      this.capture(map) ||
      this.fold(map) ||
      this.createBuilding(map) ||
      this.move(map) ||
      this.unfold(map) ||
      this.buySkills(map) ||
      this.createUnit(map) ||
      this.endTurn(map)
    );
  }

  private attacksDone = false;
  private tryAttacking() {
    // Unset the `attacksDone` state to attempt an attack in the next loop.
    this.attacksDone = false;
  }

  private activatePower(map: MapData): MapData | null {
    const { activeSkills, charge, skills } = map.getCurrentPlayer();

    if (!skills.size || charge < Charge) {
      return null;
    }

    const potentialSkills = [];
    for (const skill of skills) {
      if (activeSkills.has(skill)) {
        continue;
      }

      const { charges } = getSkillConfig(skill);
      if (charges && charges * Charge <= charge) {
        potentialSkills.push([skill, charges]);
      }
    }

    if (potentialSkills.length) {
      const [skill] = randomEntry(potentialSkills);
      const currentMap = this.execute(map, ActivatePowerAction(skill));
      if (currentMap) {
        this.tryAttacking();
      }
      return currentMap;
    }

    return null;
  }

  private attack(map: MapData): MapData | null {
    if (this.attacksDone) {
      return null;
    }

    const currentPlayer = map.getCurrentPlayer();
    const vision = this.getVision(map);
    const labelsToPrioritize = getOpponentPriorityLabels(
      map.config.objectives,
      currentPlayer.id,
    );
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
    ).sort(sortPossibleAttacks);

    if (!possibleAttacks.length) {
      this.attacksDone = true;
      return null;
    }

    let currentMap: MapData | null = map;
    while (possibleAttacks.length) {
      const attackOption = possibleAttacks.pop();
      if (!currentMap || !attackOption) {
        return null;
      }

      let hasMoved = false;
      let { from } = attackOption;
      const { entityB, parent, sabotage, to, unitA } = attackOption;
      if (
        (unitA.info.isShortRange() ||
          unitA.info.canAct(map.getPlayer(unitA))) &&
        from.distance(parent) >= 1
      ) {
        let isBlocked;
        [currentMap, isBlocked] = this.executeMove(
          currentMap,
          MoveAction(from, parent),
        );
        if (isBlocked) {
          return currentMap;
        }

        if (!currentMap) {
          throw new Error('Error executing unit move.');
        }
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
            [...dirtyUnits].map((vector) => [vector, map.units.get(vector)!]),
            labelsToPrioritize,
          ),
        ].sort(sortPossibleAttacks);
      }
    }
    return currentMap;
  }

  private finishCapture(map: MapData): MapData | null {
    const currentPlayer = map.getCurrentPlayer();
    const [from, unit] =
      map.units.findEntry(
        (unit) =>
          unit.isCapturing() &&
          !unit.isCompleted() &&
          map.matchesPlayer(currentPlayer, unit),
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
        unit.info.hasAbility(Ability.Capture),
    );

    if (!units.size) {
      return null;
    }

    // Find a unit that can capture a building based on weight.
    for (const [from, unit] of units) {
      const { to } =
        (shouldMove(unit) &&
          maxBy(
            filterMap(
              moveable(
                this.applyVision(map),
                unit,
                from,
                undefined,
                undefined,
                true,
              ),
              ({ cost, vector }) => {
                const building = map.buildings.get(vector);
                const info = building?.info;
                return info &&
                  map.isOpponent(unit, building) &&
                  (vector.equals(from) || !map.units.has(vector))
                  ? {
                      to: vector,
                      weight:
                        getBuildingWeight(info) -
                        cost +
                        (map.isNeutral(building) ? 0 : 5),
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

      const [currentMap, isBlocked] = this.executeMove(
        map,
        MoveAction(from, to),
      );
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
      const to = [...rescuable].find(
        (vector) => map.units.get(vector)?.isBeingRescuedBy(unit.player),
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
          [
            ...moveable(
              this.applyVision(map),
              unit,
              from,
              undefined,
              undefined,
              true,
            ),
          ].flatMap(([, { cost, vector }]) => {
            const vectors: Array<
              Readonly<{ parent: Vector; to: Vector; weight: number }>
            > = [];
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
          }),
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

    const [currentMap, isBlocked] = this.executeMove(
      map,
      MoveAction(from, parent),
    );
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
  private getCanBuildFundsBuildings(
    map: MapData,
    player: Player,
    exampleVector: Vector,
  ) {
    if (this._canBuildFundsBuildings === null) {
      const check = (vector: Vector) => {
        for (const building of getAllBuildings()) {
          if (
            building.configuration.funds > 0 &&
            !map.config.blocklistedBuildings.has(building.id) &&
            building.configuration.cost < Number.POSITIVE_INFINITY &&
            canBuild(map, building, player, vector)
          ) {
            return true;
          }
        }
        return false;
      };

      this._canBuildFundsBuildings =
        !map.config.blocklistedBuildings.size ||
        check(exampleVector) ||
        map.reduceEachField((canBuildFundsBuilding, vector) => {
          if (canBuildFundsBuilding) {
            return true;
          }

          if (
            !BuildableTiles.has(map.getTileInfo(vector)) ||
            map.buildings.get(vector)
          ) {
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
    const getFunds = () =>
      _funds == null ? (_funds = calculateFunds(map, currentPlayer)) : _funds;

    let _allowAnyBuilding: boolean | null = null;
    const getAllowAnyBuilding = () =>
      _allowAnyBuilding === null
        ? (_allowAnyBuilding = hasUnitsOrProductionBuildings(
            map,
            currentPlayer,
          ))
        : _allowAnyBuilding;

    const shouldBuild = (info: BuildingInfo) =>
      getAllowAnyBuilding()
        ? info.configuration.funds > 0 ||
          getFunds() > 0 ||
          !this.getCanBuildFundsBuildings(map, currentPlayer, from)
        : info.canBuildUnits();

    // Find a building to construct based on importance.
    const { info, to } =
      maxBy(
        filterMap(
          moveable(
            this.applyVision(map),
            unit,
            from,
            undefined,
            undefined,
            true,
          ),
          (item) => {
            const tile = map.getTileInfo(item.vector);
            if (!BuildableTiles.has(tile)) {
              return null;
            }

            const currentUnit = map.units.get(item.vector);
            if (
              map.buildings.has(item.vector) ||
              (currentUnit && !from.equals(item.vector))
            ) {
              return null;
            }

            const buildingInfos = filterBuildings(
              (info) =>
                info.configuration.cost <= currentPlayer.funds &&
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

            const productionBuildings =
              buildingPartition.get('production') || [];
            const fundBuildings = buildingPartition.get('funds') || [];

            const shouldBuildFundsBuilding =
              productionBuildings.length &&
              fundBuildings.length / 3 < productionBuildings.length;

            const radarBuilding = buildingInfos.find((info) =>
              info.hasBehavior(Behavior.Radar),
            );
            const shouldBuildRadar =
              radarBuilding &&
              !userBuildings.some((building) =>
                building.info.hasBehavior(Behavior.Radar),
              ) &&
              map.reduceEachField(
                (hasLightning, vector) =>
                  map.getTileInfo(vector) === Lightning ? true : hasLightning,
                false,
              );
            const info = shouldBuildRadar
              ? radarBuilding
              : randomEntry(
                  buildingInfos.filter((info) =>
                    shouldBuildFundsBuilding
                      ? info.configuration.funds > 0
                      : info.configuration.funds === 0 &&
                        !info.getAllBuildableUnits()[Symbol.iterator]().next()
                          .done,
                  ),
                ) || buildingInfos[0];

            if (info) {
              return {
                info,
                to: item.vector,
                weight:
                  -item.vector.distance(from) *
                  (userBuildings.some((building) => building.info === info)
                    ? 0.5
                    : 1),
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
      [currentMap, isBlocked] = this.executeMove(
        currentMap,
        MoveAction(from, to),
      );
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
        cost != null &&
        cost > 0 &&
        cost <= currentPlayer.funds &&
        !currentPlayer.skills.has(skill)
      );
    });

    if (buyableSkills.length) {
      const skill = randomEntry(buyableSkills);
      return this.execute(map, BuySkillAction(from, skill));
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
      ...map.units
        .filter((unit) => map.matchesPlayer(unit, currentPlayer))
        .values(),
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
    const getClusters = (
      building: Building,
      unitInfos: ReadonlyArray<UnitInfo>,
    ) => {
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
                  (map.round > 3 && !((map.round + 3) % 6)
                    ? Math.min(buildings.size - 1, 3)
                    : 1) &&
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
          unitInfos[0].getCostFor(currentPlayer) ===
            calculateFunds(map, currentPlayer) &&
          playerUnits.filter((unit) => unit.id === unitInfos[0].id).length >=
            Math.ceil((map.size.width * map.size.height) / 100))
      ) {
        continue;
      }

      const clusters = getClusters(building, unitInfos);
      if (!clusters.length) {
        const unitInfo = minBy(unitInfos, (info) =>
          info.getCostFor(currentPlayer),
        );
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
          minBy(
            getDeployableVectors(map, unitInfo, from, currentPlayer.id),
            (vector) => vector.distance(newCluster),
          );
        if (to) {
          const [item] = estimateClosestTarget(
            map,
            unitInfo.create(currentPlayer),
            newCluster,
            to,
            true,
          );
          combinations.push({
            from,
            to,
            unitInfo,
            weight: item?.cost || 0,
          });
        }
        continue;
      }

      const cluster =
        minBy(clusters, (cluster) => from.distance(cluster)) || clusters[0];
      const unitInfo = getBestUnit(
        map.config.fog &&
          (map.round === 3 || (map.round > 4 && !(map.round % 4)))
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
      );
      const to = minBy(
        getDeployableVectors(map, unitInfo, from, currentPlayer.id),
        (vector) => vector.distance(cluster),
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
            (unitInfo.canTransportUnits() ||
              unitInfo.hasAbility(Ability.Supply)))
        ) {
          combinations.push({
            from,
            to,
            unitInfo,
            weight:
              (item?.cost || 0) +
              (avoidNavalUnits && isNaval(unitInfo) ? 10 : 0),
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
            ...map.units
              .filter((unit) => map.isOpponent(unit, currentPlayer))
              .keys(),
            ...map.buildings
              .filter((building) => map.isOpponent(building, currentPlayer))
              .keys(),
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
        unit.info.canAttackAt(
          from.distance(target),
          unit.info.getRangeFor(currentPlayer),
        )
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
      (unit) =>
        shouldMove(unit) &&
        !unit.isCapturing() &&
        map.matchesPlayer(currentPlayer, unit),
    );

    const supplyEntry = units.findEntry((unit) =>
      unit.info.abilities.has(Ability.Supply),
    );
    const [from, unit] =
      // Prioritize units with supply ability.
      (supplyEntry &&
        map.units.filter(
          (unit) => map.matchesPlayer(currentPlayer, unit) && needsSupply(unit),
        ).size &&
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
    const clusters = calculateClusters(
      map.size,
      getInterestingVectors(map, from, unit),
    );

    const [target, radiusToTarget, isObstructed, realTarget] =
      estimateClosestTarget(mapWithVision, unit, from, clusters);
    const moveableRadius = moveable(mapWithVision, unit, from);
    let to =
      target &&
      findPathToTarget(
        mapWithVision,
        unit,
        target,
        moveableRadius,
        radiusToTarget,
        true,
      );
    let currentMap: MapData | null = map,
      isBlocked;

    if (
      !to ||
      isObstructed ||
      clusters.every(
        (vector) =>
          vector.distance(from!) >
          unit.info.getRadiusFor(map.getPlayer(unit)) * 2.5,
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

    if (to) {
      [currentMap, isBlocked] = this.executeMove(
        currentMap,
        MoveAction(from, to),
      );
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

  private maybeDropUnit(
    currentMap: MapData | null,
    position: Vector,
    target?: Vector | null,
  ) {
    if (!currentMap) {
      return null;
    }

    const unit = currentMap.units.get(position);
    if (
      unit &&
      target &&
      unit.isTransportingUnits() &&
      unit.info.canDropFrom(currentMap.getTileInfo(position))
    ) {
      const player = currentMap.getCurrentPlayer();
      const isNaval = isNavalUnit(unit);
      for (let index = unit.transports.length - 1; index >= 0; index--) {
        const transportedUnit = unit.transports[index];
        const multiplier = isNaval ? 2.5 : 1.5;
        if (
          target.distance(position) >
          transportedUnit.info.getRadiusFor(
            currentMap.getPlayer(transportedUnit),
          ) *
            multiplier
        ) {
          continue;
        }

        const dropTo = minBy(
          position
            .adjacent()
            .filter((vector) =>
              canDeploy(
                currentMap!,
                transportedUnit.info,
                vector,
                player.skills.has(Skill.NoUnitRestrictions),
              ),
            ),
          (vector) => vector.distance(target),
        );

        if (dropTo) {
          currentMap = this.execute(
            currentMap,
            DropUnitAction(position, index, dropTo),
          );
          if (!currentMap) {
            throw new Error('Error executing unit drop.');
          }
        }
      }
    }

    return currentMap;
  }

  private actionsAfterMove(
    currentMap: MapData | null,
    position: Vector,
    target?: Vector | null,
  ) {
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
      getUnitsToRefill(
        currentMap,
        this.getVision(currentMap),
        currentMap.getPlayer(unit),
        position,
      ).size > 0
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
      unit.info.hasAbility(Ability.Capture) &&
      !unit.info.hasAttack()
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

    const fields = map.reduceEachField<Array<Vector>>((fields, vector) => {
      return map.getTileInfo(vector) === Lightning
        ? [...fields, vector]
        : fields;
    }, []);

    if (!fields.length) {
      return this.execute(map, CompleteBuildingAction(from));
    }

    return this.execute(map, ToggleLightningAction(from, fields[0]));
  }
}

const canUnfold = (map: MapData, unit: Unit) =>
  unit.info.hasAbility(Ability.Unfold) &&
  !unit.isCompleted() &&
  !unit.isUnfolded() &&
  map.matchesPlayer(map.getCurrentPlayer(), unit);

const shouldMove = (unit: Unit) =>
  unit.canMove() && !unit.matchesBehavior(AIBehavior.Stay);

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
const isNaval = (entity: Readonly<{ type: EntityType }>) =>
  getEntityInfoGroup(entity) === 'naval';

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

  const opposingUnits = map.units.filter((unit) =>
    map.isOpponent(unit, currentPlayer),
  );
  const opposingNavalUnits = opposingUnits.filter(isNavalUnit).size;
  return (
    !opposingUnits.size ||
    opposingNavalUnits / opposingUnits.size > playerNavalRatio - 0.15
  );
};

const hasTooManyOfType = (units: ReadonlyArray<Unit>, unitInfo: UnitInfo) =>
  units.length > 10 &&
  units.filter(({ id }) => id === unitInfo.id).length / units.length > 0.2;
