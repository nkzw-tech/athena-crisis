import Player, { PlayerID } from '@deities/athena/map/Player.tsx';
import isControlElement from '@deities/ui/controls/isControlElement.tsx';
import parseInteger from '@nkzw/core/parseInteger.js';
import Stack from '@nkzw/stack';
import { useEffect } from 'react';
import { Actions } from '../../Types.tsx';
import PlayerIcon from '../../ui/PlayerIcon.tsx';
import changePlayer from '../lib/changePlayer.tsx';
import getEditorPlayerIDs, { isEditorPlayerID } from '../lib/getEditorPlayerIDs.tsx';
import { SetEditorStateFunction } from '../Types.tsx';

export default function EditorPlayerSelector({
  actions: { update },
  currentPlayer,
  isAdmin,
  setEditorState,
  vertical,
}: {
  actions: Actions;
  currentPlayer: Player;
  isAdmin?: boolean;
  setEditorState: SetEditorStateFunction;
  vertical?: true;
}) {
  const playerIDs = getEditorPlayerIDs(isAdmin);
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (isControlElement() || event.metaKey || event.ctrlKey) {
        return;
      }

      const key = event.code === 'Backquote' ? 0 : (parseInteger(event.key) as PlayerID | null);
      const id = key != null && isEditorPlayerID(key, isAdmin) ? key : null;
      if (id != null) {
        update(({ map }) => changePlayer(map, id));
      }
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [isAdmin, setEditorState, update]);

  return (
    <Stack gap={16} vertical={vertical} wrap>
      {playerIDs.map((id) => (
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
