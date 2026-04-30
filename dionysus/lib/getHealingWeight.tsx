import { MinFunds } from '@deities/athena/info/Building.tsx';
import calculateFunds, {
  calculateTotalPossibleFunds,
} from '@deities/athena/lib/calculateFunds.tsx';
import getHealCost from '@deities/athena/lib/getHealCost.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { getSelfPriorityLabels } from '@deities/athena/Objectives.tsx';

export default function getHealingWeight(map: MapData, unit: Unit) {
  const currentPlayer = map.getCurrentPlayer();
  const labelsToPrioritize = getSelfPriorityLabels(map.config.objectives, currentPlayer.id);

  const injuryFactor = Math.pow((100 - unit.health) / 100, 2);
  const healCost = getHealCost(unit, currentPlayer);
  const playerIncome = calculateFunds(map, currentPlayer);
  const maxMapIncome = calculateTotalPossibleFunds(map);
  const minSavings = playerIncome > 0 ? MinFunds * 2 : maxMapIncome > 0 ? MinFunds * 4 : MinFunds;

  if (currentPlayer.funds - healCost <= minSavings) {
    return undefined;
  }

  let weight = (unit.info.getCostFor(currentPlayer) * injuryFactor) / (healCost + 1);

  if (unit.label && labelsToPrioritize.has(unit.label)) {
    weight *= 100;
  }

  if (unit.isCapturing()) {
    weight *= 5;
  }

  if (unit.isTransportingUnits()) {
    weight *= 3;
  }

  if (unit.isLeader()) {
    weight *= 2;
  }

  if (!unit.hasFuel() || unit.isOutOfAmmo()) {
    weight *= 0.8;
  }

  return weight;
}
