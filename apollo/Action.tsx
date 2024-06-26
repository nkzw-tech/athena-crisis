import { Behavior, getBuildingInfo } from '@deities/athena/info/Building.tsx';
import {
  getSkillConfig,
  hasCounterAttackSkill,
  Skill,
} from '@deities/athena/info/Skill.tsx';
import { Lightning } from '@deities/athena/info/Tile.tsx';
import { Ability, getUnitInfo, Weapon } from '@deities/athena/info/Unit.tsx';
import { getDeterministicUnitName } from '@deities/athena/info/UnitNames.tsx';
import assignDeterministicUnitNames from '@deities/athena/lib/assignDeterministicUnitNames.tsx';
import calculateDamage from '@deities/athena/lib/calculateDamage.tsx';
import calculateFunds from '@deities/athena/lib/calculateFunds.tsx';
import canBuild from '@deities/athena/lib/canBuild.tsx';
import canDeploy from '@deities/athena/lib/canDeploy.tsx';
import canLoad from '@deities/athena/lib/canLoad.tsx';
import canPlaceLightning from '@deities/athena/lib/canPlaceLightning.tsx';
import canPlaceRailTrack from '@deities/athena/lib/canPlaceRailTrack.tsx';
import followMovementPath from '@deities/athena/lib/followMovementPath.tsx';
import getAttackStatusEffect from '@deities/athena/lib/getAttackStatusEffect.tsx';
import getChargeValue from '@deities/athena/lib/getChargeValue.tsx';
import getDefenseStatusEffect from '@deities/athena/lib/getDefenseStatusEffect.tsx';
import getHealableVectors from '@deities/athena/lib/getHealableVectors.tsx';
import getHealCost from '@deities/athena/lib/getHealCost.tsx';
import getMovementPath from '@deities/athena/lib/getMovementPath.tsx';
import getRescuableVectors from '@deities/athena/lib/getRescuableVectors.tsx';
import getSabotageableVectors from '@deities/athena/lib/getSabotageableVectors.tsx';
import getUnitsToRefill from '@deities/athena/lib/getUnitsToRefill.tsx';
import hasUnitsOrProductionBuildings from '@deities/athena/lib/hasUnitsOrProductionBuildings.tsx';
import maybeCreatePlayers from '@deities/athena/lib/maybeCreatePlayers.tsx';
import { AIBehavior } from '@deities/athena/map/AIBehavior.tsx';
import Building from '@deities/athena/map/Building.tsx';
import {
  BuildingCover,
  Charge,
  CounterAttack,
  CreateTracksCost,
  MinDamage,
  RaisedCounterAttack,
} from '@deities/athena/map/Configuration.tsx';
import {
  DynamicPlayerID,
  PlayerID,
  resolveDynamicPlayerID,
} from '@deities/athena/map/Player.tsx';
import { Teams } from '@deities/athena/map/Team.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { getPathCost, moveable } from '@deities/athena/Radius.tsx';
import { VisionT } from '@deities/athena/Vision.tsx';
import ImmutableMap from '@nkzw/immutable-map';
import { ActionResponse } from './ActionResponse.tsx';
import applyActionResponse from './actions/applyActionResponse.tsx';

export type MutateActionResponseFn = (action: ActionResponse) => ActionResponse;

export type MoveAction = Readonly<{
  complete?: boolean;
  from: Vector;
  path?: ReadonlyArray<Vector>;
  to: Vector;
  type: 'Move';
}>;

type AttackUnitAction = Readonly<{
  from: Vector;
  to: Vector;
  type: 'AttackUnit';
}>;

type AttackBuildingAction = Readonly<{
  from: Vector;
  to: Vector;
  type: 'AttackBuilding';
}>;

type CaptureAction = Readonly<{
  from: Vector;
  type: 'Capture';
}>;

type SupplyAction = Readonly<{
  from: Vector;
  type: 'Supply';
}>;

type CreateUnitAction = Readonly<{
  from: Vector;
  id: number;
  to: Vector;
  type: 'CreateUnit';
}>;

type DropUnitAction = Readonly<{
  from: Vector;
  index: number;
  to: Vector;
  type: 'DropUnit';
}>;

type CreateBuildingAction = Readonly<{
  from: Vector;
  id: number;
  type: 'CreateBuilding';
}>;

