import { css, cx } from '@emotion/css';
import Stack, { VStack } from '@nkzw/stack';
import { ReactNode, useCallback, useState } from 'react';
import { applyVar } from './cssVar.tsx';
import pixelBorder from './pixelBorder.tsx';

export default function Dropdown({
  children,
  className,
  closeOnSelect,
  dropdownClassName,
  flex1,
  forceOpen,
  shouldRenderControls = true,
  title,
}: {
  children: ReactNode;
  className?: string;
  closeOnSelect?: true;
  dropdownClassName?: string;
  flex1?: boolean;
  forceOpen?: boolean;
  shouldRenderControls?: boolean;
  title: ReactNode;
}) {
  const [closed, setClosed] = useState(false);

  const close = useCallback(() => {
    setClosed(true);
    setTimeout(() => setClosed(false), 300);
  }, []);

  return (
    <Stack
      between
      className={cx(selectorContainerStyle, !closed && openStyle, className)}
      flex1={flex1}
      wrap
    >
      {title}
      {shouldRenderControls && (
        <VStack
          between
          className={cx(
            selectorStyle,
            dropdownClassName,
            forceOpen && forceOpenStyle,
            closed && hiddenStyle,
          )}
          onClick={closeOnSelect ? close : undefined}
        >
          {children}
        </VStack>
      )}
    </Stack>
  );
}

const selectorContainerStyle = css`
  cursor: pointer;
  position: relative;
`;

const openStyle = css`
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

const forceOpenStyle = css`
  opacity: 1;
  pointer-events: auto;
  transform: scale(1);
  transition-delay: 0ms;
`;

const hiddenStyle = css`
  display: none;
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
