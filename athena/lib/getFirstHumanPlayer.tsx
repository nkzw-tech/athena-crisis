import MapData from '../MapData.tsx';

export default function getFirstHumanPlayer(map: MapData) {
  return map.active.find((player) => map.getPlayer(player).isHumanPlayer());
}
