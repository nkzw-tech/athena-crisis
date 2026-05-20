import updatePlayers from './lib/updatePlayers.tsx';
import BitSet from './map/BitSet.tsx';
import { Fog as FogType } from './map/PlainMap.tsx';
import { PlayerID } from './map/Player.tsx';
import vec from './map/vec.tsx';
import Vector from './map/Vector.tsx';
import MapData from './MapData.tsx';
import { visible } from './Radius.tsx';

export type VisionT = {
  apply(map: MapData): MapData;
  readonly currentViewer: PlayerID;
  getVisibility: (map: MapData, vector: Vector) => Visibility;
  isExplored: (map: MapData, vector: Vector) => boolean;
  isVisible: (map: MapData, vector: Vector) => boolean;
};

export enum Visibility {
  Visible = 0,
  Fog = 1,
  Unexplored = 2,
}

export default class Vision {
  constructor(public readonly currentViewer: PlayerID) {}

  isVisible() {
    return true;
  }

  isExplored() {
    return true;
  }

  getVisibility() {
    return Visibility.Visible;
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

    for (const vector of map.units.keySeq()) {
      const unit = map.units.get(vector)!;
      if (map.matchesTeam(unit, this.currentViewer)) {
        for (const [, item] of visible(map, unit, vector)) {
          vision[map.getTileIndex(item.vector)] = 1;
        }
      }
    }
    for (const vector of map.buildings.keySeq()) {
      const building = map.buildings.get(vector)!;
      if (map.matchesTeam(building, this.currentViewer)) {
        for (const expandedVector of vector.expand()) {
          if (map.contains(expandedVector)) {
            vision[map.getTileIndex(expandedVector)] = 1;
          }
        }
      }
    }

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

  isExplored(map: MapData, vector: Vector) {
    if (!map.contains(vector)) {
      return false;
    }

    return (
      map.config.fog !== FogType.Exploration ||
      !!map.maybeGetPlayer(this.currentViewer)?.seen.has(map.getTileIndex(vector))
    );
  }

  getVisibility(map: MapData, vector: Vector) {
    return this.isVisible(map, vector)
      ? Visibility.Visible
      : this.isExplored(map, vector)
        ? Visibility.Fog
        : Visibility.Unexplored;
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
          .map((player) =>
            team?.players.has(player.id)
              ? player
              : player.resetStatistics().copy({ seen: new BitSet() }),
          ),
      ),
      units: map.units.filter((_, vector) => vision[map.getTileIndex(vector)] === 1),
    });
  }
}

export class StandardFog extends Fog {
  override isExplored(map: MapData, vector: Vector) {
    return map.contains(vector);
  }
}
