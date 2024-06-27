import { css, cx } from '@emotion/css';
import { ReactNode } from 'react';
import { applyVar } from './cssVar.tsx';
import pixelBorder from './pixelBorder.tsx';
import Stack from './Stack.tsx';

export default function Dropdown({
  children,
  className,
  dropdownClassName,
  shouldRenderControls = true,
  title,
}: {
  children: ReactNode;
  className?: string;
  dropdownClassName?: string;
  shouldRenderControls?: boolean;
  title: ReactNode;
}) {
  return (
    <Stack className={cx(selectorContainerStyle, className)}>
      {title}
      {shouldRenderControls && (
        <Stack className={cx(selectorStyle, dropdownClassName)} nowrap vertical>
          {children}
        </Stack>
      )}
    </Stack>
  );
}

const selectorContainerStyle = css`
  cursor: pointer;
  position: relative;

  & > div {
    transition-delay: 150ms;
  }
  &:hover > div {
    opacity: 1;
    pointer-events: auto;
    transform: scale(1);
    transition-delay: 0ms;
  }
`;

const selectorStyle = css`
  ${pixelBorder(applyVar('background-color'))}

  background: ${applyVar('background-color')};
  cursor: initial;
  opacity: 0;
  pointer-events: none;
  position: absolute;
  transform: scale(0.9);
  transition:
    opacity 150ms ease,
    transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 2;
`;
