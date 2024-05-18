import type { AnyEntity } from '../MapData.tsx';
import type MapData from '../MapData.tsx';
import type { PlayerID } from './Player.tsx';
import type Player from './Player.tsx';

export default function isPlayable(
  map: MapData,
  currentViewer: Player | PlayerID | null,
  object?: AnyEntity,
) {
  return !!(
    currentViewer &&
    map.isCurrentPlayer(currentViewer) &&
    (!object || map.matchesPlayer(currentViewer, object))
  );
}
