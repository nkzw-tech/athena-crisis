import MapData from '@deities/athena/MapData.tsx';
import { useMemo } from 'react';

export default function useMapData(map: string | undefined) {
  return useMemo(() => (map ? MapData.fromJSON(map) : null), [map]);
}
