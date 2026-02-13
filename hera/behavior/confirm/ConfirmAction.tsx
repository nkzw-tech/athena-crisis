import Vector from '@deities/athena/map/Vector.tsx';
import { State, StateLike, StateWithActions } from '../../Types.tsx';
import ActionWheel, { ActionButton, CancelActionButton } from '../../ui/ActionWheel.tsx';

export type ConfirmProps = Readonly<{
  icon: 'attack' | 'heal' | 'move' | 'move-and-wait';
  onAction: (state: State, type?: 'complete' | 'confirm') => StateLike | null;
  position: Vector;
  showComplete?: boolean;
}>;

const MoveAndWait = () => (
  <fbt desc="Move & Wait button label (as short as possible, ideally one word)">Move & Wait</fbt>
);

export default function ConfirmAction({
  actions,
  icon,
  onAction,
  position,
  showComplete,
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
      <CancelActionButton actions={actions} navigationDirection={navigationDirection} />
      <ActionButton
        icon={icon === 'move-and-wait' ? 'complete' : icon}
        label={
          icon === 'move-and-wait' ? (
            <MoveAndWait />
          ) : icon === 'attack' ? (
            <fbt desc="Attack button label (as short as possible, ideally one word)">Attack</fbt>
          ) : icon === 'heal' ? (
            <fbt desc="Heal button label (as short as possible, ideally one word)">Heal</fbt>
          ) : (
            <fbt desc="Move button label (as short as possible, ideally one word)">Move</fbt>
          )
        }
        navigationDirection={navigationDirection}
        onClick={() => update(onAction(state, 'confirm'))}
        type="move"
      />
      {showComplete && (
        <ActionButton
          label={<MoveAndWait />}
          navigationDirection={navigationDirection}
          onClick={() => update(onAction(state, 'complete'))}
          type="complete"
        />
      )}
    </ActionWheel>
  );
}
