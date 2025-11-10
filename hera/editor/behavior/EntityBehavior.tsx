import getAvailableUnitActions from '@deities/athena/lib/getAvailableUnitActions.tsx';
import Building from '@deities/athena/map/Building.tsx';
import Entity, { isBuilding, isUnit } from '@deities/athena/map/Entity.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import { ReactElement, useCallback } from 'react';
import AbstractSelectBehavior from '../../behavior/AbstractSelectBehavior.tsx';
import { MenuItemProps } from '../../behavior/Menu.tsx';
import Cursor from '../../Cursor.tsx';
import { State, StateLike, StateWithActions } from '../../Types.tsx';
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
      label={
        <fbt desc="Unfold button label (as short as possible, ideally one word)">
          Unfold
        </fbt>
      }
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
      label={
        <fbt desc="Fold button label (as short as possible, ideally one word)">
          Fold
        </fbt>
      }
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
  const isCapturing = selectedUnit?.isCapturing();
  return selectedUnit && selectedPosition && availableActions.has('capture') ? (
    <ActionButton
      label={
        isCapturing ? (
          <fbt desc="Stop Capture button label (as short as possible, ideally one or two words)">
            Stop Capture
          </fbt>
        ) : (
          <fbt desc="Capture button label (as short as possible, ideally one word)">
            Capture
          </fbt>
        )
      }
      navigationDirection={navigationDirection}
      onClick={() => {
        const unit = isCapturing
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
      highlightedPositions: null,
      selectedBuilding: null,
      selectedPosition: null,
      selectedUnit: null,
      showCursor: true,
    };
  }

  onSelect(vector: Vector, state: State, entity: Entity): StateLike | null {
    if (isUnit(entity)) {
      return {
        highlightedPositions: [vector],
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

  canSelectCandidates(state: State, unit: Unit, building: Building) {
    return { building, unit };
  }

  override component = ({
    actions,
    state,
  }: StateWithActions): ReactElement | null => {
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
        update(this.getState(position, state, null, building, actions)),
      [actions, state, update],
    );
    const selectUnit = useCallback(
      (position: Vector, unit: Unit) =>
        update(this.getState(position, state, unit, null, actions)),
      [actions, state, update],
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
