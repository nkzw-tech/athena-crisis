import isPvP from '@deities/athena/lib/isPvP.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { GameTimerValue } from './GameTimerValue.tsx';

export default function hasTimer<T>(
  game: T & {
    ended: boolean;
    timer: number | null;
  },
  map: MapData,
): game is T & { ended: boolean; timer: Exclude<GameTimerValue, null> } {
  const { ended, timer } = game;
  return (
    !ended &&
    timer != null &&
    map.getCurrentPlayer().isHumanPlayer() &&
    isPvP(map)
  );
}
