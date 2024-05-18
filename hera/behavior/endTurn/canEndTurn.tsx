import type { State } from '../../Types.tsx';

export default function canEndTurn(state: State) {
  const { behavior, currentViewer, lastActionResponse, map, replayState } =
    state;
  return !!(
    currentViewer &&
    map.isCurrentPlayer(currentViewer) &&
    (!behavior || behavior.type !== 'null') &&
    (!lastActionResponse || lastActionResponse.type !== 'GameEnd') &&
    !replayState.isReplaying
  );
}
