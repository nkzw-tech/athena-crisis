import { PlainMap } from '../map/PlainMap.tsx';
import MapData from '../MapData.tsx';

export default function hasPlayerChange(
  previousMap: PlainMap | MapData,
  activeMap: PlainMap | MapData,
) {
  return (
    previousMap.currentPlayer !== activeMap.currentPlayer || previousMap.round !== activeMap.round
  );
}