type CreateTracksAction = Readonly<{
  from: Vector;
  type: 'CreateTracks';
}>;

type FoldAction = Readonly<{
  from: Vector;
  type: 'Fold';
}>;

type UnfoldAction = Readonly<{
  from: Vector;
  type: 'Unfold';
}>;

type CompleteUnitAction = Readonly<{
  from: Vector;
  type: 'CompleteUnit';
}>;

type CompleteBuildingAction = Readonly<{
  from: Vector;
  type: 'CompleteBuilding';
}>;

type EndTurnAction = Readonly<{
  type: 'EndTurn';
}>;

type MessageAction = Readonly<{
  message: string;
  player?: PlayerID;
  type: 'Message';
}>;

type ToggleLightningAction = Readonly<{
  from: Vector;
  to: Vector;
  type: 'ToggleLightning';
}>;

type HealAction = Readonly<{
  from: Vector;
  to: Vector;
  type: 'Heal';
}>;

type RescueAction = Readonly<{
  from: Vector;
  to: Vector;
  type: 'Rescue';
}>;

type SabotageAction = Readonly<{
  from: Vector;
  to: Vector;
  type: 'Sabotage';
}>;

export type SpawnEffectAction = Readonly<{
  player?: DynamicPlayerID;
  teams?: Teams;
  type: 'SpawnEffect';
  units: ImmutableMap<Vector, Unit>;
}>;

type BuySkillAction = Readonly<{
  from: Vector;
  skill: Skill;
  type: 'BuySkill';
}>;

type ActivatePowerAction = Readonly<{ skill: Skill; type: 'ActivatePower' }>;

export type CharacterMessageEffectAction = Readonly<{
  message: string;
  player: DynamicPlayerID;
  type: 'CharacterMessageEffect';
  unitId: number;
  variant?: number;
}>;

type StartAction = Readonly<{
  type: 'Start';
}>;

export type Action =
  | ActivatePowerAction
  | AttackBuildingAction
  | AttackUnitAction
  | BuySkillAction
  | CaptureAction
  | CompleteBuildingAction
  | CompleteUnitAction
  | CreateBuildingAction
  | CreateTracksAction
  | CreateUnitAction
  | DropUnitAction
  | EndTurnAction
  | FoldAction
  | HealAction
  | MessageAction
  | MoveAction
  | RescueAction
  | SabotageAction
  | StartAction
  | SupplyAction
  | ToggleLightningAction
  | UnfoldAction
  // Effects
  | CharacterMessageEffectAction
  | SpawnEffectAction;

export type Actions = ReadonlyArray<Action>;

function move(
  map: MapData,
  vision: VisionT,
  { complete, from, path: initialPath, to }: MoveAction,
  isEffect: boolean,
) {
  const unitA = map.units.get(from);
  if (!unitA || from.equals(to) || !map.contains(to)) {
    return null;
  }

  if (!isEffect && (!map.isCurrentPlayer(unitA) || !unitA.canMove())) {
    return null;
  }

  const mapWithVision = vision.apply(map);
  const lastVector = initialPath?.at(-1);
  if (lastVector && !to.equals(lastVector)) {
    return null;
  }

  const infoA = unitA.info;
  const fields = moveable(mapWithVision, unitA, from);
  const { blockedBy, path } = initialPath?.length
    ? followMovementPath(map, initialPath, vision)
    : getMovementPath(map, to, fields, vision);
  if (blockedBy) {
    const lastItem = path.at(-1);
    if (!lastItem) {
      return null;
    }
    to = lastItem;
  }
  const radiusItem = fields.get(to);
  if (!radiusItem) {
    return null;
  }

  const cost = initialPath?.length
    ? getPathCost(mapWithVision, unitA, from, initialPath)
    : radiusItem.cost;

  if (cost === -1) {
    return null;
  }

  const unitB = map.units.get(to);
  if (unitB) {
    if (canLoad(map, unitB, unitA, to)) {
      return {
        from,
        fuel: unitA.fuel - cost,
        path,
        to,
        type: 'Move',
      } as const;
    }
  } else if (
    !map.buildings.has(to) ||
    infoA.hasAbility(Ability.AccessBuildings)
  ) {
    return {
      ...(blockedBy || complete ? { completed: true } : null),
      from,
      fuel: unitA.fuel - cost,
      path,
      to,
      type: 'Move',
    } as const;
  }

  return null;
}

