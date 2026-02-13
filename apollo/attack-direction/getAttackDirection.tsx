import SpriteVector from '@deities/athena/map/SpriteVector.tsx';
import Vector from '@deities/athena/map/Vector.tsx';

export type PlainAttackDirection = 0 | 1 | 2 | 3;

export class AttackDirection {
  constructor(public readonly direction: 'right' | 'left' | 'up' | 'down') {}

  toJSON() {
    return this.direction === 'right'
      ? 0
      : this.direction === 'left'
        ? 1
        : this.direction === 'up'
          ? 2
          : 3;
  }

  static fromJSON(direction: PlainAttackDirection): AttackDirection {
    return new AttackDirection(
      direction === 0 ? 'right' : direction === 1 ? 'left' : direction === 2 ? 'up' : 'down',
    );
  }
}

export const RightAttackDirection = new AttackDirection('right');
export const LeftAttackDirection = new AttackDirection('left');
export const UpAttackDirection = new AttackDirection('up');
export const DownAttackDirection = new AttackDirection('down');

export default function getAttackDirection(
  from: Vector,
  to: Vector,
): [AttackDirection, AttackDirection] {
  const { x, y } = new SpriteVector(to.x - from.x, to.y - from.y);
  let direction: AttackDirection, oppositeDirection: AttackDirection;
  if (x < 0) {
    direction = LeftAttackDirection;
    oppositeDirection = RightAttackDirection;
  } else if (x > 0) {
    direction = RightAttackDirection;
    oppositeDirection = LeftAttackDirection;
  } else if (y < 0) {
    direction = UpAttackDirection;
    oppositeDirection = DownAttackDirection;
  } else {
    /*if (y > 0)*/ direction = DownAttackDirection;
    oppositeDirection = UpAttackDirection;
  }
  return [direction, oppositeDirection];
}
