import { HQ } from '@deities/athena/info/Building.tsx';
import convertBiome from '@deities/athena/lib/convertBiome.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { ActivateCrystalActionResponse } from '../ActionResponse.tsx';

export default function applyPartialActivateCrystalActionResponse(
  map: MapData,
  actionResponse: ActivateCrystalActionResponse,
): MapData {
  const { biome, hq } = actionResponse;
  if (biome) {
    map = convertBiome(map, biome);
  }

  if (actionResponse.player && hq) {
    const building = map.buildings.get(hq);
    map = map.copy({
      buildings: map.buildings.set(
        hq,
        HQ.create(actionResponse.player).copy({
          completed: building?.isCompleted() || undefined,
        }),
      ),
    });
  }

  return map;
}
