import Vector from '@deities/athena/map/Vector.tsx';
import { Actions, State, StateLike } from '../../Types.tsx';
import { EditorState } from '../Types.tsx';

export default class VectorBehavior {
  public readonly type = 'vector' as const;

  enter(
    vector: Vector,
    state: State,
    actions: Actions,
    editor?: EditorState,
  ): StateLike | null {
    return editor?.isDrawing ? this.put(vector, state, actions, editor) : null;
  }

  private put(
    vector: Vector,
    state: State,
    { setEditorState }: Actions,
    editor: EditorState,
  ): StateLike | null {
    const { map } = state;
    const { config } = map;
    const { condition } = editor;
    if (condition) {
      const [winCondition, index] = condition;
      const winConditions = [...config.winConditions];

      const vectors = new Set(winCondition.vectors);
      vectors[editor.isErasing ? 'delete' : 'add'](vector);
      const newWinCondition = {
        ...winCondition,
        vectors,
      };
      winConditions[index] = newWinCondition;
      setEditorState({
        condition: [newWinCondition, index],
      });
      return {
        map: map.copy({
          config: config.copy({
            winConditions,
          }),
        }),
      };
    }
    return null;
  }
}
