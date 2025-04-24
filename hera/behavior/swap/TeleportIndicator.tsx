import getTeleportTarget from '@deities/apollo/lib/getTeleportTarget.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import Cursor from '../../Cursor.tsx';
import { State } from '../../Types.tsx';

export default function TeleportIndicator({
  state,
  unit,
  vector,
}: {
  state: State;
  unit: Unit | null;
  vector: Vector | null;
}) {
  if (!vector || !unit) {
    return null;
  }

  const { map, tileSize, zIndex } = state;
  const teleportTile = getTeleportTarget(map, unit, vector);

  return (
    teleportTile && (
      <Cursor
        color="red"
        key={String(teleportTile)}
        position={teleportTile}
        size={tileSize}
        zIndex={zIndex}
      />
    )
  );
}
