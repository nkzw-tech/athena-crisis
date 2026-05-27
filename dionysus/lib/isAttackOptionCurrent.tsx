import Player from '@deities/athena/map/Player.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { PossibleAttack } from './getPossibleAttacks.tsx';

export default function isAttackOptionCurrent(
  map: MapData,
  currentPlayer: Player,
  attackOption: PossibleAttack,
): boolean {
  const unitA = map.units.get(attackOption.from);
  const entityB = map.units.get(attackOption.vector) || map.buildings.get(attackOption.vector);

  return !!(
    unitA &&
    unitA === attackOption.unitA &&
    !unitA.isCompleted() &&
    !unitA.isCapturing() &&
    unitA.info.hasAttack() &&
    entityB &&
    entityB === attackOption.entityB &&
    map.matchesPlayer(currentPlayer, unitA)
  );
}
