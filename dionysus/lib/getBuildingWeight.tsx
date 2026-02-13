import { BuildingInfo, House, MinFunds, RepairShop } from '@deities/athena/info/Building.tsx';

const averageBuildingWeight =
  ((House.configuration.funds + RepairShop.configuration.funds) / 2 / MinFunds) * 10;

export default function getBuildingWeight(info: BuildingInfo) {
  return info.isHQ()
    ? MinFunds
    : info.configuration.funds
      ? (info.configuration.funds / MinFunds) * 10
      : averageBuildingWeight;
}
