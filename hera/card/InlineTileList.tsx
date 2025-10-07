import { DecoratorInfo } from '@deities/athena/info/Decorator.tsx';
import { SpriteVariant } from '@deities/athena/info/SpriteVariants.tsx';
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
import { SquareButtonStyle } from '@deities/ui/Button.tsx';
import usePress, { LongPressReactEvents } from '@deities/ui/hooks/usePress.tsx';
import useScrollIntoView from '@deities/ui/hooks/useScrollIntoView.tsx';
import { css, cx } from '@emotion/css';
import random from '@nkzw/core/random.js';
import Stack from '@nkzw/stack';
import { useInView } from 'framer-motion';
import {
  ComponentProps,
  MouseEvent,
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
import useUnitState from '../hooks/useUnitState.tsx';
import TileDecorators from '../TileDecorators.tsx';
import Tiles from '../Tiles.tsx';
import { TimerFunction } from '../Types.tsx';
import UnitTile from '../Unit.tsx';

export type TileSelection = Readonly<{
  building?: Building;
  decorator?: DecoratorInfo;
  index: number;
  tile: TileInfo;
  unit?: Unit;
}>;

export type SelectTileFn = (
  event: MouseEvent | LongPressReactEvents<Element>,
  selection: TileSelection,
) => void;

const vision = new Vision(1);
const vector = vec(1, 1);
const scheduleTimer: TimerFunction = (fn, delay) =>
  Promise.resolve(setTimeout(fn, delay) as unknown as number);

export default function InlineTileList({
  biome,
  buildings,
  children,
  cycleUnitState,
  decorators,
  extraInfos,
  gap = true,
  lazyDecorators,
  onLongPress,
  onSelect,
  scale = 2,
  scrollIntoView = true,
  selected,
  size,
  tiles,
  unitCustomizations,
  unitGroups,
  units,
}: {
  biome: Biome;
  buildings?: ReadonlyArray<Building | undefined>;
  children?: ReactNode;
  cycleUnitState?: true;
  decorators?: ReadonlyArray<DecoratorInfo>;
  extraInfos?: ReadonlyArray<ReadonlyArray<ReactNode>>;
  gap?: ComponentProps<typeof Stack>['gap'];
  lazyDecorators?: boolean;
  onLongPress?: SelectTileFn;
  onSelect?: SelectTileFn;
  scale?: number;
  scrollIntoView?: boolean;
  selected?: number;
  size?: 'medium' | 'tall';
  tiles: ReadonlyArray<TileInfo>;
  unitCustomizations?: ReadonlyArray<SpriteVariant>;
  unitGroups?: ReadonlyArray<ReadonlyArray<Unit>>;
  units?: ReadonlyArray<Unit | undefined>;
}) {
  const hasSprites = useSprites('all');
  const [showCursor, setShowCursor] = useState<number | undefined>();
  const hideCursor = useCallback(() => setShowCursor(undefined), []);
  return (
    <Stack gap={gap} wrap>
      {tilesToTileMap(tiles).map((tile, index) => (
        <InlineTile
          biome={biome}
          building={buildings?.[index]}
          cycleUnitState={!!cycleUnitState}
          decorator={decorators?.[index]}
          extraInfos={extraInfos?.[index]}
          hasSprites={hasSprites}
          hideCursor={hideCursor}
          index={index}
          key={index}
          lazyDecorators={lazyDecorators}
          onLongPress={onLongPress}
          onSelect={onSelect}
          scale={scale}
          scrollIntoView={scrollIntoView}
          selected={selected}
          setShowCursor={setShowCursor}
          showCursor={showCursor}
          size={size}
          tile={tiles[index]}
          tileField={tile}
          unit={units?.[index]}
          unitCustomization={
            !unitGroups?.[index] ? unitCustomizations?.[index] : undefined
          }
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
  cycleUnitState,
  decorator,
  extraInfos,
  hasSprites,
  hideCursor,
  index,
  lazyDecorators,
  onLongPress,
  onSelect,
  scale,
  scrollIntoView,
  selected,
  setShowCursor,
  showCursor,
  size,
  tile,
  tileField,
  unit: initialUnit,
  unitCustomization,
  unitGroup,
}: {
  biome: Biome;
  building?: Building;
  cycleUnitState: boolean;
  decorator?: DecoratorInfo;
  extraInfos?: ReadonlyArray<ReactNode>;
  hasSprites: boolean;
  hideCursor: () => void;
  index: number;
  lazyDecorators?: boolean;
  onLongPress?: SelectTileFn;
  onSelect?: SelectTileFn;
  scale: number;
  scrollIntoView: boolean;
  selected?: number;
  setShowCursor: (index: number) => void;
  showCursor: number | undefined;
  size?: 'tall' | 'medium';
  tile: TileInfo;
  tileField: TileField;
  unit?: Unit;
  unitCustomization?: SpriteVariant;
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

  useScrollIntoView(ref, scrollIntoView ? isSelected : false);

  const props = usePress({
    onLongPress: useCallback(
      (event) =>
        onLongPress?.(event, { building, decorator, index, tile, unit }),
      [building, decorator, index, onLongPress, tile, unit],
    ),
    onPress: useCallback(
      (event) => onSelect?.(event, { building, decorator, index, tile, unit }),
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
        style={{ zoom: scale }}
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
        {isVisible &&
          hasSprites &&
          unit &&
          (cycleUnitState ? (
            <InlineUnitWithUnitState
              biome={biome}
              customSprite={unitCustomization}
              isHighlighted={isHighlighted}
              isSelected={isSelected}
              offset={index}
              tile={tile}
              unit={unit}
            />
          ) : (
            <InlineUnit
              biome={biome}
              customSprite={unitCustomization}
              isHighlighted={isHighlighted}
              isSelected={isSelected}
              tile={tile}
              unit={unit}
            />
          ))}
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

const InlineUnit = ({
  biome,
  isHighlighted,
  isSelected,
  tile,
  unit,
  ...props
}: {
  biome: Biome;
  isHighlighted: boolean;
  isSelected: boolean;
  tile: TileInfo;
  unit: Unit;
} & Pick<
  ComponentProps<typeof UnitTile>,
  'animation' | 'direction' | 'highlightStyle' | 'customSprite'
>) => (
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
    tile={tile}
    unit={unit}
    {...props}
  />
);

const InlineUnitWithUnitState = ({
  biome,
  customSprite,
  isHighlighted,
  isSelected,
  offset,
  tile,
  unit,
}: {
  biome: Biome;
  isHighlighted: boolean;
  isSelected: boolean;
  offset: number;
  tile: TileInfo;
  unit: Unit;
} & Pick<ComponentProps<typeof UnitTile>, 'customSprite'>) => {
  const [entity, , props] = useUnitState(
    unit,
    biome,
    AnimationConfig.AnimationDuration * offset,
  );
  return (
    <InlineUnit
      biome={biome}
      customSprite={customSprite}
      isHighlighted={isHighlighted}
      isSelected={isSelected}
      tile={tile}
      unit={entity}
      {...props}
    />
  );
};

const tileInfoStyle = css`
  height: ${TileSize}px;
  image-rendering: pixelated;
  position: relative;
  width: ${TileSize}px;
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
