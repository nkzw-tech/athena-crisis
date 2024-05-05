import MapData from '../MapData.tsx';
import { getHiddenLabels } from '../WinConditions.tsx';

export default function dropLabels(map: MapData) {
  const labels = getHiddenLabels(map.config.winConditions);
  return labels?.size
    ? map.copy({
        buildings: map.buildings.map((building) => building.dropLabel(labels)),
        units: map.units.map((unit) => unit.dropLabel(labels)),
      })
    : map;
}
