import { MinFunds } from '@deities/athena/info/Building.tsx';
import getHealCost from '@deities/athena/lib/getHealCost.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import MapData from '@deities/athena/MapData.tsx';

export default function getHealingWeight(map: MapData, unit: Unit) {
  const { info } = unit;
  const currentPlayer = map.getCurrentPlayer();
  const injuryFactor = Math.pow((100 - unit.health) / 100, 2);
  const healCost = getHealCost(unit, currentPlayer);

  if (healCost > currentPlayer.funds / 2) {
    return undefined;
  }

  let weight =
    ((info.getCostFor(currentPlayer) / MinFunds + info.defense) * injuryFactor) / (healCost + 1);

  if (unit.isCapturing()) {
    weight *= 5;
  }

  if (unit.isTransportingUnits()) {
    weight *= 2;
  }

  if (unit.label !== null) {
    weight *= 1.2;
  }

  if (unit.isLeader()) {
    weight *= 1.1;
  }

  if (!unit.hasFuel() || unit.isOutOfAmmo()) {
    weight *= 0.8;
  }

  return weight;
}
