import parseInteger from '@deities/hephaestus/parseInteger.tsx';
import Box from '@deities/ui/Box.tsx';
import { css, cx } from '@emotion/css';
import { useFps } from 'react-fps';
import useHide from '../../hooks/useHide.tsx';
import maybeFade from '../../ui/lib/maybeFade.tsx';

export default function Fps() {
  const hidden = useHide();
  const { avgFps, currentFps } = useFps(20);
  return currentFps != null ? (
    <Box blur center className={cx(style, maybeFade(hidden))}>
      {currentFps} fps/{parseInteger(avgFps)} avg
    </Box>
  ) : null;
}

const style = css`
  bottom: 10px;
  font-size: 12px;
  height: 12px;
  left: 0;
  line-height: 12px;
  margin: 0 auto;
  min-height: auto;
  padding: 0 8px;
  pointer-events: none;
  position: fixed;
  right: 0;
  white-space: nowrap;
  width: 124px;
  z-index: 1000;
`;
