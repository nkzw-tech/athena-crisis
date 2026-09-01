import { Crystal } from '@deities/athena/invasions/Crystal.tsx';
import isPvP from '@deities/athena/lib/isPvP.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { GameTimerValue, isFixedTimeTimer } from './GameTimerValue.tsx';

export default function hasTimer<T>(
  game: T & {
    ended: boolean;
    timer: number | null;
  },
  map: MapData,
): game is T & { ended: boolean; timer: Exclude<GameTimerValue, null> } {
  const { ended, timer } = game;
  const currentPlayer = map.getCurrentPlayer();
  return (
    !ended &&
    timer != null &&
    currentPlayer.isHumanPlayer() &&
    (isFixedTimeTimer(timer) || currentPlayer.crystal === Crystal.Power || isPvP(map))
  );
}
