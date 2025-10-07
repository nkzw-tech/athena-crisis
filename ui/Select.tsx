import { css, cx } from '@emotion/css';
import ChevronDown from '@iconify-icons/pixelarticons/chevron-down.js';
import Stack from '@nkzw/stack';
import { ReactNode } from 'react';
import { BoxStyle } from './Box.tsx';
import { applyVar } from './cssVar.tsx';
import Dropdown from './Dropdown.tsx';
import Icon from './Icon.tsx';
import pixelBorder from './pixelBorder.tsx';

export default function Select({
  children,
  dropdownClassName,
  forceOpen,
  outline,
  selectedItem,
  size = 'medium',
}: {
  children: ReactNode;
  dropdownClassName?: string;
  forceOpen?: boolean;
  outline?: true;
  selectedItem: ReactNode;
  size?: 'small' | 'medium';
}) {
  return (
    <Dropdown
      className={cx(
        BoxStyle,
        dropdownStyle,
        forceOpen && selectedStyle,
        size === 'small' && smallStyle,
        outline && outlineStyle,
      )}
      closeOnSelect
      dropdownClassName={cx(BoxStyle, selectorStyle, dropdownClassName)}
      flex1
      forceOpen={forceOpen}
      title={
        <Stack between gap stretch>
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

const outlineStyle = css`
  ${pixelBorder(applyVar('border-color'), 2)};
`;

const smallStyle = css`
  height: 36px;
  min-height: 32px;
  padding: 8px 12px;
`;
