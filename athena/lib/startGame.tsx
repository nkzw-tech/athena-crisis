import MapData from '../MapData.tsx';
import assignUnitNames from './assignUnitNames.tsx';
import calculateFunds from './calculateFunds.tsx';
import updatePlayer from './updatePlayer.tsx';

export default function startGame(map: MapData): MapData {
  map = map.copy({
    teams: map.teams.map((team) =>
      team.copy({
        players: team.players.map((player) =>
          player
            .setFunds(map.config.seedCapital)
            .resetStatistics()
            .modifyStatistics({
              createdBuildings: map.buildings.filter(
                (building) => building.player === player.id,
              ).size,
              createdUnits: map.units.filter(
                (unit) => unit.player === player.id,
              ).size,
              fundsPerTurn: calculateFunds(map, player),
            }),
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
