import { ResizeOrigin } from '@deities/apollo/lib/resizeMap.tsx';
import { MaxSize, MinSize, TileSize } from '@deities/athena/map/Configuration.tsx';
import { SizeVector } from '@deities/athena/MapData.tsx';
import cssVar, { applyVar } from '@deities/ui/cssVar.tsx';
import { css, cx } from '@emotion/css';
import parseInteger from '@nkzw/core/parseInteger.js';
import { MouseEvent as ReactMouseEvent, useCallback, useEffect, useRef, useState } from 'react';

type Size = Readonly<{ x: number; y: number }>;

const getSizeVectorPlusOne = (size: SizeVector) =>
  new SizeVector(Math.min(MaxSize, size.width + 1), Math.min(MaxSize, size.height + 1));

const limit = (value: number, dimension: number) =>
  Math.min(MaxSize, Math.max(MinSize, dimension + Math.round(value / TileSize)));

const limitSize = (delta: Size, size: SizeVector) => {
  return {
    x: limit(delta.x, size.width) * TileSize,
    y: limit(delta.y, size.height) * TileSize,
  };
};

const getScale = (element: HTMLElement | null) =>
  (element && parseInteger(getComputedStyle(element).getPropertyValue(cssVar('scale')))) || 2;

const getSize = (
  element: HTMLElement,
  size: SizeVector,
  start: Size,
  event: MouseEvent,
  origin: Set<ResizeOrigin>,
) => {
  const scale = getScale(element);
  return limitSize(
    {
      x: ((event.pageX - start.x) / scale) * (origin.has('left') ? -1 : 1),
      y: ((event.pageY - start.y) / scale) * (origin.has('top') ? -1 : 1),
    },
    size,
  );
};

export default function ResizeHandle({
  isVisible,
  onResize,
  size,
  zIndex,
}: {
  isVisible: boolean;
  onResize: (size: SizeVector, origin: Set<ResizeOrigin>) => void;
  size: SizeVector;
  zIndex: number;
}) {
  const [start, setStart] = useState<Size | null>(null);
  const [currentSize, setCurrentSize] = useState<Size | null>(null);
  const [origin, setOrigin] = useState<Set<ResizeOrigin> | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const resizeMap = useCallback(
    (event: MouseEvent) => {
      if (ref.current && start && origin) {
        setCurrentSize(getSize(ref.current, size, start, event, origin));
      }
    },
    [origin, size, start],
  );

  const resizeStart = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>, origin: Set<ResizeOrigin>) => {
      event.stopPropagation();
      setOrigin(origin);
      setCurrentSize({
        x: size.width,
        y: size.height,
      });
      setStart({ x: event.pageX, y: event.pageY });
    },
    [size],
  );

  const resizeStop = useCallback(
    (event: MouseEvent) => {
      if (ref.current && start && origin) {
        const { x, y } = getSize(ref.current, size, start, event, origin);
        onResize(new SizeVector(x / TileSize, y / TileSize), origin);
        document.removeEventListener('mousemove', resizeMap);
        setStart(null);
      }
    },
    [size, start, onResize, origin, resizeMap],
  );

  useEffect(() => {
    window.addEventListener('mousemove', resizeMap);
    window.addEventListener('mouseup', resizeStop);

    return () => {
      window.removeEventListener('mousemove', resizeMap);
      window.removeEventListener('mouseup', resizeStop);
    };
  }, [resizeStart, resizeMap, resizeStop]);

  return (
    <div className={cx(style, (start || isVisible) && visibleStyle)}>
      <div
        className={cx(dragHandleStyle)}
        onDoubleClick={() => onResize(getSizeVectorPlusOne(size), new Set(['top', 'left']))}
        onMouseDown={(event) => event.stopPropagation()}
        onPointerDown={(event) => resizeStart(event, new Set(['top', 'left']))}
        ref={ref}
        style={{
          left: 0,
          top: 0,
          transform: `scale(2) rotate(180deg)`,
          zIndex: zIndex + 1,
        }}
      />
      <div
        className={dragHandleStyle}
        onDoubleClick={() => onResize(getSizeVectorPlusOne(size), new Set(['top', 'right']))}
        onMouseDown={(event) => event.stopPropagation()}
        onPointerDown={(event) => resizeStart(event, new Set(['top', 'right']))}
        ref={ref}
        style={{
          right: 0,
          top: 0,
          transform: `scale(2) rotate(-90deg)`,
          zIndex: zIndex + 1,
        }}
      />
      <div
        className={dragHandleStyle}
        onDoubleClick={() => onResize(getSizeVectorPlusOne(size), new Set(['bottom', 'left']))}
        onMouseDown={(event) => event.stopPropagation()}
        onPointerDown={(event) => resizeStart(event, new Set(['bottom', 'left']))}
        ref={ref}
        style={{
          bottom: 0,
          left: 0,
          transform: `scale(2) rotate(90deg)`,
          zIndex: zIndex + 1,
        }}
      />
      <div
        className={dragHandleStyle}
        onDoubleClick={() => onResize(getSizeVectorPlusOne(size), new Set(['bottom', 'right']))}
        onMouseDown={(event) => event.stopPropagation()}
        onPointerDown={(event) => resizeStart(event, new Set(['bottom', 'right']))}
        ref={ref}
        style={{
          bottom: 0,
          right: 0,
          transform: 'scale(2)',
          zIndex: zIndex + 1,
        }}
      />
      {start && (
        <div
          className={dragIndicatorStyle}
          style={{
            bottom: origin?.has('top') ? 0 : undefined,
            height: currentSize?.y,
            left: origin?.has('right') ? 0 : undefined,
            right: origin?.has('left') ? 0 : undefined,
            top: origin?.has('bottom') ? 0 : undefined,
            width: currentSize?.x,
            zIndex,
          }}
        />
      )}
    </div>
  );
}

const style = css`
  opacity: 0;
  transition: opacity 150ms ease;
`;

const visibleStyle = css`
  opacity: 1;
`;

const dragHandleStyle = css`
  height: 6px;
  max-height: 6px;
  max-width: 6px;
  min-height: 6px;
  min-width: 6px;
  overflow: hidden;
  position: absolute;
  resize: both;
  width: 6px;
`;

const dragIndicatorStyle = css`
  border: 2px dotted ${applyVar('border-color')};
  position: absolute;
`;
