import { TileInfo } from '@deities/athena/info/Tile.tsx';
import { Biome } from '@deities/athena/map/Biome.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import InlineTileList from './InlineTileList.tsx';
import TileBox from './TileBox.tsx';

export default function MovementBox({
  biome,
  cost,
  size,
  tiles,
  unitGroups,
  units,
}: {
  biome: Biome;
  cost: number;
  size?: 'tall' | 'medium';
  tiles: ReadonlyArray<TileInfo>;
  unitGroups?: ReadonlyArray<ReadonlyArray<Unit>>;
  units?: ReadonlyArray<Unit>;
}) {
  return (
    <TileBox key={cost}>
      {cost === -1 ? (
        <fbt desc="Label for inaccessible tiles">Inaccessible</fbt>
      ) : cost === 1 ? (
        <fbt desc="Label for normal movement speed">
          Easy: <fbt:param name="cost">{'1'}</fbt:param>
        </fbt>
      ) : cost < 1 ? (
        <fbt desc="Label for fast movement speed">
          Double Speed: <fbt:param name="cost">{'0.5'}</fbt:param>
        </fbt>
      ) : cost === 2 ? (
        <fbt desc="Label for strenuous movement speed">
          Strenuous: <fbt:param name="cost">{'2'}</fbt:param>
        </fbt>
      ) : (
        <fbt desc="Label for strenuous movement speed">
          Exhausting: <fbt:param name="cost">{'3'}</fbt:param>
        </fbt>
      )}
      <InlineTileList
        biome={biome}
        size={size}
        tiles={tiles}
        unitGroups={unitGroups}
        units={units}
      />
    </TileBox>
  );
}
