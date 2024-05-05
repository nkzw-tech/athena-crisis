import { PlayerID, PlayerIDs } from '@deities/athena/map/Player.tsx';
import parseInteger from '@deities/hephaestus/parseInteger.tsx';
import isControlElement from '@deities/ui/controls/isControlElement.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { useEffect } from 'react';
import { Actions, State } from '../../Types.tsx';
import PlayerIcon from '../../ui/PlayerIcon.tsx';
import changePlayer from '../lib/changePlayer.tsx';
import { EditorState, SetEditorStateFunction } from '../Types.tsx';

export default function EditorPlayerSelector({
  actions,
  editor,
  setEditorState,
  state,
}: {
  actions: Actions;
  editor: EditorState;
  setEditorState: SetEditorStateFunction;
  state: State;
}) {
  const currentPlayer = state.map.getCurrentPlayer();

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (isControlElement() || event.metaKey || event.ctrlKey) {
        return;
      }

      const key =
        event.code === 'Backquote'
          ? 0
          : (parseInteger(event.key) as PlayerID | null);
      const id = key != null && PlayerIDs.includes(key) ? key : null;
      if (id != null) {
        changePlayer(state, actions, id);
      }
    };
    document.body.addEventListener('keydown', listener);
    return () => document.body.removeEventListener('keydown', listener);
  }, [actions, editor, setEditorState, state]);

  return (
    <Stack gap={16} start>
      {PlayerIDs.map((id) => (
        <PlayerIcon
          id={id}
          key={id}
          onClick={() => changePlayer(state, actions, id)}
          selected={currentPlayer.id === id}
        />
      ))}
    </Stack>
  );
}
