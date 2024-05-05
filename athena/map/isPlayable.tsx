import MapData, { AnyEntity } from '../MapData.tsx';
import Player, { PlayerID } from './Player.tsx';

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
