import {
  CaptureAction,
  CompleteUnitAction,
  CreateTracksAction,
  FoldAction,
  SupplyAction,
  UnfoldAction,
} from '@deities/apollo/action-mutators/ActionMutators.tsx';
import applyActionResponse from '@deities/apollo/actions/applyActionResponse.tsx';
import getAttackableEntitiesInRange from '@deities/athena/lib/getAttackableEntitiesInRange.tsx';
import getAvailableUnitActions, {
  UnitActionTypes,
} from '@deities/athena/lib/getAvailableUnitActions.tsx';
import { UnitsWithPosition } from '@deities/athena/lib/getUnitsByPositions.tsx';
import getUnitsToRefill from '@deities/athena/lib/getUnitsToRefill.tsx';
import { CreateTracksCost } from '@deities/athena/map/Configuration.tsx';
import Vector, { sortByVectorKey } from '@deities/athena/map/Vector.tsx';
import { moveable } from '@deities/athena/Radius.tsx';
import useInput from '@deities/ui/controls/useInput.tsx';
import { fbt } from 'fbt';
import addFlashAnimation from '../lib/addFlashAnimation.tsx';
import animateSupply from '../lib/animateSupply.tsx';
import { RadiusType } from '../Radius.tsx';
import { Actions, State, StateLike, StateWithActions } from '../Types.tsx';
import ActionWheel, { ActionButton } from '../ui/ActionWheel.tsx';
import AttackBehavior from './Attack.tsx';
import { resetBehavior, selectFallback } from './Behavior.tsx';
import captureAction from './capture/captureAction.tsx';
import CreateBuildingBehavior from './CreateBuilding.tsx';
import createTracksAction from './createTracks/createTracksAction.tsx';
import DropUnit from './DropUnit.tsx';
import Heal from './Heal.tsx';
import Move from './Move.tsx';
import Rescue from './Rescue.tsx';
import Sabotage from './Sabotage.tsx';
import unfoldAction from './unfold/unfoldAction.tsx';

const completeAction = (
  { optimisticAction, update }: Actions,
  state: State,
) => {
  const { map, selectedPosition, vision } = state;
  if (selectedPosition) {
    update({
      map: applyActionResponse(
        map,
        vision,
        optimisticAction(state, CompleteUnitAction(selectedPosition)),
      ),
      position: selectedPosition,
      ...resetBehavior(),
    });
  }
};

export type MenuItemProps = StateWithActions & {
  availableActions: ReadonlySet<UnitActionTypes>;
};

const UnfoldButton = ({ actions, availableActions, state }: MenuItemProps) => {
  const { navigationDirection, selectedPosition } = state;
  return selectedPosition && availableActions.has('unfold') ? (
    <ActionButton
      navigationDirection={navigationDirection}
      onClick={() =>
        unfoldAction(
          actions,
          actions.optimisticAction(state, UnfoldAction(selectedPosition)),
          selectedPosition,
          'unfold',
          state,
        )
      }
      type="unfold"
    />
  ) : null;
};

const FoldButton = ({ actions, availableActions, state }: MenuItemProps) => {
  const { navigationDirection, selectedPosition } = state;
  return selectedPosition && availableActions.has('fold') ? (
    <ActionButton
      navigationDirection={navigationDirection}
      onClick={() =>
        unfoldAction(
          actions,
          actions.optimisticAction(state, FoldAction(selectedPosition)),
          selectedPosition,
          'fold',
          state,
        )
      }
      type="fold"
    />
  ) : null;
};

const attackAction = (
  { update }: Actions,
  { attackable, selectedPosition }: State,
) => {
  if (selectedPosition) {
    update({
      attackable,
      behavior: new AttackBehavior(),
      position: selectedPosition,
    });
  }
};

const AttackButton = ({ actions, availableActions, state }: MenuItemProps) =>
  availableActions.has('attack') ? (
    <ActionButton
      hasShift={availableActions.has('createBuildings')}
      navigationDirection={state.navigationDirection}
      onClick={() => attackAction(actions, state)}
      type="attack"
    />
  ) : null;

