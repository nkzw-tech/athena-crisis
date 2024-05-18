import { spriteImage } from '@deities/art/Sprites.tsx';
import { Shelter } from '@deities/athena/info/Building.tsx';
import type { TileInfo, TileLayer } from '@deities/athena/info/Tile.tsx';
import {
  Campsite,
  getFloatingEdgeAnimation,
  getTileInfo,
} from '@deities/athena/info/Tile.tsx';
import getBiomeStyle from '@deities/athena/lib/getBiomeStyle.tsx';
import getFloatingEdgeModifier from '@deities/athena/lib/getFloatingEdgeModifier.tsx';
import { Biome } from '@deities/athena/map/Biome.tsx';
import vec from '@deities/athena/map/vec.tsx';
import type Vector from '@deities/athena/map/Vector.tsx';
import type { ModifierField } from '@deities/athena/MapData.tsx';
import type MapData from '@deities/athena/MapData.tsx';
import type { VisionT } from '@deities/athena/Vision.tsx';
import useVisibilityState from '@deities/ui/hooks/useVisibilityState.tsx';
import {
  Tiles0,
  Tiles1,
  Tiles2,
  Tiles3,
  Tiles4,
  Tiles5,
  Tiles6,
} from 'athena-crisis:images';
import { memo, useLayoutEffect, useRef } from 'react';
import { useSprites } from './hooks/useSprites.tsx';
import tick, { getFrame, getTick } from './lib/tick.tsx';
import renderFloatingTile from './render/renderFloatingTile.tsx';
import renderTile from './render/renderTile.tsx';

export type TileStyle = 'floating' | 'clip' | 'none';

const clip = (
  context: CanvasRenderingContext2D,
  size: number,
  map: MapData,
) => {
  const {
    config: { biome },
    size: { height, width },
  } = map;
  const right = (width + 1) * size - 1;
  const bottom = (height + 1) * size - 1;
  context.clearRect(size, size, 1, 1);
  context.clearRect(size, bottom, 1, 1);
  context.clearRect(right, bottom, 1, 1);

  const {
    sprite: { noClip },
  } = map.getTileInfo(vec(width, height), 0);
  if (!noClip && noClip !== biome) {
    context.clearRect(right, size, 1, 1);
  }
};

const sprites = {
  [Biome.Grassland]: Tiles0,
  [Biome.Desert]: Tiles1,
  [Biome.Snow]: Tiles2,
  [Biome.Swamp]: Tiles3,
  [Biome.Spaceship]: Tiles4,
  [Biome.Volcano]: Tiles5,
  [Biome.Luna]: Tiles6,
} as const;

const createCanvas = (
  mapSize: { height: number; width: number },
  size: number,
) => {
  const canvas = document.createElement('canvas');
  canvas.height = (mapSize.height + 2) * size;
  canvas.width = (mapSize.width + 2) * size;
  return canvas;
};

