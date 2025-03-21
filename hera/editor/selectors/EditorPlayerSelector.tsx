import Player, { PlayerID, PlayerIDs } from '@deities/athena/map/Player.tsx';
import isControlElement from '@deities/ui/controls/isControlElement.tsx';
import Stack from '@deities/ui/Stack.tsx';
import parseInteger from '@nkzw/core/parseInteger.js';
import { useEffect } from 'react';
import { Actions } from '../../Types.tsx';
import PlayerIcon from '../../ui/PlayerIcon.tsx';
import changePlayer from '../lib/changePlayer.tsx';
import { SetEditorStateFunction } from '../Types.tsx';

export default function EditorPlayerSelector({
  actions: { update },
  currentPlayer,
  setEditorState,
  vertical,
}: {
  actions: Actions;
  currentPlayer: Player;
  setEditorState: SetEditorStateFunction;
  vertical?: true;
}) {
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
        update(({ map }) => changePlayer(map, id));
      }
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [setEditorState, update]);

  return (
    <Stack gap={16} start vertical={vertical}>
      {PlayerIDs.map((id) => (
        <PlayerIcon
          id={id}
          key={id}
          onClick={() => update(({ map }) => changePlayer(map, id))}
          selected={currentPlayer.id === id}
        />
      ))}
    </Stack>
  );
}
