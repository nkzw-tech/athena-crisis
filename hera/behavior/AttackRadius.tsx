import Vector from '@deities/athena/map/Vector.tsx';
import { RadiusItem } from '@deities/athena/Radius.tsx';
import { RadiusType } from '../Radius.tsx';
import { resetBehavior, selectFallback } from './Behavior.tsx';

export default class AttackRadius {
  public readonly type = 'attackRadius' as const;

  constructor(private fields: ReadonlyMap<Vector, RadiusItem>) {}

  activate() {
    return this.fields.size
      ? {
          attackable: null,
          radius: {
            fields: this.fields,
            path: null,
            type: RadiusType.Attack,
          },
          selectedAttackable: null,
          selectedBuilding: null,
          selectedPosition: null,
          selectedUnit: null,
        }
      : resetBehavior();
  }

  select = selectFallback;
}
