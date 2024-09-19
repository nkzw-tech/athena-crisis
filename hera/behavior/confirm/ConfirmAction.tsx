import Vector from '@deities/athena/map/Vector.tsx';
import { State, StateLike, StateWithActions } from '../../Types.tsx';
import ActionWheel, {
  ActionButton,
  ActionButtonType,
  CancelActionButton,
} from '../../ui/ActionWheel.tsx';

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
      <CancelActionButton
        actions={actions}
        navigationDirection={navigationDirection}
      />
      <ActionButton
        icon={icon}
        label={
          <fbt desc="Move button label (as short as possible, ideally one word)">
            Move
          </fbt>
        }
        navigationDirection={navigationDirection}
        onClick={() => update(onAction(state, 'confirm'))}
        type="confirm"
      />
      {complete && (
        <ActionButton
          icon={icon}
          label={
            <fbt desc="Wait button label (as short as possible, ideally one word)">
              Wait
            </fbt>
          }
          navigationDirection={navigationDirection}
          onClick={() => update(onAction(state, 'complete'))}
          type="complete"
        />
      )}
    </ActionWheel>
  );
}
