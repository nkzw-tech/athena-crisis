import MapData from '../MapData.tsx';

export default function isPvP(map: MapData) {
  return (
    map.active.filter((id) => map.maybeGetPlayer(id)?.isHumanPlayer()).length >
    1
  );
}
