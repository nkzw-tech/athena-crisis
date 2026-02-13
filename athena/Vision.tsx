import updatePlayers from './lib/updatePlayers.tsx';
import { PlayerID } from './map/Player.tsx';
import vec from './map/vec.tsx';
import Vector from './map/Vector.tsx';
import MapData from './MapData.tsx';
import { visible } from './Radius.tsx';

export type VisionT = {
  apply(map: MapData): MapData;
  readonly currentViewer: PlayerID;
  isVisible: (map: MapData, vector: Vector) => boolean;
};

export default class Vision {
  constructor(public readonly currentViewer: PlayerID) {}

  isVisible() {
    return true;
  }

  apply(map: MapData) {
    return map;
  }
}

export class Fog {
  private vision: WeakMap<MapData, ReadonlyArray<number>>;

  constructor(public readonly currentViewer: PlayerID) {
    this.vision = new WeakMap();
  }

  private calculateVision(map: MapData) {
    const vision = Array(map.map.length).fill(0);

    map.units.forEach((unit, vector) => {
      if (map.matchesTeam(unit, this.currentViewer)) {
        visible(map, unit, vector).forEach((item) => {
          vision[map.getTileIndex(item.vector)] = 1;
        });
      }
    });
    map.buildings.forEach((building, vector) => {
      if (map.matchesTeam(building, this.currentViewer)) {
        vector.expand().forEach((vector) => {
          if (map.contains(vector)) {
            vision[map.getTileIndex(vector)] = 1;
          }
        });
      }
    });

    this.vision.set(map, vision);
    return vision;
  }

  isVisible(map: MapData, vector: Vector) {
    if (this.currentViewer === 0) {
      return false;
    }

    const vision = this.vision.get(map) || this.calculateVision(map);
    return map.contains(vector) && vision[map.getTileIndex(vector)] === 1;
  }

  apply(map: MapData) {
    // Prime the cache.
    this.isVisible(map, vec(1, 1));
    // Fall back to hide everything if the viewer is not a player or spectator.
    const vision = this.vision.get(map) || [];
    const team = map.maybeGetTeam(this.currentViewer);
    return map.copy({
      buildings: map.buildings.map((building, vector) =>
        vision[map.getTileIndex(vector)] === 1 ? building : building.hide(map.config.biome),
      ),
      teams: updatePlayers(
        map.teams,
        map
          .getPlayers()
          .map((player) => (team?.players.has(player.id) ? player : player.resetStatistics())),
      ),
      units: map.units.filter((_, vector) => vision[map.getTileIndex(vector)] === 1),
    });
  }
}
