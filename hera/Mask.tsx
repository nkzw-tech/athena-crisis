import type { PlayerID } from '@deities/athena/map/Player.tsx';
import vec from '@deities/athena/map/vec.tsx';
import type Vector from '@deities/athena/map/Vector.tsx';
import type MapData from '@deities/athena/MapData.tsx';
import type { RadiusItem } from '@deities/athena/Radius.tsx';
import parseInteger from '@deities/hephaestus/parseInteger.tsx';
import type { LongPressReactEvents } from '@deities/ui/hooks/usePress.tsx';
import usePress from '@deities/ui/hooks/usePress.tsx';
import { css, cx } from '@emotion/css';
import type { MutableRefObject, RefObject } from 'react';
import React, { memo, useCallback, useMemo } from 'react';
import maskClassName, { MaskPointerClassName } from './lib/maskClassName.tsx';
import toTransformOrigin from './lib/toTransformOrigin.tsx';
import type { RadiusInfo } from './Radius.tsx';
import { RadiusType } from './Radius.tsx';
import type { MapEnterType } from './Types.tsx';

enum Priority {
  High = 2,
  Low = 1,
  None = 0,
}
type Offsets = [
  top: number,
  right: number,
  down: number,
  left: number,
  priority: Priority,
];

const parseVector = (maybeVector: string | null) => {
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
    isEscape: boolean,
  ) => void;
  enter: (vector: Vector, _: undefined, type: MapEnterType) => void;
  map: MapData;
  maskRef: RefObject<HTMLDivElement>;
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
  maskRef,
  pointerLock,
  radius,
  select,
  selectedPosition,
  showFieldInfo,
  tileSize: size,
  zIndex,
}: BaseMaskProps & {
  attackable: ReadonlyMap<Vector, RadiusItem> | null;
  currentViewer: PlayerID | null;
  expand: boolean;
  pointerLock: MutableRefObject<boolean>;
  radius: RadiusInfo | null;
  selectedPosition: Vector | null;
  showFieldInfo: (vector: Vector, origin: string) => void;
}) {
  const onLongPress = useCallback(
    (event: LongPressReactEvents<Element>) => {
      const vector = parseVector(
        (event.target as HTMLElement)?.getAttribute('data-vector'),
      );
      if (!pointerLock.current && vector) {
        showFieldInfo(vector, toTransformOrigin(event));
      }
    },
    [pointerLock, showFieldInfo],
  );

  const props = usePress({
    cancelOnMovement: size,
    onLongPress,
    onPress: useCallback(
      (event) => {
        const vector = parseVector(
          (event.target as HTMLElement)?.getAttribute('data-vector'),
        );
        if (vector) {
          select(vector);
        }
      },
      [select],
    ),
  });

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
            parseVector(
              (event.target as HTMLElement)?.getAttribute('data-vector'),
            ),
            toTransformOrigin(event),
            false,
          );
        }}
        ref={maskRef}
        {...props()}
      >
        {fields.map(([vector, [up, right, down, left, priority]]) => (
          <div
            className={maskClassName(vector)}
            data-vector={vector}
            key={String(vector)}
            onPointerEnter={() => enter(vector, undefined, 'pointer')}
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
