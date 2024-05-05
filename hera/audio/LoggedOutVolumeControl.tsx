import { DoubleSize } from '@deities/athena/map/Configuration.tsx';
import MenuButton from '@deities/ui/MenuButton.tsx';
import { css, cx } from '@emotion/css';
import { ComponentProps } from 'react';
import VolumeControl from './VolumeControl.tsx';

export default function LoggedOutVolumeControl({
  className,
  ...props
}: Omit<ComponentProps<typeof MenuButton>, 'children'>) {
  return (
    <MenuButton {...props} className={cx(style)}>
      <VolumeControl />
    </MenuButton>
  );
}

const size = DoubleSize;
const style = css`
  align-items: center;
  bottom: 0;
  cursor: initial;
  display: flex;
  font-size: 1em;
  justify-content: center;
  min-height: ${size}px;
  overflow: hidden;
  padding: 0;
  right: 0;
  width: auto;
  z-index: 1;
`;
