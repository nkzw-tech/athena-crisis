import Storage from '@deities/ui/Storage.tsx';
import { EditorState, SetEditorStateFunction, UndoEntry } from '../Types.tsx';

export const UNDO_STACK_KEY = (id: string | undefined) =>
  `map-editor-undo-stack-${id ? `${id}` : 'fallback'}`;

export const UNDO_STACK_INDEX_KEY = (id: string | undefined) =>
  `map-editor-undo-stack-index-${id ? `${id}` : 'fallback'}`;

export default function updateUndoStack(
  { setEditorState }: { setEditorState: SetEditorStateFunction },
  { undoStack, undoStackIndex }: EditorState,
  entry: UndoEntry,
  id: string | undefined,
) {
  const lastKey = undoStack.at(
    undoStackIndex != null ? undoStackIndex : -1,
  )?.[0];
  const indexModifier = entry[0] === lastKey ? 0 : 1;

  setEditorState({
    undoStack: [
      ...undoStack.slice(
        0,
        undoStackIndex != null
          ? undoStackIndex + indexModifier
          : indexModifier
            ? undefined
            : -1,
      ),
      entry,
    ],
    undoStackIndex: null,
  });

  const stack = undoStack.map(([key, value]) => [key, value.toJSON()]);

  Storage.setItem(UNDO_STACK_KEY(id), JSON.stringify(stack));
}
