import MapData from '../MapData.tsx';
import assignUnitNames from './assignUnitNames.tsx';
import calculateFunds from './calculateFunds.tsx';
import updatePlayer from './updatePlayer.tsx';

export default function startGame(map: MapData): MapData {
  map = map.copy({
    teams: map.teams.map((team) =>
      team.copy({
        players: team.players.map((player) =>
          player.setFunds(map.config.seedCapital).resetStatistics(),
        ),
      }),
    ),
  });
  const player = map.getCurrentPlayer();
  return assignUnitNames(
    map.copy({
      buildings: map.buildings.map((building) => building.recover()),
      teams: updatePlayer(
        map.teams,
        player.modifyFunds(calculateFunds(map, player)),
      ),
      units: map.units.map((unit) => unit.ensureValidAttributes().recover()),
    }),
  );
}
