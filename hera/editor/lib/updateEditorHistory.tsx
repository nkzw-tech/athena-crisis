import { RefObject } from 'react';
import { EditorHistory, UndoEntry } from '../Types.tsx';

export default function updateEditorHistory(
  undoContext: RefObject<EditorHistory>,
  entry: UndoEntry,
) {
  const { undoStack, undoStackIndex } = undoContext.current;

  const lastKey = undoStack.at(undoStackIndex != null ? undoStackIndex : -1)?.[0];
  const indexModifier = entry[0] === lastKey ? 0 : 1;

  undoContext.current = {
    undoStack: [
      ...undoStack.slice(
        0,
        undoStackIndex != null ? undoStackIndex + indexModifier : indexModifier ? undefined : -1,
      ),
      entry,
    ],
    undoStackIndex: null,
  };
}
