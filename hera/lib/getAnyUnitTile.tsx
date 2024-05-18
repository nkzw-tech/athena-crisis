import { MovementTypes } from '@deities/athena/info/MovementType.tsx';
import { findTile, Sea } from '@deities/athena/info/Tile.tsx';
import type { UnitInfo } from '@deities/athena/info/Unit.tsx';

export default function getAnyUnitTile(info: UnitInfo) {
  if (
    info.movementType === MovementTypes.Amphibious &&
    (Sea.configuration.movement.get(MovementTypes.Amphibious) || 0) > 0
  ) {
    return Sea;
  }

  return findTile((tile) =>
    [...tile.configuration.movement].find(
      ([type, cost]) => info.movementType === type && cost !== -1,
    ),
  );
}
