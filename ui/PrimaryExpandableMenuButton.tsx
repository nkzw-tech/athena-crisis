import { DoubleSize } from '@deities/athena/map/Configuration.tsx';
import { css, cx } from '@emotion/css';
import { ComponentProps } from 'react';
import Breakpoints from './Breakpoints.tsx';
import { applyVar, insetStyle } from './cssVar.tsx';
import ExpandableMenuButton from './ExpandableMenuButton.tsx';

export default function PrimaryExpandableMenuButton({
  className,
  inset,
  size,
  ...props
}: ComponentProps<typeof ExpandableMenuButton> & {
  inset: number;
  size?: 'large';
}) {
  const { isExpanded } = props;
  return (
    <ExpandableMenuButton
      {...props}
      className={cx(
        style,
        size === 'large' && largeStyle,
        inset > 0 && withInsetStyle,
        isExpanded && expandedStyle,
        className,
      )}
      style={insetStyle(inset)}
    />
  );
}

const size = DoubleSize;
const style = css`
  font-size: 0.9em;
  left: ${size * 1.5}px;
  line-height: 1.2em;
  min-height: ${size}px;
  overflow: hidden;
  pointer-events: auto;
  top: ${applyVar('inset')};
  width: calc(100vw - ${size * 3}px);
  z-index: max(calc(${applyVar('inset-z')} + 2), 20);

  ${Breakpoints.xs} {
    width: 220px;
  }
`;

const largeStyle = css`
  ${Breakpoints.xs} {
    width: 280px;
  }
`;

const withInsetStyle = css`
  left: ${applyVar('inset')};
`;

const expandedStyle = css`
  width: calc(100vw - ${size * 1.5}px);

  ${Breakpoints.xs} {
    width: min(440px, calc(100vw - ${size * 1.5}px));
  }
`;