function _attackUnit(
  map: MapData,
  unitA: Unit,
  unitB: Unit,
  weapon: Weapon,
  vectorA: Vector,
  vectorB: Vector,
  modifier = 1,
): [Unit, Unit] {
  const luck = 1;
  const tileInfoA = map.getTileInfo(vectorA);
  const tileInfoB = map.getTileInfo(vectorB);
  const damage = Math.floor(
    Math.max(
      MinDamage,
      calculateDamage(
        unitA,
        unitB,
        weapon,
        tileInfoA.configuration.cover +
          (map.buildings.has(vectorA) ? BuildingCover : 0),
        tileInfoB.configuration.cover +
          (map.buildings.has(vectorB) ? BuildingCover : 0),
        getAttackStatusEffect(map, unitA, tileInfoA),
        getDefenseStatusEffect(map, unitB, tileInfoB),
        luck,
      ) * modifier,
    ),
  );
  return [unitA.subtractAmmo(weapon), unitB.modifyHealth(-damage)];
}

function _attackBuilding(
  map: MapData,
  unitA: Unit,
  buildingB: Building,
  weapon: Weapon,
  vectorA: Vector,
  vectorB: Vector,
): [Unit, Building] {
  const luck = 1;
  const tileInfoA = map.getTileInfo(vectorA);
  const tileInfoB = map.getTileInfo(vectorB);
  const damage = Math.floor(
    calculateDamage(
      unitA,
      buildingB,
      weapon,
      tileInfoA.configuration.cover +
        (map.buildings.has(vectorA) ? BuildingCover : 0),
      tileInfoB.configuration.cover + BuildingCover,
      getAttackStatusEffect(map, unitA, tileInfoA),
      getDefenseStatusEffect(map, buildingB, tileInfoB),
      luck,
    ),
  );
  return [unitA.subtractAmmo(weapon), buildingB.modifyHealth(-damage)];
}

function _counterAttack(
  map: MapData,
  unitA: Unit,
  unitB: Unit,
  vA: Vector,
  vB: Vector,
  previousHealth = unitB.health,
): [Unit, Unit] | null {
  const distance = vA.distance(vB);
  const playerB = map.getPlayer(unitB);
  const weaponB = unitB.getAttackWeapon(unitA);
  if (
    distance == 1 &&
    !unitB.isDead() &&
    unitB.canAttackAt(distance, playerB) &&
    weaponB &&
    weaponB.getDamage(unitA) > 0
  ) {
    const hasCounterAttackPower = hasCounterAttackSkill(playerB.activeSkills);
    const counterAttack = hasCounterAttackPower
      ? 1
      : hasCounterAttackSkill(playerB.skills)
        ? RaisedCounterAttack
        : CounterAttack;

    const [a, b] = _attackUnit(
      map,
      hasCounterAttackPower ? unitB.setHealth(previousHealth) : unitB,
      unitA,
      weaponB,
      vB,
      vA,
      counterAttack,
    );
    return [b, unitB.setAmmo(a.ammo)];
  }
  return null;
}

function attackUnit(
  map: MapData,
  vision: VisionT,
  { from, to }: AttackUnitAction,
) {
  const unitA = map.units.get(from);
  const unitB = map.units.get(to);
  const playerA = unitA && map.getPlayer(unitA);
  if (
    unitA &&
    unitB &&
    playerA &&
    map.isCurrentPlayer(unitA) &&
    map.isOpponent(unitA, unitB) &&
    !unitA.isCompleted() &&
    unitA.canAttackAt(from.distance(to), playerA) &&
    vision.isVisible(map, to)
  ) {
    const weaponA = unitA.getAttackWeapon(unitB);
    if (!weaponA || weaponA.getDamage(unitB) <= 0) {
      return null;
    }

    let [a, b] = _attackUnit(map, unitA, unitB, weaponA, from, to);
    const counter =
      unitB.player > 0
        ? _counterAttack(map, a, b, from, to, unitB.health)
        : null;
    if (counter) {
      [a, b] = counter;
    }

    const playerB = map.getPlayer(unitB);
    return {
      chargeA:
        playerA.charge +
        getChargeValue(unitB, playerB, b, 0.33) +
        (counter ? getChargeValue(unitA, playerA, a) : 0),
      chargeB:
        unitB.player > 0
          ? playerB.charge + getChargeValue(unitB, playerB, b)
          : undefined,
      from,
      hasCounterAttack: !!counter,
      playerA: a.player,
      playerB: b.player,
      to,
      type: 'AttackUnit',
      unitA: a.isDead() ? undefined : a.dry(),
      unitB: b.isDead() ? undefined : b.dry(),
    } as const;
  }
  return null;
}

