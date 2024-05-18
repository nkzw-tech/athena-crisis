import type { BuildingInfo } from '@deities/athena/info/Building.tsx';
import type { TileField, TileInfo } from '@deities/athena/info/Tile.tsx';
import { Plain } from '@deities/athena/info/Tile.tsx';

export default function getAnyBuildingTileField(
  building: BuildingInfo,
): TileField {
  const info = (
    building.configuration.placeOn || building.configuration.editorPlaceOn
  )
    .values()
    .next().value as TileInfo;

  const { style } = info;
  let fallback = style.fallback;
  if (style.layer === 1) {
    while (fallback?.style.layer === 1) {
      fallback = fallback.style.fallback;
    }
  }
  return style.layer === 1 ? [fallback?.id || Plain.id, info.id] : info.id;
}
