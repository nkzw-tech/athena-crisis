import { css } from '@emotion/css';
import ChevronDown from '@iconify-icons/pixelarticons/chevron-down.js';
import { ReactNode } from 'react';
import Box from './Box.tsx';
import { applyVar } from './cssVar.tsx';
import Icon from './Icon.tsx';
import pixelBorder from './pixelBorder.tsx';
import Stack from './Stack.tsx';

export default function Select({
  children,
  selectedItem,
}: {
  children: ReactNode;
  selectedItem: ReactNode;
}) {
  return (
    <Box className={selectorContainerStyle} flex1>
      <Stack gap nowrap stretch>
        {selectedItem}
        <Icon icon={ChevronDown} />
      </Stack>
      <Box className={selectorStyle} gap={16} vertical>
        {children}
      </Box>
    </Box>
  );
}

const selectorContainerStyle = css`
  cursor: pointer;
  height: 44px;
  position: relative;

  & > div {
    transition-delay: 150ms;
  }
  &:hover > div {
    opacity: 1;
    pointer-events: auto;
    transform: scale(1);
    transition-delay: 0;
  }
`;

const selectorStyle = css`
  ${pixelBorder(applyVar('background-color'))}
  background: ${applyVar('background-color')};

  cursor: initial;
  left: 0;
  opacity: 0;
  overflow-x: auto;
  pointer-events: none;
  position: absolute;
  top: calc(100% - 20px);
  transform: scale(0.9);
  transition:
    opacity 150ms ease,
    transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1);
  width: 100%;
  z-index: 2;
`;