const dropUnitAction = ({ update }: Actions, { selectedPosition }: State) => {
  if (selectedPosition) {
    update({
      behavior: new DropUnit(),
      position: selectedPosition,
    });
  }
};

const DropUnitButton = ({ actions, availableActions, state }: MenuItemProps) =>
  availableActions.has('drop') ? (
    <ActionButton
      navigationDirection={state.navigationDirection}
      onClick={() => dropUnitAction(actions, state)}
      type="drop"
    />
  ) : null;

const buildAction = ({ update }: Actions, { selectedPosition }: State) => {
  if (selectedPosition) {
    update({
      behavior: new CreateBuildingBehavior(),
      position: selectedPosition,
    });
  }
};

const BuildButton = ({ actions, availableActions, state }: MenuItemProps) =>
  availableActions.has('createBuildings') ? (
    <ActionButton
      navigationDirection={state.navigationDirection}
      onClick={() => buildAction(actions, state)}
      shift={availableActions.has('attack')}
      type="createBuildings"
    />
  ) : null;

const BuildTracksButton = ({
  actions,
  availableActions,
  state,
}: MenuItemProps) => {
  const {
    animations,
    map,
    navigationDirection,
    selectedPosition,
    selectedUnit,
  } = state;
  return selectedPosition &&
    selectedUnit &&
    availableActions.has('createTracks') ? (
    <ActionButton
      navigationDirection={navigationDirection}
      onClick={() => {
        if (map.getPlayer(selectedUnit).funds >= CreateTracksCost) {
          const actionResponse = actions.optimisticAction(
            state,
            CreateTracksAction(selectedPosition),
          );
          if (actionResponse.type === 'CreateTracks') {
            createTracksAction(actions, actionResponse);
          }
        } else {
          actions.update({
            animations: addFlashAnimation(animations, {
              children: fbt('Not enough funds!', 'Error message'),
              color: 'error',
              position: selectedPosition,
            }),
            ...resetBehavior(),
          });
        }
      }}
      type="createTracks"
    />
  ) : null;
};

const CaptureButton = ({ actions, availableActions, state }: MenuItemProps) => {
  const { navigationDirection, selectedPosition } = state;
  return selectedPosition && availableActions.has('capture') ? (
    <ActionButton
      navigationDirection={navigationDirection}
      onClick={() =>
        captureAction(
          actions,
          ...actions.action(state, CaptureAction(selectedPosition)),
          selectedPosition,
        )
      }
      type="capture"
    />
  ) : null;
};

const supplyAction = (
  { optimisticAction, update }: Actions,
  state: State,
  unitsToRefill: UnitsWithPosition,
) => {
  const { selectedPosition } = state;
  if (selectedPosition) {
    const actionResponse = optimisticAction(
      state,
      SupplyAction(selectedPosition),
    );
    update({
      ...resetBehavior(),
      ...animateSupply(state, sortByVectorKey(unitsToRefill), (state) => ({
        ...state,
        map: applyActionResponse(state.map, state.vision, actionResponse),
      })),
      position: selectedPosition,
    });
  }
};

const SupplyButton = ({ actions, availableActions, state }: MenuItemProps) => {
  const { map, navigationDirection, selectedPosition, selectedUnit, vision } =
    state;
  return selectedPosition && selectedUnit && availableActions.has('supply') ? (
    <ActionButton
      navigationDirection={navigationDirection}
      onClick={() =>
        supplyAction(
          actions,
          state,
          getUnitsToRefill(
            map,
            vision,
            map.getPlayer(selectedUnit),
            selectedPosition,
          ),
        )
      }
      type="supply"
    />
  ) : null;
};

const HealButton = ({
  actions: { update },
  availableActions,
  state: { navigationDirection },
}: MenuItemProps) =>
  availableActions.has('heal') ? (
    <ActionButton
      navigationDirection={navigationDirection}
      onClick={() =>
        update({
          behavior: new Heal(),
        })
      }
      type="heal"
    />
  ) : null;

