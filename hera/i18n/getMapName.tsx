import { MapMap } from './EntityMap.tsx';

export default function getMapName(mapName: string): string {
  return MapMap[mapName as keyof typeof MapMap]?.() || mapName;
}
