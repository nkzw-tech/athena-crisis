import { DoubleSize } from '@deities/athena/map/Configuration.tsx';
import Box from '@deities/ui/Box.tsx';
import { applyVar, CSSVariables } from '@deities/ui/cssVar.tsx';
import { css, cx } from '@emotion/css';
import { ComponentProps } from 'react';

export default function ActionBar({
  inlineUI,
  visible,
  ...props
}: ComponentProps<typeof Box> & {
  inlineUI: boolean;
  visible: boolean;
}) {
  return (
    <Box
      between
      blur
      className={cx(actionBarStyle, !inlineUI && regularStyle, visible && visibleStyle)}
      wrap
      {...props}
    />
  );
}

const vars = new CSSVariables<'x'>('ab');

const actionBarStyle = css`
  ${vars.set('x', 0)}

  left: 0;
  margin: 0 auto;
  min-width: 240px;
  opacity: 0;
  padding: 4px;
  pointer-events: none;
  position: fixed;
  right: 0;
  top: calc(${applyVar('safe-area-top')} + ${DoubleSize * 1.3}px);
  transform: translate3d(${vars.apply('x')}, -100%, 0) scale(0.9);
  transition:
    opacity 150ms ease,
    margin 250ms ease,
    transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1);
  width: 25%;
`;

const regularStyle = css`
  @media (min-width: 760px) {
    ${vars.set('x', '60%')}
    top: calc(${applyVar('safe-area-top')} + 8px);
  }

  @media (min-width: 900px) {
    ${vars.set('x', '50%')}
    top: calc(${applyVar('safe-area-top')} + 8px);
  }

  @media (min-width: 1100px) {
    ${vars.set('x', '24px')}
    top: calc(${applyVar('safe-area-top')} + 8px);
  }

  @media (min-width: 1300px) {
    ${vars.set('x', 0)}
  }
`;

const visibleStyle = css`
  pointer-events: auto;
  opacity: 1;
  transform: translate3d(${vars.apply('x')}, 0, 0) scale(1);
`;
