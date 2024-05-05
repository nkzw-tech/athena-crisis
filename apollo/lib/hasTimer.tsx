import isPvP from '@deities/athena/lib/isPvP.tsx';
import MapData from '@deities/athena/MapData.tsx';

export default function hasTimer<T>(
  game: T & {
    ended: boolean;
    timer: number | null;
  },
  map: MapData,
): game is T & { ended: boolean; timer: number } {
  const { ended, timer } = game;
  return (
    !ended &&
    timer != null &&
    map.getCurrentPlayer().isHumanPlayer() &&
    isPvP(map)
  );
}
