import { spriteImage } from '@deities/art/Sprites.tsx';
import { Shelter } from '@deities/athena/info/Building.tsx';
import {
  Campsite,
  getFloatingEdgeAnimation,
  getTileInfo,
  TileInfo,
  TileLayer,
} from '@deities/athena/info/Tile.tsx';
import getBiomeStyle from '@deities/athena/lib/getBiomeStyle.tsx';
import getFloatingEdgeModifier from '@deities/athena/lib/getFloatingEdgeModifier.tsx';
import indexToVector from '@deities/athena/lib/indexToVector.tsx';
import { Biome } from '@deities/athena/map/Biome.tsx';
import vec from '@deities/athena/map/vec.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData, { ModifierField } from '@deities/athena/MapData.tsx';
import { VisionT } from '@deities/athena/Vision.tsx';
import useVisibilityState from '@nkzw/use-visibility-state';
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
  [Biome.Desert]: Tiles1,
  [Biome.Grassland]: Tiles0,
  [Biome.Luna]: Tiles6,
  [Biome.Snow]: Tiles2,
  [Biome.Spaceship]: Tiles4,
  [Biome.Swamp]: Tiles3,
  [Biome.Volcano]: Tiles5,
} as const;

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isVisible = useVisibilityState();
  const hasSprites = useSprites('all');
  const { biome } = map.config;
  const biomeStyle = getBiomeStyle(biome);

  useLayoutEffect(() => {
    if (!hasSprites || !canvasRef.current) {
      return;
    }

    const tileset = {
      buildings: spriteImage('BuildingsShadow', biome),
      structures: spriteImage('StructuresShadow', biome),
      tiles: sprites[biome],
    };

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d')!;
    const currentTick = getTick();

    context.clearRect(0, 0, canvas.width, canvas.height);

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

    if (style === 'clip') {
      clip(context, size, map);
    }

    if (!paused && isVisible) {
      return tick((tick) => {
        for (let i = 0; i < map.map.length; i++) {
          const vector = indexToVector(i, map.size.width);
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
        }

        for (const [vector, modifier] of floatingTiles) {
          renderFloatingTile(
            context,
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

        if (style === 'clip') {
          clip(context, size, map);
        }
      });
    }

    // eslint-disable-next-line react-hooks/react-compiler
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
      >
        <canvas
          height={(map.size.height + 2) * size}
          ref={canvasRef}
          width={(map.size.width + 2) * size}
        />
      </div>
    </div>
  );
});
