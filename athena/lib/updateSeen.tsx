import BitSet from '../map/BitSet.tsx';
import { Fog } from '../map/PlainMap.tsx';
import Unit from '../map/Unit.tsx';
import Vector from '../map/Vector.tsx';
import MapData from '../MapData.tsx';
import { visible } from '../Radius.tsx';
import updatePlayers from './updatePlayers.tsx';

function* visibleTileIndexes(map: MapData, unit: Unit, vector: Vector) {
  for (const [, item] of visible(map, unit, vector)) {
    yield map.getTileIndex(item.vector);
  }
}

function* expandedTileIndexes(map: MapData, vector: Vector) {
  for (const expandedVector of vector.expand()) {
    if (map.contains(expandedVector)) {
      yield map.getTileIndex(expandedVector);
    }
  }
}

export default function updateSeen(map: MapData): MapData {
  if (map.config.fog !== Fog.Exploration) {
    return map;
  }

  const seenByTeam = new Map(
    [...map.teams].map(([id, team]) => {
      let seen = new BitSet();
      for (const [, player] of team.players) {
        seen = seen.union(player.seen);
      }
      return [id, seen] as const;
    }),
  );

  for (const vector of map.units.keySeq()) {
    const unit = map.units.get(vector)!;
    const teamId = map.maybeGetPlayer(unit.player)?.teamId;
    const seen = teamId != null && seenByTeam.get(teamId);
    if (seen) {
      seenByTeam.set(teamId, seen.addAll(visibleTileIndexes(map, unit, vector)));
    }
  }

  for (const vector of map.buildings.keySeq()) {
    const building = map.buildings.get(vector)!;
    const teamId = map.maybeGetPlayer(building.player)?.teamId;
    const seen = teamId != null && seenByTeam.get(teamId);
    if (seen) {
      seenByTeam.set(teamId, seen.addAll(expandedTileIndexes(map, vector)));
    }
  }

  const players = [];
  for (const [, team] of map.teams) {
    const seen = seenByTeam.get(team.id)!;
    players.push(
      ...[...team.players.values()].map((player) =>
        player.seen === seen ? player : player.copy({ seen }),
      ),
    );
  }

  return map.copy({
    teams: updatePlayers(map.teams, players),
  });
}