const RescueButton = ({
  actions: { update },
  availableActions,
  state: { navigationDirection },
}: MenuItemProps) =>
  availableActions.has('rescue') ? (
    <ActionButton
      navigationDirection={navigationDirection}
      onClick={() =>
        update({
          behavior: new Rescue(),
        })
      }
      type="rescue"
    />
  ) : null;

const SabotageButton = ({
  actions: { update },
  availableActions,
  state: { navigationDirection },
}: MenuItemProps) =>
  availableActions.has('sabotage') ? (
    <ActionButton
      navigationDirection={navigationDirection}
      onClick={() =>
        update({
          behavior: new Sabotage(),
        })
      }
      type="sabotage"
    />
  ) : null;

export default class Menu {
  public readonly type = 'menu' as const;
  public readonly navigate = true;

  activate({ map, selectedPosition, selectedUnit, vision }: State) {
    const attackableFields =
      selectedPosition && selectedUnit
        ? new Map(
            [
              ...getAttackableEntitiesInRange(map, selectedPosition, vision),
            ].filter(([vector]) =>
              selectedUnit.canAttackAt(
                selectedPosition.distance(vector),
                map.getPlayer(selectedUnit),
              ),
            ),
          )
        : null;

    return {
      attackable: attackableFields,
    };
  }

  deactivate() {
    return {
      attackable: null,
      navigationDirection: null,
    };
  }

  select(vector: Vector, state: State, actions: Actions): StateLike | null {
    const { map, selectedPosition, selectedUnit, vision } = state;
    if (selectedPosition?.equals(vector) && selectedUnit?.isCapturing()) {
      const fields = moveable(vision.apply(map), selectedUnit, vector);
      return fields?.size
        ? {
            behavior: new Move(),
            radius: {
              fields: fields || new Map(),
              path: null,
              type: RadiusType.Move,
            },
          }
        : resetBehavior();
    }
    return selectFallback(vector, state, actions);
  }

  component = ({ actions, state }: StateWithActions) => {
    const {
      attackable,
      map,
      navigationDirection,
      selectedPosition,
      selectedUnit,
      tileSize,
      vision,
      zIndex,
    } = state;
    const availableActions =
      selectedPosition &&
      selectedUnit &&
      getAvailableUnitActions(
        map,
        selectedPosition,
        selectedUnit,
        vision,
        attackable,
      );

    useInput(
      'tertiary',
      (event) => {
        if (availableActions) {
          event.preventDefault();
          completeAction(actions, state);
        }
      },
      'menu',
    );

    if (availableActions) {
      return (
        <ActionWheel
          actions={actions}
          color={map.getCurrentPlayer().id}
          position={selectedPosition}
          tileSize={tileSize}
          zIndex={zIndex}
        >
          <ActionButton
            navigationDirection={navigationDirection}
            onClick={() => completeAction(actions, state)}
            type="complete"
          />
          <AttackButton
            actions={actions}
            availableActions={availableActions}
            state={state}
          />
          <BuildButton
            actions={actions}
            availableActions={availableActions}
            state={state}
          />
          <BuildTracksButton
            actions={actions}
            availableActions={availableActions}
            state={state}
          />
          <CaptureButton
            actions={actions}
            availableActions={availableActions}
            state={state}
          />
          <FoldButton
            actions={actions}
            availableActions={availableActions}
            state={state}
          />
          <HealButton
            actions={actions}
            availableActions={availableActions}
            state={state}
          />
          <RescueButton
            actions={actions}
            availableActions={availableActions}
            state={state}
          />
          <SabotageButton
            actions={actions}
            availableActions={availableActions}
            state={state}
          />
          <SupplyButton
            actions={actions}
            availableActions={availableActions}
            state={state}
          />
          <UnfoldButton
            actions={actions}
            availableActions={availableActions}
            state={state}
          />
          <DropUnitButton
            actions={actions}
            availableActions={availableActions}
            state={state}
          />
        </ActionWheel>
      );
    }
    return null;
  };
}
