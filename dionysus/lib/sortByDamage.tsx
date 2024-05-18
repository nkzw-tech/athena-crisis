import type { UnitInfo } from '@deities/athena/info/Unit.tsx';
import calculateLikelyDamage from '@deities/athena/lib/calculateLikelyDamage.tsx';
import getAttackStatusEffect from '@deities/athena/lib/getAttackStatusEffect.tsx';
import getDefenseStatusEffect from '@deities/athena/lib/getDefenseStatusEffect.tsx';
import type Player from '@deities/athena/map/Player.tsx';
import type Unit from '@deities/athena/map/Unit.tsx';
import type Vector from '@deities/athena/map/Vector.tsx';
import type MapData from '@deities/athena/MapData.tsx';
import sortBy from '@deities/hephaestus/sortBy.tsx';

export default function sortByDamage(
  map: MapData,
  opponentUnits: ReadonlyArray<[Vector, Unit]>,
  unitInfos: ReadonlyArray<UnitInfo>,
  currentPlayer: Player,
) {
  return sortBy(
    [...unitInfos],
    // If none of the available units have an attack, recommend the most expensive units first.
    unitInfos.every((unitInfo) => !unitInfo.hasAttack())
      ? (unitInfo) => -unitInfo.getCostFor(currentPlayer)
      : (unitInfo) => {
          const unitA = unitInfo.create(currentPlayer);
          const attackStatusEffect = getAttackStatusEffect(map, unitA, null);
          return -(
            opponentUnits.reduce<number>(
              (sum, [position, entityB]) =>
                sum +
                (calculateLikelyDamage(
                  unitA,
                  entityB,
                  map,
                  // Assume equal position.
                  position,
                  position,
                  attackStatusEffect,
                  getDefenseStatusEffect(map, entityB, null),
                  1,
                ) || 0),
              0,
            ) / opponentUnits.length
          );
        },
  );
}
