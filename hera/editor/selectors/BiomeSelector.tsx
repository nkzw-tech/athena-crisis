import { Plain } from '@deities/athena/info/Tile.tsx';
import convertBiome from '@deities/athena/lib/convertBiome.tsx';
import { Biome, Biomes } from '@deities/athena/map/Biome.tsx';
import MapData from '@deities/athena/MapData.tsx';
import Box from '@deities/ui/Box.tsx';
import useAlert from '@deities/ui/hooks/useAlert.tsx';
import { fbt } from 'fbt';
import React, { useCallback, useMemo } from 'react';
import UnlockableBiomes from '../../../zeus/game/UnlockableBiomes.tsx';
import InlineTileList from '../../card/InlineTileList.tsx';
import useGridNavigation from '../../hooks/useGridNavigation.tsx';
import { UserWithFactionNameAndUnlocks } from '../../hooks/useUserMap.tsx';
import { State } from '../../Types.tsx';

const biomes = new Set(Biomes);
biomes.delete(Biome.Spaceship);
const SortedBiomes = [...biomes, Biome.Spaceship];

export default function BiomeSelector({
  hasContentRestrictions,
  onBiomeChange,
  state,
  user,
}: {
  hasContentRestrictions: boolean;
  onBiomeChange: (map: MapData) => void;
  state: State;
  user: UserWithFactionNameAndUnlocks;
}) {
  const {
    map: {
      config: { biome: currentBiome },
    },
  } = state;
  const { alert } = useAlert();
  const update = useCallback(
    (biome: Biome) => {
      const select = () => onBiomeChange(convertBiome(state.map, biome));
      if (biome === Biome.Spaceship) {
        alert({
          onAccept: select,
          text: fbt(
            'This biome has a restricted tileset. Some tiles, buildings and units will be removed when switching to this biome.',
            'Confirmation text for biome change',
          ),
        });
      } else {
        select();
      }
    },
    [alert, onBiomeChange, state.map],
  );

  const biomes = useMemo(
    () =>
      hasContentRestrictions
        ? SortedBiomes.filter(
            (biome) =>
              !UnlockableBiomes.has(biome) || user.biomes.includes(biome),
          )
        : SortedBiomes,
    [hasContentRestrictions, user.biomes],
  );

  useGridNavigation(
    'navigateSecondary',
    useCallback(
      (direction) => {
        const maybeBiome =
          biomes[
            biomes.indexOf(currentBiome) +
              (direction === 'right' ? 1 : direction === 'left' ? -1 : 0)
          ];
        if (maybeBiome != null) {
          update(maybeBiome);
        }
      },
      [biomes, currentBiome, update],
    ),
  );

  return (
    <Box center gap>
      {biomes.map((biome) => (
        <InlineTileList
          biome={biome}
          key={biome}
          onSelect={() => update(biome)}
          selected={currentBiome === biome ? 0 : undefined}
          tiles={[Plain]}
        />
      ))}
    </Box>
  );
}
