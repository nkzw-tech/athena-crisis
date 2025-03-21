import { SpriteVariant } from '@deities/athena/info/SpriteVariants.tsx';
import { UnitCustomizationById } from '@deities/athena/info/UnitCustomizations.tsx';
import { ID } from '@deities/athena/MapData.tsx';
import isPresent from '@nkzw/core/isPresent.js';

export default function getPlayerEquippedUnitCustomizations(
  equippedUnitCustomizations: ReadonlyArray<number>,
): ReadonlyMap<ID, SpriteVariant> {
  return new Map(
    equippedUnitCustomizations
      .map((id) => UnitCustomizationById.get(id))
      .filter(isPresent)
      .map(({ sprite, unit }) => [unit.id, sprite]),
  );
}
