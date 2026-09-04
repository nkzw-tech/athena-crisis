import getMovementPath from '@deities/athena/lib/getMovementPath.tsx';
import getPathFields from '@deities/athena/lib/getPathFields.tsx';
import { RadiusType } from '../Radius.tsx';
import { State, StateWithActions } from '../Types.tsx';
import ActionWheel, { ActionButton, CancelActionButton } from '../ui/ActionWheel.tsx';
import { selectFallback } from './Behavior.tsx';
import loadUnitAction, { type TransportData } from './transport/loadUnitAction.tsx';

export default class Transport {
  public readonly type = 'transport' as const;
  public readonly navigate = true;

  constructor(private transport: TransportData) {}

  select = selectFallback;

  activate(state: State) {
    const { map } = state;
    const { moveable, path: initialPath, position } = this.transport;
    const path = initialPath || getMovementPath(map, position, moveable, null).path;
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
    const { map, navigationDirection, selectedPosition, tileSize, zIndex } = state;
    const { position } = this.transport;
    return selectedPosition ? (
      <ActionWheel
        actions={actions}
        color={map.getCurrentPlayer().id}
        position={position}
        tileSize={tileSize}
        zIndex={zIndex}
      >
        <CancelActionButton actions={actions} navigationDirection={navigationDirection} />
        <ActionButton
          label={<fbt desc="Load button label (as short as possible, ideally one word)">Load</fbt>}
          navigationDirection={navigationDirection}
          onClick={() => void loadUnitAction(this.transport, actions, state)}
          type="load"
        />
      </ActionWheel>
    ) : null;
  };
}
