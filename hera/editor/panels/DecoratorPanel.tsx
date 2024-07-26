import {
  DecoratorInfo,
  getAllDecorators,
} from '@deities/athena/info/Decorator.tsx';
import getBiomeStyle from '@deities/athena/lib/getBiomeStyle.tsx';
import { TileSize } from '@deities/athena/map/Configuration.tsx';
import getFirstOrThrow from '@deities/hephaestus/getFirstOrThrow.tsx';
import Box from '@deities/ui/Box.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { useCallback, useMemo } from 'react';
import InlineTileList from '../../card/InlineTileList.tsx';
import useGridNavigation from '../../hooks/useGridNavigation.tsx';
import navigate from '../../lib/navigate.tsx';
import { StateWithActions } from '../../Types.tsx';
import useColumns from '../hooks/useColumns.tsx';
import DeleteTile from '../lib/DeleteTile.tsx';
import { EditorState } from '../Types.tsx';

const decorators = getAllDecorators();

export default function DecoratorPanel({
  editor,
  setEditorState,
  state,
}: StateWithActions & {
  editor: EditorState;
  setEditorState: (setEditorState: Partial<EditorState>) => void;
}) {
  const { config } = state.map;
  const { biome } = config;
  const biomeStyle = getBiomeStyle(biome);
  const selected = editor?.selected;
  const decorator = selected?.decorator
    ? decorators.find(({ id }) => id === selected.decorator)
    : null;
  const [setRef, getColumns] = useColumns();
  const tiles = useMemo(
    () =>
      decorators.map(({ placeOn }) => {
        const tile = getFirstOrThrow(placeOn);
        return biomeStyle.tileConversions?.get(tile) || tile;
      }),
    [biomeStyle.tileConversions],
  );

  const selectDecorator = useCallback(
    (event: unknown, { decorator }: { decorator?: DecoratorInfo }) => {
      if (decorator) {
        setEditorState({
          selected: {
            decorator: decorator.id,
          },
        });
      }
    },
    [setEditorState],
  );

  useGridNavigation(
    'navigateSecondary',
    useCallback(
      (direction) => {
        const columns = getColumns();
        if (columns == null) {
          return;
        }

        const index =
          (decorator && decorators.indexOf(decorator)) ??
          (selected?.eraseDecorators ? decorators.length : null);

        navigate(direction, columns, index, decorators, [
          (index: number) =>
            selectDecorator(undefined, { decorator: decorators[index] }),
          () => setEditorState({ selected: { eraseDecorators: true } }),
        ]);
      },
      [
        decorator,
        getColumns,
        selectDecorator,
        selected?.eraseDecorators,
        setEditorState,
      ],
    ),
  );

  return (
    <Stack gap={24} verticalPadding>
      <Box gap={32} ref={setRef}>
        <InlineTileList
          biome={biome}
          decorators={decorators}
          lazyDecorators
          onSelect={selectDecorator}
          selected={
            decorator
              ? decorators.findIndex(
                  (currentDecorator) => decorator.id === currentDecorator.id,
                )
              : undefined
          }
          tiles={tiles}
        >
          <DeleteTile
            active={selected?.eraseDecorators}
            onClick={() =>
              setEditorState({ selected: { eraseDecorators: true } })
            }
            scale={2}
            tileSize={TileSize}
          />
        </InlineTileList>
      </Box>
    </Stack>
  );
}
