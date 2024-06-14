import MapData from '../MapData.tsx';

export default function isPvP(map: MapData) {
  return (
    map.active.filter((id) => map.getPlayer(id).isHumanPlayer()).length > 1
  );
}