function attackBuilding(
  map: MapData,
  vision: VisionT,
  { from, to }: AttackBuildingAction,
) {
  const unitA = map.units.get(from);
  const buildingB = map.buildings.get(to);
  if (!unitA || !buildingB) {
    return null;
  }

  const playerA = map.getPlayer(unitA);
  const unitC = map.units.get(to);
  if (
    map.isCurrentPlayer(unitA) &&
    map.isOpponent(unitA, buildingB) &&
    !unitA.isCompleted() &&
    unitA.canAttackAt(from.distance(to), playerA) &&
    (!unitC || map.isOpponent(unitC, unitA)) &&
    vision.isVisible(map, to)
  ) {
    const weaponA = unitA.getAttackWeapon(buildingB);
    if (!weaponA || weaponA.getDamage(buildingB) <= 0) {
      return null;
    }

    const result = _attackBuilding(map, unitA, buildingB, weaponA, from, to);
    let a = result[0];
    const b = result[1];
    let c: Unit | null = null;
    if (!b.isDead() && unitC) {
      const counter = _counterAttack(map, a, unitC, from, to);
      if (counter) {
        [a, c] = counter;
      }
    }

    const playerB = map.getPlayer(buildingB);
    const playerC = unitC ? map.getPlayer(unitC) : undefined;
    const chargeB =
      buildingB.player > 0
        ? playerB.charge + getChargeValue(buildingB, playerB, b)
        : undefined;
    return {
      building: b.isDead() ? undefined : b,
      chargeA: c
        ? playerA.charge + getChargeValue(unitA, playerA, a, 0.5)
        : undefined,
      chargeB,
      chargeC:
        playerC && unitC
          ? (playerC.id === playerB.id ? chargeB || 0 : playerC.charge) +
            getChargeValue(unitC, playerC, c || unitC.setHealth(0))
          : undefined,
      from,
      hasCounterAttack: !!c,
      playerA: a.player,
      // `playerC` should be provided when `unitC` exists, not when it attacks.
      // That way it can be used to check whether the player lost.
      playerC: unitC ? unitC.player : undefined,
      to,
      type: 'AttackBuilding',
      unitA: a.isDead() ? undefined : a.dry(),
      unitC: c ? c.dry() : undefined,
    } as const;
  }
  return null;
}

function capture(map: MapData, { from }: CaptureAction) {
  const unit = map.units.get(from);
  const buildingA = map.buildings.get(from);
  if (
    unit &&
    buildingA &&
    map.isCurrentPlayer(unit) &&
    map.isOpponent(unit, buildingA) &&
    !unit.isCompleted() &&
    unit.info.hasAbility(Ability.Capture)
  ) {
    return unit.isCapturing()
      ? ({
          building: buildingA.capture(map.getPlayer(unit)),
          from,
          player: buildingA.player,
          type: 'Capture',
        } as const)
      : ({ from, type: 'Capture' } as const);
  }
  return null;
}

function supply(map: MapData, vision: VisionT, { from }: SupplyAction) {
  const unit = map.units.get(from);
  const unitsToSupply =
    unit && getUnitsToRefill(map, vision, map.getPlayer(unit), from);
  if (
    unit &&
    map.isCurrentPlayer(unit) &&
    !unit.isCompleted() &&
    unit.info.hasAbility(Ability.Supply) &&
    unitsToSupply?.size
  ) {
    return { from, player: unit.player, type: 'Supply' } as const;
  }
  return null;
}

