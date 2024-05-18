import type Vector from '@deities/athena/map/Vector.tsx';
import type { State, StateLike, StateWithActions } from '../../Types.tsx';
import type { ActionButtonType } from '../../ui/ActionWheel.tsx';
import ActionWheel, { ActionButton } from '../../ui/ActionWheel.tsx';
import { resetBehavior } from '../Behavior.tsx';

export type ConfirmProps = Readonly<{
  icon?: ActionButtonType;
  onAction: (state: State, type?: 'confirm' | 'complete') => StateLike | null;
  position: Vector;
  showComplete?: boolean;
}>;

export default function ConfirmAction({
  actions,
  icon,
  onAction,
  position,
  showComplete: complete,
  state,
}: StateWithActions & ConfirmProps) {
  const { update } = actions;
  const { map, navigationDirection, tileSize, zIndex } = state;
  return (
    <ActionWheel
      actions={actions}
      color={map.getCurrentPlayer().id}
      position={position}
      tileSize={tileSize}
      zIndex={zIndex}
    >
      <ActionButton
        navigationDirection={navigationDirection}
        onClick={() => update(resetBehavior())}
        type="close"
      />
      <ActionButton
        icon={icon}
        navigationDirection={navigationDirection}
        onClick={() => update(onAction(state, 'confirm'))}
        type="confirm"
      />
      {complete && (
        <ActionButton
          icon={icon}
          navigationDirection={navigationDirection}
          onClick={() => update(onAction(state, 'complete'))}
          type="complete"
        />
      )}
    </ActionWheel>
  );
}
