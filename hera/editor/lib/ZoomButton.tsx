import { SquareButtonStyle } from '@deities/ui/Button.tsx';
import useInput from '@deities/ui/controls/useInput.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import MenuButton from '@deities/ui/MenuButton.tsx';
import pixelBorder from '@deities/ui/pixelBorder.tsx';
import { css, cx } from '@emotion/css';
import { useCallback } from 'react';
import { SetZoomFn } from '../hooks/useZoom.tsx';

export default function ZoomButton({
  className,
  fade,
  hide,
  max,
  position,
  setZoom,
  zoom,
}: {
  className?: string;
  fade?: boolean;
  hide: boolean;
  max: number;
  position: 'bottom' | 'top' | 'auto';
  setZoom: SetZoomFn;
  zoom: number;
}) {
  const min = Math.max(1, max - 2);
  const updateZoom = useCallback(
    () => setZoom((zoomLevel) => (zoomLevel + 1 > max ? min : zoomLevel + 1)),
    [max, min, setZoom],
  );
  useInput('zoom', updateZoom);

  return (
    <MenuButton
      className={cx(
        position === 'top'
          ? topStyle
          : position === 'bottom'
            ? bottomStyle
            : null,
        className,
      )}
      fade={fade}
      hide={hide}
      onClick={updateZoom}
    >
      <div className={cx(SquareButtonStyle, zoomContainerStyle)}>
        <div className={zoomTextStyle}>{zoom - min + 1}x</div>
      </div>
    </MenuButton>
  );
}

const topStyle = css`
  right: env(safe-area-inset-right);
  top: ${applyVar('safe-area-top')};
`;

const bottomStyle = css`
  right: env(safe-area-inset-right);
  bottom: ${applyVar('safe-area-bottom')};
`;

const zoomContainerStyle = css`
  position: absolute;
  inset: 0;
`;

const zoomTextStyle = css`
  ${pixelBorder(applyVar('text-color'), 3)}

  align-items: center;
  display: flex;
  font-size: 0.4em;
  height: 32px;
  justify-content: center;
  margin: 8px;
  padding-left: 2px;
  width: 32px;
`;
