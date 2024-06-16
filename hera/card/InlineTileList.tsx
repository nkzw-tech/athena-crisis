import { DecoratorInfo } from '@deities/athena/info/Decorator.tsx';
import {
  TileField,
  TileInfo,
  tilesToTileMap,
} from '@deities/athena/info/Tile.tsx';
import { singleTilesToModifiers } from '@deities/athena/lib/singleTilesToModifiers.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import { Biome } from '@deities/athena/map/Biome.tsx';
import Building from '@deities/athena/map/Building.tsx';
import {
  AnimationConfig,
  DecoratorsPerSide,
  TileSize,
} from '@deities/athena/map/Configuration.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import Vision from '@deities/athena/Vision.tsx';
import random from '@deities/hephaestus/random.tsx';
import { SquareButtonStyle } from '@deities/ui/Button.tsx';
import usePress from '@deities/ui/hooks/usePress.tsx';
import useScrollIntoView from '@deities/ui/hooks/useScrollIntoView.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { css, cx } from '@emotion/css';
import { useInView } from 'framer-motion';
import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import BuildingTile from '../Building.tsx';
import Cursor from '../Cursor.tsx';
import Decorators from '../Decorators.tsx';
import tileFieldHasAnimation from '../editor/lib/tileFieldHasAnimation.tsx';
import { useSprites } from '../hooks/useSprites.tsx';
import TileDecorators from '../TileDecorators.tsx';
import Tiles from '../Tiles.tsx';
import { TimerFunction } from '../Types.tsx';
import UnitTile from '../Unit.tsx';

export type SelectTileFn = (selection: {
  building?: Building;
  decorator?: DecoratorInfo;
  index: number;
  tile: TileInfo;
  unit?: Unit;
}) => void;

const vision = new Vision(1);
const vector = vec(1, 1);
const scheduleTimer: TimerFunction = (fn, delay) =>
  Promise.resolve(setTimeout(fn, delay));

export default function InlineTileList({
  biome,
  buildings,
  children,
  decorators,
  extraInfos,
  lazyDecorators,
  onLongPress,
  onSelect,
  selected,
  size,
  tiles,
  unitGroups,
  units,
}: {
  biome: Biome;
  buildings?: ReadonlyArray<Building | undefined>;
  children?: ReactNode;
  decorators?: ReadonlyArray<DecoratorInfo>;
  extraInfos?: ReadonlyArray<ReadonlyArray<ReactNode>>;
  lazyDecorators?: boolean;
  onLongPress?: SelectTileFn;
  onSelect?: SelectTileFn;
  selected?: number;
  size?: 'medium' | 'tall';
  tiles: ReadonlyArray<TileInfo>;
  unitGroups?: ReadonlyArray<ReadonlyArray<Unit>>;
  units?: ReadonlyArray<Unit | undefined>;
}) {
  const hasSprites = useSprites('all');
  const [showCursor, setShowCursor] = useState<number | undefined>();
  const hideCursor = useCallback(() => setShowCursor(undefined), []);
  return (
    <Stack gap start>
      {tilesToTileMap(tiles).map((tile, index) => (
        <InlineTile
          biome={biome}
          building={buildings?.[index]}
          decorator={decorators?.[index]}
          extraInfos={extraInfos?.[index]}
          hasSprites={hasSprites}
          hideCursor={hideCursor}
          index={index}
          key={index}
          lazyDecorators={lazyDecorators}
          onLongPress={onLongPress}
          onSelect={onSelect}
          selected={selected}
          setShowCursor={setShowCursor}
          showCursor={showCursor}
          size={size}
          tile={tiles[index]}
          tileField={tile}
          unit={units?.[index]}
          unitGroup={unitGroups?.[index]}
        />
      ))}
      {children}
    </Stack>
  );
}

