import { Plain } from '@deities/athena/info/Tile.tsx';
import convertBiome from '@deities/athena/lib/convertBiome.tsx';
import filterByBiomeRestriction from '@deities/athena/lib/filterByBiomeRestriction.tsx';
import UnlockableBiomes from '@deities/athena/lib/UnlockableBiomes.tsx';
import { Biome, Biomes } from '@deities/athena/map/Biome.tsx';
import MapData from '@deities/athena/MapData.tsx';
import useAlert from '@deities/ui/hooks/useAlert.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { css, cx } from '@emotion/css';
import { fbt } from 'fbtee';
import { useCallback, useMemo } from 'react';
import InlineTileList from '../../card/InlineTileList.tsx';
import useGridNavigation from '../../hooks/useGridNavigation.tsx';
import { UserWithUnlocks } from '../../hooks/useUserMap.tsx';

const unsortedBiomes = new Set(Biomes);
unsortedBiomes.delete(Biome.Spaceship);
const initialBiomes = [...unsortedBiomes, Biome.Spaceship];

export default function BiomeSelector({
  biomes = initialBiomes,
  hasContentRestrictions,
  map,
  navigate,
  onBiomeChange,
  user,
}: {
  biomes?: ReadonlyArray<Biome>;
  hasContentRestrictions: boolean;
  map: MapData;
  navigate?: true;
  onBiomeChange: (map: MapData) => void;
  user: UserWithUnlocks | null;
}) {
  const currentBiome = map.config.biome;
  const { alert } = useAlert();
  const update = useCallback(
    (biome: Biome) => {
      const select = () =>
        onBiomeChange(
          filterByBiomeRestriction(
            convertBiome(map, biome),
            hasContentRestrictions,
            new Set(user?.skills),
          ),
        );

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
    [map, hasContentRestrictions, user?.skills, onBiomeChange, alert],
  );

  const lockedBiomes = useMemo(() => {
    if (!hasContentRestrictions) {
      return new Set();
    }

    const unlockedBiomes = new Set(user?.biomes);
    return new Set(
      [...UnlockableBiomes].filter((biome) => !unlockedBiomes.has(biome)),
    );
  }, [hasContentRestrictions, user?.biomes]);

  useGridNavigation(
    'navigateSecondary',
    useCallback(
      (direction) => {
        if (!navigate) {
          return;
        }
        const maybeBiomes = biomes.filter((biome) => !lockedBiomes.has(biome));
        const maybeBiome =
          maybeBiomes[
            maybeBiomes.indexOf(currentBiome) +
              (direction === 'right' ? 1 : direction === 'left' ? -1 : 0)
          ];
        if (maybeBiome != null) {
          update(maybeBiome);
        }
      },
      [biomes, currentBiome, lockedBiomes, navigate, update],
    ),
  );

  return (
    <Stack center gap>
      {biomes.map((biome) => {
        const isLocked = lockedBiomes.has(biome);
        return (
          <div className={relativeStyle} key={biome}>
            <div className={cx(isLocked && lockedStyle)}>
              <InlineTileList
                biome={biome}
                onSelect={isLocked ? undefined : () => update(biome)}
                scrollIntoView={false}
                selected={currentBiome === biome ? 0 : undefined}
                tiles={[Plain]}
              />
            </div>
            {isLocked && (
              <Stack alignCenter center className={unlockStyle}>
                ?
              </Stack>
            )}
          </div>
        );
      })}
    </Stack>
  );
}

const relativeStyle = css`
  position: relative;
`;

const lockedStyle = css`
  filter: blur(1px) grayscale(0.5);
`;

const unlockStyle = css`
  color: #fff;
  font-size: 2em;
  inset: 0;
  opacity: 0.8;
  padding-left: 5px;
  position: absolute;
  top: -2px;
`;
