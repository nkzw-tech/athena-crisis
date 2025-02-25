import { Skill } from '@deities/athena/info/Skill.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import Cursor from '../Cursor.tsx';
import { Actions, State, StateLike, StateWithActions } from '../Types.tsx';
import activateAction from './activate/activateAction.tsx';

export default class SelectTarget {
  public readonly type = 'selectTarget' as const;

  constructor(private readonly skill: Skill) {}

  select(vector: Vector, state: State, actions: Actions): StateLike | null {
    actions.requestFrame(async () => {
      await activateAction(
        actions,
        state,
        { skill: this.skill, type: 'Skill' },
        vector,
      );
    });

    return null;
  }

  component = ({ state }: StateWithActions) => {
    const { position, tileSize, zIndex } = state;

    if (position) {
      return position
        .expandStar()
        .slice(1)
        .map((vector) => (
          <Cursor
            color="red"
            key={String(vector)}
            position={vector}
            size={tileSize}
            zIndex={zIndex}
          />
        ));
    }
    return null;
  };
}
