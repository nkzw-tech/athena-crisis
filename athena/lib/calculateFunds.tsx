import { PowerStation } from '../info/Building.tsx';
import { PowerStationSkillMultiplier, Skill } from '../info/Skill.tsx';
import { PowerStationMultiplier } from '../map/Configuration.tsx';
import Player from '../map/Player.tsx';
import MapData from '../MapData.tsx';

export default function calculateFunds(map: MapData, player: Player): number {
  let sum = 0;
  let powerStations = 0;

  for (const [, building] of map.buildings) {
    if (map.matchesPlayer(player, building)) {
      sum += building.info.configuration.funds;

      if (building.info === PowerStation) {
        powerStations++;
      }
    }
  }

  return Math.floor(
    sum *
      map.config.multiplier *
      (1 +
        (PowerStationMultiplier +
          (player.skills.has(Skill.UnlockPowerStation) ? PowerStationSkillMultiplier : 0)) *
          powerStations),
  );
}

export function calculateTotalPossibleFunds(map: MapData): number {
  return map.buildings.reduce((sum, building) => sum + building.info.configuration.funds, 0);
}
