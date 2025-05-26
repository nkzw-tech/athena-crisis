import { getBuildingInfoOrThrow } from '@deities/athena/info/Building.tsx';
import { getTileInfo, Plain } from '@deities/athena/info/Tile.tsx';
import { getUnitInfoOrThrow } from '@deities/athena/info/Unit.tsx';
import { AnimationConfig } from '@deities/athena/map/Configuration.tsx';
import MapData from '@deities/athena/MapData.tsx';
import Box from '@deities/ui/Box.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { useMemo } from 'react';
import InlineTileList from '../card/InlineTileList.tsx';
import getAnyBuildingTileField from '../lib/getAnyBuildingTileField.tsx';
import getAnyUnitTile from '../lib/getAnyUnitTile.tsx';
import Tick from '../Tick.tsx';

export default function MapBlockList({ map }: { map: MapData }) {
  const currentPlayer = map.getFirstPlayerID();
  const { config } = map;
  const { biome, blocklistedBuildings, blocklistedUnits } = config;

  const buildings = useMemo(
    () =>
      [...blocklistedBuildings].map((id) =>
        getBuildingInfoOrThrow(id).create(currentPlayer),
      ),
    [blocklistedBuildings, currentPlayer],
  );

  const units = useMemo(
    () =>
      [...blocklistedUnits].map((id) =>
        getUnitInfoOrThrow(id).create(currentPlayer),
      ),
    [blocklistedUnits, currentPlayer],
  );

  const tiles = useMemo(
    () => [
      ...units.map((unit) => getAnyUnitTile(unit.info) || Plain),
      ...buildings.map((building) =>
        getTileInfo(getAnyBuildingTileField(building.info)),
      ),
    ],
    [buildings, units],
  );

  return buildings.length || units.length ? (
    <Tick animationConfig={AnimationConfig}>
      <Box vertical>
        <h2>
          <fbt desc="Headline for restricted entities on a map">
            Restricted Entities
          </fbt>
        </h2>
        <Stack alignNormal>
          <InlineTileList
            biome={biome}
            buildings={[...Array(units.length).fill(undefined), ...buildings]}
            size={buildings.length ? 'tall' : 'medium'}
            tiles={tiles}
            units={units}
          />
        </Stack>
      </Box>
    </Tick>
  ) : null;
}
