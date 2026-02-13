import { Crystal } from '../invasions/Crystal.tsx';
import { HumanPlayer, isHumanPlayer } from '../map/Player.tsx';
import Team from '../map/Team.tsx';
import MapData from '../MapData.tsx';

export default function getWinningInvaders(
  map: MapData,
  winningTeam: Team,
  powerCrystalPlayer: HumanPlayer | null,
) {
  return powerCrystalPlayer && powerCrystalPlayer.teamId !== winningTeam.id
    ? map.active
        .map((id) => map.getPlayer(id))
        .filter(isHumanPlayer)
        .filter(({ crystal }) => crystal === Crystal.Command || crystal === Crystal.Phantom)
    : [];
}