function createUnit(
  map: MapData,
  { from, id, to }: CreateUnitAction,
  isEffect: boolean,
) {
  const building = map.buildings.get(from);
  const player = building && map.getPlayer(building);
  const unit = map.units.get(from);
  const infoA = getUnitInfo(id);
  const infoB = building?.info;

  if (
    from.distance(to) <= 1 &&
    building &&
    player &&
    infoA &&
    infoB &&
    canDeploy(map, infoA, to, player.skills.has(Skill.NoUnitRestrictions)) &&
    (!unit || map.matchesTeam(unit, building)) &&
    (isEffect ||
      (map.isCurrentPlayer(building) &&
        !building.isCompleted() &&
        player.funds >= infoA.getCostFor(player) &&
        new Set(building.getBuildableUnits(player)).has(infoA)))
  ) {
    const behavior = building.getFirstAIBehavior();
    const skipBehaviorRotation =
      behavior != null && behavior === AIBehavior.Stay && !infoA.hasAttack();
    return {
      free: isEffect,
      from,
      skipBehaviorRotation,
      to,
      type: 'CreateUnit',
      unit: infoA
        .create(building.player, {
          behavior: skipBehaviorRotation ? undefined : behavior,
          label: building.label,
          name: getDeterministicUnitName(map, from, building.player, infoA),
        })
        .complete(),
    } as const;
  }
  return null;
}

function dropUnit(map: MapData, { from, index, to }: DropUnitAction) {
  const unitA = map.units.get(from);
  const unitB = unitA?.getTransportedUnit(index);
  const infoA = unitA?.info;
  const infoB = unitB?.info;
  if (
    from.distance(to) <= 1 &&
    infoA &&
    infoB &&
    map.isCurrentPlayer(unitA) &&
    !unitA.isCompleted() &&
    unitA.isTransportingUnits() &&
    canDeploy(map, infoB, to, true) &&
    infoA.canDropFrom(map.getTileInfo(from))
  ) {
    return { from, index, to, type: 'DropUnit' } as const;
  }
  return null;
}

function createBuilding(map: MapData, { from, id }: CreateBuildingAction) {
  const unit = map.units.get(from);
  if (!unit) {
    return null;
  }

  const infoB = getBuildingInfo(id);
  const player = map.getPlayer(unit);
  if (
    infoB &&
    map.isCurrentPlayer(unit) &&
    !unit.isCompleted() &&
    !map.buildings.has(from) &&
    unit.info.hasAbility(Ability.CreateBuildings) &&
    player.funds >= infoB.configuration.cost &&
    canBuild(map, infoB, unit.player, from) &&
    (infoB.canBuildUnits() || hasUnitsOrProductionBuildings(map, player))
  ) {
    return {
      building: infoB.create(unit.player, { label: unit.label }).complete(),
      from,
      type: 'CreateBuilding',
    } as const;
  }
  return null;
}

function createTracks(map: MapData, { from }: CreateTracksAction) {
  const unit = map.units.get(from);
  if (!unit) {
    return null;
  }

  if (
    unit.info.hasAbility(Ability.CreateTracks) &&
    map.isCurrentPlayer(unit) &&
    !unit.isCompleted() &&
    map.getPlayer(unit).funds >= CreateTracksCost &&
    canPlaceRailTrack(map, from)
  ) {
    return {
      from,
      type: 'CreateTracks',
    } as const;
  }
  return null;
}

function canFold(map: MapData, position: Vector, type: 'fold' | 'unfold') {
  const unit = map.units.get(position);
  return !!(
    unit &&
    map.isCurrentPlayer(unit) &&
    !unit.isCompleted() &&
    unit.info.hasAbility(Ability.Unfold) &&
    ((type === 'fold' && unit.isUnfolded()) ||
      (type === 'unfold' && !unit.isUnfolded()))
  );
}

function fold(map: MapData, { from }: FoldAction) {
  return canFold(map, from, 'fold') ? ({ from, type: 'Fold' } as const) : null;
}

function unfold(map: MapData, { from }: UnfoldAction) {
  return canFold(map, from, 'unfold')
    ? ({ from, type: 'Unfold' } as const)
    : null;
}

function completeUnit(map: MapData, { from }: CompleteUnitAction) {
  const unit = map.units.get(from);
  return unit && map.isCurrentPlayer(unit) && !unit.isCompleted()
    ? ({ from, type: 'CompleteUnit' } as const)
    : null;
}

