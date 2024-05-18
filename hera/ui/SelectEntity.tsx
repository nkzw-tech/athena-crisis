import type Building from '@deities/athena/map/Building.tsx';
import type Unit from '@deities/athena/map/Unit.tsx';
import type Vector from '@deities/athena/map/Vector.tsx';
import { useCallback } from 'react';
import type { Actions, State } from '../Types.tsx';
import EntityPickerFlyout from './EntityPickerFlyout.tsx';

export default function SelectEntity({
  actions,
  onSelectBuilding,
  onSelectUnit,
  state,
}: {
  actions: Actions;
  onSelectBuilding: (position: Vector, building: Building) => void;
  onSelectUnit: (position: Vector, unit: Unit) => void;
  state: State;
}) {
  const {
    animationConfig,
    map,
    selectedBuilding,
    selectedPosition,
    selectedUnit,
    tileSize,
    zIndex,
  } = state;

  const selectBuilding = useCallback(() => {
    if (selectedPosition && selectedBuilding) {
      onSelectBuilding(selectedPosition, selectedBuilding);
    }
  }, [selectedPosition, selectedBuilding, onSelectBuilding]);

  const selectUnit = useCallback(() => {
    if (selectedPosition && selectedUnit) {
      onSelectUnit(selectedPosition, selectedUnit);
    }
  }, [onSelectUnit, selectedPosition, selectedUnit]);

  if (selectedBuilding && selectedPosition && selectedUnit) {
    return (
      <EntityPickerFlyout
        animationConfig={animationConfig}
        biome={map.config.biome}
        building={selectedBuilding}
        firstPlayerID={map.getFirstPlayerID()}
        onSelectBuilding={selectBuilding}
        onSelectUnit={selectUnit}
        position={selectedPosition}
        resetPosition={actions.resetPosition}
        tileSize={tileSize}
        unit={selectedUnit}
        width={map.size.width}
        zIndex={zIndex}
      />
    );
  }
  return null;
}
