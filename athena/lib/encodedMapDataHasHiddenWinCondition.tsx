import { PlainMap } from '../map/PlainMap.tsx';

export default function encodedMapDataHasHiddenWinCondition(state: PlainMap) {
  return state.config.winConditions?.some(([, hidden]) => hidden);
}