function completeBuilding(map: MapData, { from }: CompleteBuildingAction) {
  const building = map.buildings.get(from);
  const unitOnBuilding = map.units.get(from);

  return building &&
    map.isCurrentPlayer(building) &&
    (!unitOnBuilding || map.matchesPlayer(unitOnBuilding, building)) &&
    !building.isCompleted()
    ? ({ from, type: 'CompleteBuilding' } as const)
    : null;
}

function endTurn(map: MapData) {
  const currentPlayer = map.getCurrentPlayer();
  let next = map.getNextPlayer();
  const funds = calculateFunds(map, next);
  const round = map.round + (map.isEndOfRound() ? 1 : 0);
  next = next.modifyFunds(funds);
  return {
    current: { funds: currentPlayer.funds, player: currentPlayer.id },
    next: { funds: next.funds, player: next.id },
    round,
    type: 'EndTurn',
  } as const;
}

function message(_: MapData, { message, player }: MessageAction) {
  return {
    message,
    player,
    type: 'Message',
  } as const;
}

function toggleLightning(map: MapData, { from, to }: ToggleLightningAction) {
  const building = map.buildings.get(from);
  const tile = map.contains(to) && map.getTileInfo(to);

  if (
    from.equals(to) ||
    !building ||
    building.isCompleted() ||
    !map.isCurrentPlayer(building) ||
    map.getCurrentPlayer().charge < Charge
  ) {
    return null;
  }

  return tile === Lightning || canPlaceLightning(map, to)
    ? ({ from, to, type: 'ToggleLightning' } as const)
    : null;
}

function heal(map: MapData, { from, to }: HealAction) {
  const unitA = map.units.get(from);
  const unitB = map.units.get(to);
  const player = unitA && map.getPlayer(unitA);

  if (
    from.equals(to) ||
    !unitA ||
    !unitB ||
    !player ||
    unitA.isCompleted() ||
    !map.isCurrentPlayer(unitA) ||
    !getHealableVectors(map, from).has(to) ||
    getHealCost(unitB, player) > map.getPlayer(unitA).funds
  ) {
    return null;
  }

  return { from, to, type: 'Heal' } as const;
}

function rescue(map: MapData, { from, to }: RescueAction) {
  const unitA = map.units.get(from);
  const unitB = map.units.get(to);

  if (
    from.equals(to) ||
    !unitA ||
    unitA.isCompleted() ||
    !map.isCurrentPlayer(unitA) ||
    !unitB ||
    unitB.player !== 0 ||
    !getRescuableVectors(map, from).has(to)
  ) {
    return null;
  }

  return {
    from,
    name: unitB.isBeingRescuedBy(unitA.player)
      ? getDeterministicUnitName(map, to, unitA.player, unitB.info)
      : undefined,
    player: unitA.player,
    to,
    type: 'Rescue',
  } as const;
}

function sabotage(map: MapData, { from, to }: SabotageAction) {
  const unitA = map.units.get(from);
  const unitB = map.units.get(to);

  if (
    from.equals(to) ||
    !unitA ||
    unitA.isCompleted() ||
    !map.isCurrentPlayer(unitA) ||
    !unitB ||
    !getSabotageableVectors(map, from).has(to)
  ) {
    return null;
  }

  return { from, to, type: 'Sabotage' } as const;
}

function spawnEffect(
  map: MapData,
  { player: dynamicPlayer, teams, units }: SpawnEffectAction,
) {
  const player =
    dynamicPlayer != null ? resolveDynamicPlayerID(map, dynamicPlayer) : null;
  let newUnits = ImmutableMap<Vector, Unit>();

  for (const [vector, unit] of units) {
    const deployVector = vector
      .expand()
      .find((vector) => canDeploy(map, unit.info, vector, true));

    if (deployVector) {
      const newUnit = player != null ? unit.setPlayer(player) : unit;
      map = map.copy({ units: map.units.set(deployVector, newUnit) });
      newUnits = newUnits.set(deployVector, newUnit);
    }
  }

  return newUnits.size
    ? ({
        teams: maybeCreatePlayers(map, teams, newUnits),
        type: 'Spawn',
        units: assignDeterministicUnitNames(map, newUnits),
      } as const)
    : null;
}

