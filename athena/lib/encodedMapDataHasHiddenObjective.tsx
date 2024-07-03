import { PlainMap } from '../map/PlainMap.tsx';

export default function encodedMapDataHasHiddenObjective(state: PlainMap) {
  const { objectives, winConditions } = state.config;
  return (
    objectives?.some(([, [, hidden]]) => hidden) ||
    winConditions?.some(([, hidden]) => hidden)
  );
}
