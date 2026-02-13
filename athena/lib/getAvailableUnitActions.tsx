import { filterBuildings } from '../info/Building.tsx';
import { Ability } from '../info/Unit.tsx';
import Unit from '../map/Unit.tsx';
import Vector from '../map/Vector.tsx';
import MapData from '../MapData.tsx';
import { RadiusItem } from '../Radius.tsx';
import { VisionT } from '../Vision.tsx';
import canBuild from './canBuild.tsx';
import canPlaceRailTrack from './canPlaceRailTrack.tsx';
import getAttackableEntitiesInRange from './getAttackableEntitiesInRange.tsx';
import getHealableVectors from './getHealableVectors.tsx';
import getRescuableVectors from './getRescuableVectors.tsx';
import getSabotageableVectors from './getSabotageableVectors.tsx';
import getUnitsToRefill from './getUnitsToRefill.tsx';

export type UnitActionTypes =
  | 'attack'
  | 'capture'
  | 'createBuildings'
  | 'createTracks'
  | 'drop'
  | 'fold'
  | 'heal'
  | 'move'
  | 'rescue'
  | 'sabotage'
  | 'supply'
  | 'unfold';

export default function getAvailableUnitActions(
  map: MapData,
  position: Vector,
  unit: Unit,
  vision: VisionT,
  attackable: ReadonlyMap<Vector, RadiusItem> | null,
): ReadonlySet<UnitActionTypes> | null {
  if (!position || !unit || unit.isCompleted()) {
    return null;
  }

  const info = unit.info;
  const canMove = unit.canMove();
  const building = map.buildings.get(position);
  const actions = new Set<UnitActionTypes>();

  if (
    attackable?.size ||
    (!attackable &&
      info.hasAttack() &&
      (canMove || getAttackableEntitiesInRange(map, position, vision).size))
  ) {
    actions.add('attack');
  }

  if (info.hasAbility(Ability.Unfold)) {
    actions.add(unit.isUnfolded() ? 'fold' : 'unfold');
  }

  if (
    unit.isTransportingUnits() &&
    unit.transports.some((unit) => info.canDropFrom(unit.info, map.getTileInfo(position)))
  ) {
    actions.add('drop');
  }

  if (
    info.hasAbility(Ability.CreateBuildings) &&
    !map.buildings.has(position) &&
    filterBuildings((building) => canBuild(map, building, map.getCurrentPlayer(), position))
      .length > 0
  ) {
    actions.add('createBuildings');
  }

  if (building && map.isOpponent(unit, building) && unit.canCapture(map.getCurrentPlayer())) {
    actions.add('capture');
  }

  if (
    info.hasAbility(Ability.Supply) &&
    getUnitsToRefill(map, vision, map.getPlayer(unit), position).size
  ) {
    actions.add('supply');
  }

  if (info.hasAbility(Ability.Heal) && getHealableVectors(map, position).size) {
    actions.add('heal');
  }

  if (info.hasAbility(Ability.Rescue) && getRescuableVectors(map, position).size) {
    actions.add('rescue');
  }

  if (info.hasAbility(Ability.Sabotage) && getSabotageableVectors(map, position).size) {
    actions.add('sabotage');
  }

  if (info.hasAbility(Ability.CreateTracks) && canPlaceRailTrack(map, position)) {
    actions.add('createTracks');
  }

  if (canMove) {
    actions.add('move');
  }

  return actions;
}
