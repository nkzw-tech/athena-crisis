import type {
  EditorState,
  SetEditorStateFunction,
  UndoEntry,
} from '../Types.tsx';

export default function updateUndoStack(
  { setEditorState }: { setEditorState: SetEditorStateFunction },
  { undoStack, undoStackIndex }: EditorState,
  entry: UndoEntry,
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
}
