import getAvailableUnitActions from '@deities/athena/lib/getAvailableUnitActions.tsx';
import type Building from '@deities/athena/map/Building.tsx';
import type Entity from '@deities/athena/map/Entity.tsx';
import { isBuilding, isUnit } from '@deities/athena/map/Entity.tsx';
import type Unit from '@deities/athena/map/Unit.tsx';
import type Vector from '@deities/athena/map/Vector.tsx';
import { useCallback } from 'react';
import AbstractSelectBehavior from '../../behavior/AbstractSelectBehavior.tsx';
import type { MenuItemProps } from '../../behavior/Menu.tsx';
import Cursor from '../../Cursor.tsx';
import type { State, StateLike, StateWithActions } from '../../Types.tsx';
import ActionWheel, { ActionButton } from '../../ui/ActionWheel.tsx';
import SelectEntity from '../../ui/SelectEntity.tsx';

const UnfoldButton = ({
  actions: { update },
  availableActions,
  state,
}: MenuItemProps) => {
  const { map, navigationDirection, selectedPosition, selectedUnit } = state;
  return selectedUnit && selectedPosition && availableActions.has('unfold') ? (
    <ActionButton
      navigationDirection={navigationDirection}
      onClick={() => {
        const unit = selectedUnit.unfold();
        update({
          map: map.copy({
            units: map.units.set(selectedPosition, unit),
          }),
          selectedUnit: unit,
        });
      }}
      type="unfold"
    />
  ) : null;
};

const FoldButton = ({
  actions: { update },
  availableActions,
  state,
}: MenuItemProps) => {
  const { map, navigationDirection, selectedPosition, selectedUnit } = state;
  return selectedUnit && selectedPosition && availableActions.has('fold') ? (
    <ActionButton
      navigationDirection={navigationDirection}
      onClick={() => {
        const unit = selectedUnit.fold();
        update({
          map: map.copy({
            units: map.units.set(selectedPosition, unit),
          }),
          selectedUnit: unit,
        });
      }}
      type="fold"
    />
  ) : null;
};

const CaptureButton = ({
  actions: { update },
  availableActions,
  state,
  type = 'capture',
}: MenuItemProps & { type: 'capture' | 'stopCapture' }) => {
  const { map, navigationDirection, selectedPosition, selectedUnit } = state;
  return selectedUnit && selectedPosition && availableActions.has('capture') ? (
    <ActionButton
      navigationDirection={navigationDirection}
      onClick={() => {
        const unit = selectedUnit.isCapturing()
          ? selectedUnit.stopCapture()
          : selectedUnit.capture();
        update({
          map: map.copy({
            units: map.units.set(selectedPosition, unit),
          }),
          selectedUnit: unit,
        });
      }}
      type={type}
    />
  ) : null;
};

export default class EntityBehavior extends AbstractSelectBehavior {
  public readonly type = 'entity' as const;
  public readonly navigate = true;

  deactivate() {
    return {
      namedPositions: null,
      selectedBuilding: null,
      selectedPosition: null,
      selectedUnit: null,
      showCursor: true,
    };
  }

  onSelect(vector: Vector, state: State, entity: Entity): StateLike | null {
    if (isUnit(entity)) {
      return {
        namedPositions: [vector],
        selectedBuilding: null,
        selectedPosition: vector,
        selectedUnit: entity,
      };
    }

    if (isBuilding(entity)) {
      return {
        selectedBuilding: entity,
        selectedPosition: vector,
        selectedUnit: null,
      };
    }

    return null;
  }

  canSelectCandidates(
    state: State,
    unit: Unit,
    building: Building,
  ): { building: Building | null; unit: Unit | null } {
    return { building, unit };
  }

  override component = ({ actions, state }: StateWithActions) => {
    const { update } = actions;
    const {
      map,
      selectedBuilding,
      selectedPosition,
      selectedUnit,
      tileSize,
      zIndex,
    } = state;
    const selectBuilding = useCallback(
      (position: Vector, building: Building) =>
        update(this.getState(position, state, null, building)),
      [state, update],
    );
    const selectUnit = useCallback(
      (position: Vector, unit: Unit) =>
        update(this.getState(position, state, unit, null)),
      [state, update],
    );
    if (selectedPosition && selectedBuilding && selectedUnit) {
      return (
        <SelectEntity
          actions={actions}
          onSelectBuilding={selectBuilding}
          onSelectUnit={selectUnit}
          state={state}
        />
      );
    }

    if (selectedPosition && (selectedBuilding || selectedUnit)) {
      const availableActions =
        selectedPosition &&
        selectedUnit &&
        getAvailableUnitActions(
          map,
          selectedPosition,
          selectedUnit,
          map.createVisionObject(selectedUnit.player),
          null,
        );

      return (
        <>
          {availableActions && (
            <ActionWheel
              actions={actions}
              color={map.getCurrentPlayer().id}
              position={selectedPosition}
              tileSize={tileSize}
              zIndex={zIndex}
            >
              <CaptureButton
                actions={actions}
                availableActions={availableActions}
                state={state}
                type={selectedUnit.isCapturing() ? 'stopCapture' : 'capture'}
              />
              <FoldButton
                actions={actions}
                availableActions={availableActions}
                state={state}
              />
              <UnfoldButton
                actions={actions}
                availableActions={availableActions}
                state={state}
              />
            </ActionWheel>
          )}
          <Cursor
            color="red"
            position={selectedPosition}
            size={state.tileSize}
            zIndex={state.zIndex}
          />
        </>
      );
    }

    return null;
  };
}
