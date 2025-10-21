import { Plain } from '@deities/athena/info/Tile.tsx';
import { mapUnitsWithContentRestriction } from '@deities/athena/info/Unit.tsx';
import { Biome } from '@deities/athena/map/Biome.tsx';
import {
  AnimationConfig,
  TileSize,
} from '@deities/athena/map/Configuration.tsx';
import { PlayerIDs } from '@deities/athena/map/Player.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { SquareButtonStyle } from '@deities/ui/Button.tsx';
import useInput from '@deities/ui/controls/useInput.tsx';
import { css, cx } from '@emotion/css';
import randomEntry from '@nkzw/core/randomEntry.js';
import Stack from '@nkzw/stack';
import { arrayToShuffled } from 'array-shuffle';
import { MouseEvent, useCallback, useMemo, useState } from 'react';
import { useSprites } from '../../hooks/useSprites.tsx';
import toTransformOrigin from '../../lib/toTransformOrigin.tsx';
import Tick from '../../Tick.tsx';
import { MapInfoState } from '../../Types.tsx';
import UnitTile from '../../Unit.tsx';
import GameDialog from '../GameDialog.tsx';

const UnitPreview = ({
  onClick,
  unit,
}: {
  onClick?: (event: MouseEvent, unit: Unit) => void;
  unit: Unit;
}) => (
  <div
    className={cx(unitPreviewStyle, SquareButtonStyle)}
    onClick={(event) => onClick?.(event, unit)}
    title={unit.info.name}
  >
    <div style={{ zoom: 2 }}>
      <UnitTile
        animationConfig={AnimationConfig}
        biome={Biome.Grassland}
        firstPlayerID={1}
        size={TileSize}
        tile={Plain}
        unit={unit}
      />
    </div>
  </div>
);

const playerIDs = PlayerIDs.slice(1);

const map = MapData.createMap({
  map: [1],
  modifiers: [0],
  teams: playerIDs.map((id) => ({
    id,
    name: '',
    players: [{ funds: 0, id, name: `User-${id}`, teamId: id }],
  })),
});

export default function UnitPreviews() {
  const hasSprites = useSprites('all');

  const [gameInfoState, setGameInfoState] = useState<MapInfoState | null>(null);

  useInput('cancel', () => setGameInfoState(null), 'top');

  const showGameInfo = useCallback((event: MouseEvent, unit: Unit) => {
    setGameInfoState({
      origin: toTransformOrigin(event),
      type: 'map-info',
      unit,
      vector: vec(1, 1),
    });
  }, []);

  const unitPreviews = useMemo(
    () =>
      arrayToShuffled(
        mapUnitsWithContentRestriction((unit) => unit, new Set())
          .filter(
            (unit) =>
              unit.characterName !== 'Unknown' &&
              unit.characterDescription !== 'Unknown',
          )
          .map((unit) => {
            const player = randomEntry(playerIDs) || playerIDs[0];
            return (
              <UnitPreview
                key={unit.id}
                onClick={(event) =>
                  showGameInfo(event, unit.create(player, { name: -1 }))
                }
                unit={unit.create(player)}
              />
            );
          }),
      ).slice(0, 5),
    [showGameInfo],
  );

  return hasSprites ? (
    <>
      <Tick animationConfig={AnimationConfig}>
        <Stack center gap={24}>
          {unitPreviews}
        </Stack>
      </Tick>
      {gameInfoState && (
        <GameDialog
          onClose={() => setGameInfoState(null)}
          playerAchievement={null}
          state={
            {
              currentViewer: gameInfoState.unit?.player || map.getPlayer(1).id,
              gameInfoState,
              lastActionResponse: null,
              map,
              playerDetails: new Map(),
            } as const
          }
        />
      )}
    </>
  ) : null;
}

const unitPreviewStyle = css`
  cursor: pointer;
`;
