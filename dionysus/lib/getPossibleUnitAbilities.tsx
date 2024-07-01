import { Ability, UnitInfo } from '@deities/athena/info/Unit.tsx';
import Building from '@deities/athena/map/Building.tsx';
import Player from '@deities/athena/map/Player.tsx';

export type PotentialUnitAbilities = Readonly<{
  canCreateBuildUnits: boolean;
  canCreateCaptureUnits: boolean;
  canCreateSupplyUnits: boolean;
  canCreateTransportUnits: boolean;
}>;

export function getPossibleUnitAbilitiesForBuildings(
  buildings: ReadonlyArray<Building>,
  currentPlayer: Player,
): PotentialUnitAbilities {
  const unitInfos = new Set<UnitInfo>();
  for (const building of buildings) {
    for (const unit of building.getBuildableUnits(currentPlayer)) {
      unitInfos.add(unit);
    }
  }
  return getPossibleUnitAbilities([...unitInfos]);
}

export default function getPossibleUnitAbilities(
  unitInfos: ReadonlyArray<UnitInfo>,
) {
  let canCreateBuildUnits = false;
  let canCreateCaptureUnits = false;
  let canCreateSupplyUnits = false;
  let canCreateTransportUnits = false;

  for (const unit of unitInfos) {
    if (unit.hasAbility(Ability.Capture)) {
      canCreateCaptureUnits = true;
    }

    if (unit.hasAbility(Ability.CreateBuildings)) {
      canCreateBuildUnits = true;
    }

    if (unit.hasAbility(Ability.Supply)) {
      canCreateSupplyUnits = true;
    }

    if (unit.canTransportUnits()) {
      canCreateTransportUnits = true;
    }

    if (
      canCreateBuildUnits &&
      canCreateCaptureUnits &&
      canCreateSupplyUnits &&
      canCreateTransportUnits
    ) {
      return {
        canCreateBuildUnits,
        canCreateCaptureUnits,
        canCreateSupplyUnits,
        canCreateTransportUnits,
      };
    }
  }

  return {
    canCreateBuildUnits,
    canCreateCaptureUnits,
    canCreateSupplyUnits,
    canCreateTransportUnits,
  };
}
