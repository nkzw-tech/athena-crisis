import { MoveAction } from '@deities/apollo/action-mutators/ActionMutators.tsx';
import applyActionResponse from '@deities/apollo/actions/applyActionResponse.tsx';
import getMovementPath from '@deities/athena/lib/getMovementPath.tsx';
import getPathFields from '@deities/athena/lib/getPathFields.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import { RadiusItem } from '@deities/athena/Radius.tsx';
import addMoveAnimation from '../lib/addMoveAnimation.tsx';
import { RadiusType } from '../Radius.tsx';
import { Actions, State, StateWithActions } from '../Types.tsx';
import ActionWheel, {
  ActionButton,
  CancelActionButton,
} from '../ui/ActionWheel.tsx';
import { resetBehavior, selectFallback } from './Behavior.tsx';
import NullBehavior from './NullBehavior.tsx';

type TransportData = Readonly<{
  moveable: ReadonlyMap<Vector, RadiusItem>;
  path: ReadonlyArray<Vector> | null;
  position: Vector;
  unit: Unit;
}>;

const loadAction = (
  transport: TransportData,
  { optimisticAction, update }: Actions,
  state: State,
) => {
  const { map, selectedPosition } = state;
  if (selectedPosition && transport) {
    const { moveable, path: initialPath, position } = transport;
    const path =
      initialPath || getMovementPath(map, position, moveable, null).path;
    const actionResponse = optimisticAction(
      state,
      MoveAction(selectedPosition, position, path),
    );
    update({
      animations: addMoveAnimation(state.animations, {
        endSound: 'Unit/Load',
        from: selectedPosition,
        onComplete: (state) => ({
          ...state,
          map: applyActionResponse(state.map, state.vision, actionResponse),
          ...resetBehavior(),
        }),
        partial: true,
        path,
        tiles: path.map((vector) => map.getTileInfo(vector)),
      }),
      ...resetBehavior(NullBehavior),
    });
  }
};

export default class Transport {
  public readonly type = 'transport' as const;
  public readonly navigate = true;

  constructor(private transport: TransportData) {}

  select = selectFallback;

  activate(state: State) {
    const { map } = state;
    const { moveable, path: initialPath, position } = this.transport;
    const path =
      initialPath || getMovementPath(map, position, moveable, null).path;
    return {
      radius: {
        fields: getPathFields(path, moveable),
        locked: true,
        path,
        type: RadiusType.Move,
      },
    };
  }

  component = ({ actions, state }: StateWithActions) => {
    const { map, navigationDirection, selectedPosition, tileSize, zIndex } =
      state;
    const { position } = this.transport;
    return selectedPosition ? (
      <ActionWheel
        actions={actions}
        color={map.getCurrentPlayer().id}
        position={position}
        tileSize={tileSize}
        zIndex={zIndex}
      >
        <CancelActionButton
          actions={actions}
          navigationDirection={navigationDirection}
        />
        <ActionButton
          navigationDirection={navigationDirection}
          onClick={() => loadAction(this.transport, actions, state)}
          type="load"
        />
      </ActionWheel>
    ) : null;
  };
}
