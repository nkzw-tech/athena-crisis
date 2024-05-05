import MapData from '../MapData.tsx';

export default function getFirstHumanPlayer(map: MapData) {
  return map.getPlayers().find((player) => player.isHumanPlayer());
}
