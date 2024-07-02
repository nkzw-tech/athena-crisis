import { PlainMap } from '../map/PlainMap.tsx';

export default function encodedMapDataHasHiddenObjective(state: PlainMap) {
  return state.config.winConditions?.some(([, hidden]) => hidden);
}