const InlineTile = ({
  biome,
  building,
  decorator,
  extraInfos,
  hasSprites,
  hideCursor,
  index,
  lazyDecorators,
  onLongPress,
  onSelect,
  selected,
  setShowCursor,
  showCursor,
  size,
  tile,
  tileField,
  unit: initialUnit,
  unitGroup,
}: {
  biome: Biome;
  building?: Building;
  decorator?: DecoratorInfo;
  extraInfos?: ReadonlyArray<ReactNode>;
  hasSprites: boolean;
  hideCursor: () => void;
  index: number;
  lazyDecorators?: boolean;
  onLongPress?: SelectTileFn;
  onSelect?: SelectTileFn;
  selected?: number;
  setShowCursor: (index: number) => void;
  showCursor: number | undefined;
  size?: 'tall' | 'medium';
  tile: TileInfo;
  tileField: TileField;
  unit?: Unit;
  unitGroup?: ReadonlyArray<Unit>;
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const isVisible = useInView(ref);
  const isSelected = selected === index;
  const isHighlighted = showCursor === index;

  const [currentUnitId, setCurrentUnitId] = useState(0);
  const interval = useMemo(() => random(5, 15) * 300, []);

  const unit = initialUnit || unitGroup?.[currentUnitId];
  const extraInfo = extraInfos?.[currentUnitId];

  useEffect(() => {
    if (!initialUnit && unitGroup?.length) {
      const timer = setInterval(
        () =>
          setCurrentUnitId((id) => (unitGroup.length <= id + 1 ? 0 : id + 1)),
        interval,
      );
      return () => clearInterval(timer);
    }
  }, [initialUnit, interval, unitGroup?.length]);

  const map = useMemo(() => {
    const baseMap = MapData.createMap({
      config: { biome },
      decorators: decorator
        ? [[DecoratorsPerSide - 2, DecoratorsPerSide, decorator.id]]
        : undefined,
      map: [tileField],
      modifiers: [0],
      size: { height: 1, width: 1 },
    });
    return singleTilesToModifiers(
      withModifiers(
        baseMap.copy({
          buildings: building
            ? baseMap.buildings.set(vector, building)
            : baseMap.buildings,
          units: unit ? baseMap.units.set(vector, unit) : baseMap.units,
        }),
      ),
    );
  }, [biome, building, decorator, tileField, unit]);

  useScrollIntoView(ref, isSelected);

  const props = usePress({
    onLongPress: useCallback(
      () => onLongPress?.({ building, decorator, index, tile, unit }),
      [building, decorator, index, onLongPress, tile, unit],
    ),
    onPress: useCallback(
      () => onSelect?.({ building, decorator, index, tile, unit }),
      [building, decorator, onSelect, tile, unit, index],
    ),
  });

  return (
    <div>
      <div
        className={cx(
          tileInfoStyle,
          size === 'tall' && tallStyle,
          size === 'medium' && mediumStyle,
          onSelect && cursorStyle,
          onSelect && SquareButtonStyle,
          onSelect && customSquareButtonStyle,
          isSelected && largeStyle,
        )}
        key={index}
        onMouseEnter={
          onSelect && !(isHighlighted || isSelected)
            ? () => setShowCursor(index)
            : undefined
        }
        onMouseLeave={onSelect && isHighlighted ? hideCursor : undefined}
        {...props()}
        ref={ref}
      >
        <Tiles
          map={map}
          paused={!isVisible || !tileFieldHasAnimation(tileField)}
          style="clip"
          tileSize={TileSize}
          vision={vision}
        />
        {(!lazyDecorators || isVisible) && decorator && (
          <Decorators
            map={map}
            paused={!isVisible || !decorator.animation}
            tileSize={TileSize}
          />
        )}
        <TileDecorators
          getLayer={() => 0}
          isVisible
          map={map}
          tileSize={TileSize}
          vector={vector}
          vision={vision}
        />
        {isVisible && hasSprites && building && (
          <BuildingTile
            absolute
            animationConfig={AnimationConfig}
            biome={biome}
            building={building}
            highlight={isSelected}
            maybeOutline={isHighlighted}
            position={vector}
            requestFrame={requestAnimationFrame}
            scheduleTimer={scheduleTimer}
            size={TileSize}
          />
        )}
        {isVisible && hasSprites && unit && (
          <UnitTile
            absolute
            animationConfig={AnimationConfig}
            animationKey={vector}
            biome={biome}
            firstPlayerID={1}
            getLayer={() => 0}
            highlightStyle={
              isSelected ? 'move' : isHighlighted ? 'move-null' : undefined
            }
            maybeOutline={isHighlighted}
            position={vector}
            requestFrame={requestAnimationFrame}
            scheduleTimer={scheduleTimer}
            size={TileSize}
            tile={map.getTileInfo(vector)}
            unit={unit}
          />
        )}
        {isHighlighted || isSelected ? (
          <Cursor
            color={isSelected ? 'red' : null}
            position={vector}
            size={TileSize}
            zIndex={3}
          />
        ) : null}
      </div>
      {extraInfo != null && <div className={extraInfoStyle}>{extraInfo}</div>}
    </div>
  );
};

const tileInfoStyle = css`
  height: ${TileSize}px;
  image-rendering: pixelated;
  position: relative;
  width: ${TileSize}px;
  zoom: 2;
`;

const cursorStyle = css`
  cursor: pointer;
`;

const tallStyle = css`
  margin-top: ${TileSize / 1.5}px;
`;

const mediumStyle = css`
  margin-top: ${TileSize / 2}px;
`;

const customSquareButtonStyle = css`
  &.hover,
  &:hover {
    transform: scale(1.085);
  }
`;

const largeStyle = css`
  transform: scale(1.085);
`;

const extraInfoStyle = css`
  margin-top: 4px;
  text-align: center;
`;
