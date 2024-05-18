import type Unit from '@deities/athena/map/Unit.tsx';
import vec from '@deities/athena/map/vec.tsx';
import type Vector from '@deities/athena/map/Vector.tsx';
import type MapData from '@deities/athena/MapData.tsx';

export default function getAttackableUnitsWithinRadius(
  map: MapData,
  vector: Vector,
  radius: number,
) {
  const currentPlayer = map.getCurrentPlayer();
  const attackable = new Map<Vector, Unit>();
  for (let x = 0; x <= radius; x++) {
    for (let y = 0; y <= radius - x; y++) {
      const s1 = { x: vector.x + x, y: vector.y + y };
      const v1 = map.contains(s1) && vec(s1.x, s1.y);
      const u1 = v1 && map.units.get(v1);

      const s2 = { x: vector.x + x, y: vector.y - y };
      const v2 = map.contains(s2) && vec(s2.x, s2.y);
      const u2 = v2 && map.units.get(v2);

      const s3 = { x: vector.x - x, y: vector.y + y };
      const v3 = map.contains(s3) && vec(s3.x, s3.y);
      const u3 = v3 && map.units.get(v3);

      const s4 = { x: vector.x - x, y: vector.y - y };
      const v4 = map.contains(s4) && vec(s4.x, s4.y);
      const u4 = v4 && map.units.get(v4);
      if (u1 && map.isOpponent(u1, currentPlayer)) {
        attackable.set(v1, u1);
      }
      if (u2 && map.isOpponent(u2, currentPlayer)) {
        attackable.set(v2, u2);
      }
      if (u3 && map.isOpponent(u3, currentPlayer)) {
        attackable.set(v3, u3);
      }
      if (u4 && map.isOpponent(u4, currentPlayer)) {
        attackable.set(v4, u4);
      }
    }
  }
  return [...attackable];
}
