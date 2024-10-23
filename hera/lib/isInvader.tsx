import { Crystal } from '@deities/athena/invasions/Crystal.tsx';
import { PlayerID } from '@deities/athena/map/Player.tsx';
import MapData from '@deities/athena/MapData.tsx';

export default function isInvader(map: MapData, playerID: PlayerID) {
  const player = map.getPlayer(playerID);
  const crystal = player.isHumanPlayer() ? player.crystal : null;
  return crystal != null && crystal !== Crystal.Power;
}