export default memo(function Tiles({
  map,
  paused,
  renderEntities = true,
  style,
  tileSize: size,
  vision,
}: {
  map: MapData;
  paused?: boolean;
  renderEntities?: boolean;
  style?: TileStyle;
  tileSize: number;
  vision: VisionT;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<Array<HTMLCanvasElement>>([]);
  const isVisible = useVisibilityState();
  const hasSprites = useSprites('all');
  const { biome } = map.config;
  const biomeStyle = getBiomeStyle(biome);

  useLayoutEffect(() => {
    if (!hasSprites) {
      return;
    }

    if (!canvasRefs.current.length) {
      canvasRefs.current = [
        createCanvas(map.size, size),
        createCanvas(map.size, size),
      ];
    }

    const tileset = {
      buildings: spriteImage('BuildingsShadow', biome),
      structures: spriteImage('StructuresShadow', biome),
      tiles: sprites[biome],
    };

    const [visibleCanvas, mainCanvas] = canvasRefs.current;
    const context = visibleCanvas.getContext('2d')!;
    const mainContext = mainCanvas.getContext('2d')!;
    const currentTick = getTick();

    context.clearRect(0, 0, visibleCanvas.width, visibleCanvas.height);
    mainContext.clearRect(0, 0, mainCanvas.width, mainCanvas.height);

    map.forEachTile(
      (vector: Vector, tile: TileInfo, layer: TileLayer, modifier: number) => {
        renderTile(
          context,
          tileset,
          map,
          vision,
          (!paused && getFrame(tile.sprite, modifier, currentTick)) || 0,
          vector,
          tile,
          modifier,
          size,
          renderEntities,
        );
      },
    );

    const floatingTiles = new Map<Vector, ModifierField>();
    if (style === 'floating') {
      for (let x = 0; x <= map.size.width + 1; x++) {
        for (let y = 0; y <= map.size.height + 1; y++) {
          const vector = vec(x, y);
          const modifier = getFloatingEdgeModifier(map, vector);
          if (modifier) {
            const modifier0 = Array.isArray(modifier) ? modifier[0] : modifier;
            if (getFloatingEdgeAnimation(modifier0, map.config.biome)) {
              floatingTiles.set(vector, modifier);
            }
            renderFloatingTile(
              context,
              mainContext,
              tileset,
              map,
              vision,
              vector,
              modifier,
              currentTick,
              size,
              paused,
            );
          }
        }
      }
    }

    mainContext.drawImage(visibleCanvas, 0, 0);

    if (style === 'clip') {
      clip(mainContext, size, map);
    }

    if (ref.current) {
      ref.current.innerHTML = '';
      if (!mainCanvas.parentNode) {
        ref.current.append(mainCanvas);
      }
    }

    if (!paused && isVisible) {
      return tick((tick) => {
        map.forEachField((vector: Vector) => {
          const tile =
            map.buildings.get(vector)?.info === Shelter
              ? Campsite
              : map.getTileInfo(vector, 0);
          const modifier = map.getModifier(vector, 0);
          const frame = getFrame(tile.sprite, modifier, tick);

          const layer1Tile = map.getTile(vector, 1);
          const layer1TileInfo =
            layer1Tile != null ? getTileInfo(layer1Tile) : null;

          const renderLayer0 =
            frame != null ||
            (layer1TileInfo?.sprite?.animation && !tile.sprite.animation);
          if (renderLayer0) {
            mainContext.clearRect(vector.x * size, vector.y * size, size, size);
            context.clearRect(vector.x * size, vector.y * size, size, size);
            renderTile(
              context,
              tileset,
              map,
              vision,
              frame || 0,
              vector,
              tile,
              modifier,
              size,
              renderEntities,
            );
          }

          if (
            layer1TileInfo &&
            (renderLayer0 || layer1TileInfo?.sprite.animation)
          ) {
            const layer1Modifier = map.getModifier(vector, 1);
            renderTile(
              context,
              tileset,
              map,
              vision,
              getFrame(layer1TileInfo.sprite, layer1Modifier, tick) || 0,
              vector,
              layer1TileInfo,
              layer1Modifier,
              size,
              renderEntities,
            );
          }
        });

        for (const [vector, modifier] of floatingTiles) {
          renderFloatingTile(
            context,
            mainContext,
            tileset,
            map,
            vision,
            vector,
            modifier,
            tick,
            size,
            paused,
            true,
          );
        }

        mainContext.drawImage(visibleCanvas, 0, 0);
        if (style === 'clip') {
          clip(mainContext, size, map);
        }
      });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    biome,
    biomeStyle.palette,
    hasSprites,
    isVisible,
    map.buildings,
    map.config,
    map.currentPlayer,
    map.map,
    map.modifiers,
    map.size,
    paused,
    renderEntities,
    size,
    style,
    vision,
  ]);

  return (
    <div
      style={{
        height: map.size.height * size,
        overflow: style !== 'floating' ? 'hidden' : 'initial',
        pointerEvents: 'none',
        position: 'absolute',
        width: map.size.width * size,
      }}
    >
      <div
        ref={ref}
        style={{
          left: -size,
          position: 'absolute',
          top: -size,
        }}
      />
    </div>
  );
});
