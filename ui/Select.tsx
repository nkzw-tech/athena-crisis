import { css, cx } from '@emotion/css';
import ChevronDown from '@iconify-icons/pixelarticons/chevron-down.js';
import { ReactNode } from 'react';
import { BoxStyle } from './Box.tsx';
import { applyVar } from './cssVar.tsx';
import Dropdown from './Dropdown.tsx';
import Icon from './Icon.tsx';
import pixelBorder from './pixelBorder.tsx';
import Stack from './Stack.tsx';

export default function Select({
  children,
  forceOpen,
  selectedItem,
}: {
  children: ReactNode;
  forceOpen?: boolean;
  selectedItem: ReactNode;
}) {
  return (
    <Dropdown
      className={cx(BoxStyle, dropdownStyle, forceOpen && selectedStyle)}
      closeOnSelect
      dropdownClassName={cx(BoxStyle, selectorStyle)}
      forceOpen={forceOpen}
      title={
        <Stack gap nowrap stretch>
          {selectedItem}
          <Icon icon={ChevronDown} />
        </Stack>
      }
    >
      {children}
    </Dropdown>
  );
}

const dropdownStyle = css`
  flex: 1;
  height: 44px;
  min-height: 32px;
  padding: 12px;
`;

const selectorStyle = css`
  ${pixelBorder(applyVar('background-color'))}

  background: ${applyVar('background-color')};
  gap: 16px;
  left: 0;
  min-height: 32px;
  overflow-x: auto;
  padding: 12px;
  top: calc(100% - 20px);
  width: 100%;
`;

const selectedStyle = css`
  ${pixelBorder(undefined, 2)}
`;
