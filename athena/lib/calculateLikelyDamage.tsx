import { BuildingCover, MinDamage } from '../map/Configuration.tsx';
import Entity from '../map/Entity.tsx';
import Unit from '../map/Unit.tsx';
import Vector from '../map/Vector.tsx';
import MapData from '../MapData.tsx';
import calculateDamage from './calculateDamage.tsx';

export default function calculateLikelyDamage(
  unitA: Unit,
  entityB: Entity,
  map: MapData,
  from: Vector,
  to: Vector,
  attackStatusEffect: number,
  defenseStatusEffect: number,
  modifier: number,
  weapon = unitA.getAttackWeapon(entityB),
): number | null {
  if (weapon) {
    return Math.floor(
      Math.max(
        MinDamage,
        calculateDamage(
          unitA,
          entityB,
          weapon,
          map.getTileInfo(from).configuration.cover +
            (map.buildings.has(from) ? BuildingCover : 0),
          map.getTileInfo(to).configuration.cover +
            (map.buildings.has(to) ? BuildingCover : 0),
          attackStatusEffect,
          defenseStatusEffect,
          1,
        ) * modifier,
      ),
    );
  }

  return null;
}
