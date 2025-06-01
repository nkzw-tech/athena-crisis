import { PlayerID } from '@deities/athena/map/Player.tsx';
import vec from '@deities/athena/map/vec.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { RadiusItem } from '@deities/athena/Radius.tsx';
import usePress, { LongPressReactEvents } from '@deities/ui/hooks/usePress.tsx';
import { css, cx } from '@emotion/css';
import parseInteger from '@nkzw/core/parseInteger.js';
import {
  memo,
  RefObject,
  TouchEvent,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import maskClassName, { MaskPointerClassName } from './lib/maskClassName.tsx';
import toTransformOrigin from './lib/toTransformOrigin.tsx';
import { RadiusInfo, RadiusType } from './Radius.tsx';
import { MapEnterType, MessageMap } from './Types.tsx';

enum Priority {
  None = 0,
  Low = 1,
  High = 2,
}

type Offsets = [
  top: number,
  right: number,
  down: number,
  left: number,
  priority: Priority,
];

export const parseVector = (target: EventTarget | null) => {
  const maybeVector = (target as HTMLElement | null)?.getAttribute(
    'data-vector',
  );
  if (maybeVector) {
    try {
      const [x, y] = maybeVector.split(',').map((value) => parseInteger(value));
      return x != null && y != null ? vec(x, y) : null;
    } catch {
      /* empty */
    }
  }
  return null;
};

const getOffsets = (
  map: MapData,
  currentViewer: PlayerID | null,
  vector: Vector,
  radius: RadiusInfo | null,
  attackable: ReadonlyMap<Vector, RadiusItem> | null,
  messages: MessageMap,
  selectedPosition: Vector | null,
): Offsets | null => {
  if (!currentViewer) {
    return null;
  }

  const hasRadius =
    radius?.type !== RadiusType.Attack && radius?.fields.has(vector);

  if (hasRadius) {
    return [4, 4, 4, 4, Priority.Low];
  }

  if (messages.has(vector)) {
    return [1, 1, 1, 1, Priority.High];
  }

  if (attackable?.has(vector)) {
    return [6, 6, 6, 6, Priority.High];
  }

  const building = !hasRadius && map.buildings.get(vector);
  if (
    building &&
    building.info.sprite.size === 'tall' &&
    map.matchesPlayer(currentViewer, building) &&
    !building.isCompleted()
  ) {
    const up = vector.up();
    const buildingUp = map.buildings.get(up);
    const unitUp = map.units.get(up);
    return (!buildingUp || !map.matchesPlayer(currentViewer, buildingUp)) &&
      (!unitUp || !map.matchesPlayer(currentViewer, unitUp))
      ? [12, 6, 6, 6, Priority.Low]
      : [6, 6, 6, 6, Priority.Low];
  }

  const unit = map.units.get(vector);
  if (
    unit &&
    !unit.isCompleted() &&
    (map.matchesPlayer(currentViewer, unit) || selectedPosition?.equals(vector))
  ) {
    return [6, 6, 6, 6, Priority.High];
  }

  if (hasRadius) {
    return [1, 1, 1, 1, Priority.Low];
  }

  return null;
};

export type BaseMaskProps = Readonly<{
  cancel: (
    vector: Vector | null,
    transformOrigin: string | undefined,
    cancel: CustomEvent | null,
    isEscape: boolean,
  ) => void;
  enter: (vector: Vector, _: undefined, type: MapEnterType) => void;
  map: MapData;
  ref: RefObject<HTMLDivElement | null>;
  select: (vector: Vector) => void;
  tileSize: number;
  zIndex: number;
}>;

export default memo(function Mask({
  attackable,
  cancel,
  currentViewer,
  enter,
  expand,
  map,
  messages,
  pointerLock,
  radius,
  ref,
  select,
  selectedPosition,
  showFieldInfo,
  tileSize: size,
  zIndex,
}: BaseMaskProps & {
  attackable: ReadonlyMap<Vector, RadiusItem> | null;
  currentViewer: PlayerID | null;
  expand: boolean;
  messages: MessageMap;
  pointerLock: RefObject<boolean>;
  radius: RadiusInfo | null;
  selectedPosition: Vector | null;
  showFieldInfo: (vector: Vector, origin: string) => void;
}) {
  const onLongPress = useCallback(
    (event: LongPressReactEvents<Element>) => {
      const vector = parseVector(event.target);
      if (!pointerLock.current && vector) {
        showFieldInfo(vector, toTransformOrigin(event));
      }
    },
    [pointerLock, showFieldInfo],
  );

  const lastVectors = useRef<Array<Vector>>([]);
  const props = usePress({
    cancelOnMovement: size,
    onLongPress,
    onPress: useCallback(
      (event) => {
        const vector = parseVector(event.target);
        if (vector) {
          select(vector);
        }
      },
      [select],
    ),
  });

  const onTouchMove = useCallback(
    (event: TouchEvent) => {
      const touch = event.touches[0];
      const vector = parseVector(
        document.elementFromPoint(touch.clientX, touch.clientY),
      );
      if (vector) {
        enter(vector, undefined, 'move');
        if (lastVectors.current.at(-1) !== vector) {
          lastVectors.current.push(vector);
        }
      }
    },
    [enter],
  );

  const onTouchEnd = useCallback(() => {
    if (lastVectors.current.length >= 2) {
      const lastVector = lastVectors.current.at(-1)!;
      if (
        !radius?.locked &&
        (radius?.fields.has(lastVector) || attackable?.has(lastVector))
      ) {
        select(lastVector);
      }
    }

    lastVectors.current = [];
  }, [attackable, radius?.fields, radius?.locked, select]);

  return useMemo(() => {
    const defaultOffsets: Offsets = [0, 0, 0, 0, Priority.None];
    let fields = map.mapFields<[Vector, Offsets]>((vector) => [
      vector,
      (expand &&
        getOffsets(
          map,
          currentViewer,
          vector,
          radius,
          attackable,
          messages,
          selectedPosition,
        )) ||
        defaultOffsets,
    ]);

    // The double pass is necessary to ensure that each field is considered independently without mutations.
    // Note that it mutates the previous entries, ~this is fine~
    fields = fields.map(([vector, offsets]) => {
      const left = fields[map.getTileIndex(vector.left())];
      const up = fields[map.getTileIndex(vector.up())];
      const leftTop = fields[map.getTileIndex(vector.up().left())];
      const rightTop = fields[map.getTileIndex(vector.up().right())];
      if (left && left[1][1] > 0 && offsets[3] > 0) {
        left[1][1] = 0;
        offsets = offsets.slice() as Offsets;
        offsets[3] = 0;
      }

      if (up && up[1][2] > 0 && offsets[0] > 0) {
        up[1][2] = 0;
        offsets = offsets.slice() as Offsets;
        offsets[0] = 0;
      }

      if (leftTop && leftTop[1][1] > 0 && offsets[3] > 0) {
        leftTop[1][1] = 0;
        offsets = offsets.slice() as Offsets;
        offsets[3] = 0;
      }

      if (rightTop && rightTop[1][3] > 0 && offsets[1] > 0) {
        rightTop[1][3] = 0;
        offsets = offsets.slice() as Offsets;
        offsets[1] = 0;
      }
      return [vector, offsets];
    });

    return (
      <div
        className={cx(maskStyle, MaskPointerClassName)}
        onContextMenu={(event) => {
          event.preventDefault();
          cancel(
            parseVector(event.target),
            toTransformOrigin(event),
            null,
            false,
          );
        }}
        onTouchMove={onTouchMove}
        ref={ref}
        {...props()}
      >
        {fields.map(([vector, [up, right, down, left, priority]]) => (
          <div
            className={maskClassName(vector)}
            data-vector={vector}
            key={String(vector)}
            onPointerEnter={() => enter(vector, undefined, 'pointer')}
            onTouchEnd={onTouchEnd}
            style={{
              height: size + up + down,
              left: (vector.x - 1) * size - left,
              position: 'absolute',
              top: (vector.y - 1) * size - up,
              width: size + right + left,
              zIndex: zIndex + priority,
            }}
          />
        ))}
      </div>
    );
    // eslint-disable-next-line react-hooks/react-compiler
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    attackable,
    currentViewer,
    enter,
    expand,
    map.buildings,
    map.size,
    map.units,
    props,
    radius,
    select,
    size,
    zIndex,
  ]);
});

const maskStyle = css`
  cursor: none;

  &.${MaskPointerClassName} {
    cursor: pointer;
  }
`;