function characterMessageEffect(
  map: MapData,
  { message, player, unitId, variant }: CharacterMessageEffectAction,
) {
  return {
    message,
    player,
    type: 'CharacterMessage',
    unitId,
    variant,
  } as const;
}

function buySkill(map: MapData, { from, skill }: BuySkillAction) {
  const building = map.buildings.get(from);
  const player = building && map.getPlayer(building);
  const unit = map.units.get(from);
  const { cost } = getSkillConfig(skill);

  if (
    building &&
    player &&
    !player.skills.has(skill) &&
    !building.isCompleted() &&
    building.info.hasBehavior(Behavior.SellSkills) &&
    building.skills?.has(skill) &&
    cost != null &&
    player.funds >= cost &&
    (!unit || map.matchesTeam(unit, building)) &&
    map.isCurrentPlayer(building)
  ) {
    return {
      from,
      player: player.id,
      skill,
      type: 'BuySkill',
    } as const;
  }
  return null;
}

function activatePower(map: MapData, { skill }: ActivatePowerAction) {
  const player = map.getCurrentPlayer();
  const { charges } = getSkillConfig(skill);

  if (
    player &&
    player.skills?.has(skill) &&
    !player.activeSkills?.has(skill) &&
    charges &&
    charges > 0 &&
    player.charge >= charges * Charge
  ) {
    return {
      skill,
      type: 'ActivatePower',
    } as const;
  }

  return null;
}

function applyAction(
  map: MapData,
  vision: VisionT,
  action: Action,
  isEffect: boolean,
): ActionResponse | null {
  switch (action.type) {
    case 'Move':
      return move(map, vision, action, isEffect);
    case 'AttackUnit':
      return attackUnit(map, vision, action);
    case 'AttackBuilding':
      return attackBuilding(map, vision, action);
    case 'Capture':
      return capture(map, action);
    case 'Supply':
      return supply(map, vision, action);
    case 'CreateUnit':
      return createUnit(map, action, isEffect);
    case 'DropUnit':
      return dropUnit(map, action);
    case 'CreateBuilding':
      return createBuilding(map, action);
    case 'CreateTracks':
      return createTracks(map, action);
    case 'Fold':
      return fold(map, action);
    case 'Unfold':
      return unfold(map, action);
    case 'CompleteUnit':
      return completeUnit(map, action);
    case 'CompleteBuilding':
      return completeBuilding(map, action);
    case 'EndTurn':
      return endTurn(map);
    case 'Message':
      return message(map, action);
    case 'ToggleLightning':
      return toggleLightning(map, action);
    case 'Heal':
      return heal(map, action);
    case 'Rescue':
      return rescue(map, action);
    case 'Sabotage':
      return sabotage(map, action);
    case 'Start':
      return { type: 'Start' } as const;
    // Effects
    case 'SpawnEffect':
      return isEffect ? spawnEffect(map, action) : null;
    case 'CharacterMessageEffect':
      return isEffect ? characterMessageEffect(map, action) : null;
    case 'BuySkill':
      return buySkill(map, action);
    case 'ActivatePower':
      return activatePower(map, action);
    default: {
      const _exhaustiveCheck: never = action;
      return _exhaustiveCheck;
    }
  }
}

function executeAction(
  map: MapData,
  vision: VisionT,
  action: Action,
  mutateAction: MutateActionResponseFn | undefined,
  isEffect: boolean,
): readonly [ActionResponse, MapData] | null {
  let actionResponse = applyAction(map, vision, action, isEffect || false);
  if (actionResponse && mutateAction) {
    actionResponse = mutateAction(actionResponse);
  }

  return actionResponse
    ? ([
        actionResponse,
        applyActionResponse(map, vision, actionResponse),
      ] as const)
    : null;
}

export function execute(
  map: MapData,
  vision: VisionT,
  action: Action,
  mutateAction?: MutateActionResponseFn,
): readonly [ActionResponse, MapData] | null {
  return executeAction(map, vision, action, mutateAction, false);
}

export function executeEffect(
  map: MapData,
  vision: VisionT,
  action: Action,
): readonly [ActionResponse, MapData] | null {
  return executeAction(map, vision, action, undefined, true);
}
