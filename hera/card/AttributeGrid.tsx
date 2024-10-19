import { TileSize } from '@deities/athena/map/Configuration.tsx';
import Breakpoints from '@deities/ui/Breakpoints.tsx';
import clipBorder from '@deities/ui/clipBorder.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import { css, cx } from '@emotion/css';
import { ReactNode } from 'react';

export default function AttributeGrid({
  children,
  rowGap,
}: {
  children: ReactNode;
  rowGap?: 4 | 8 | 16;
}) {
  return (
    <div
      className={gridStyle}
      style={rowGap && rowGap !== defaultGap ? { rowGap } : undefined}
    >
      {children}
    </div>
  );
}

export function AttributeGridBox({ children }: { children: ReactNode }) {
  return (
    <div className={minHeightStyle}>
      <div className={cx(gridStyle, boxStyle)}>{children}</div>
    </div>
  );
}

const defaultGap = 8;

const gridStyle = css`
  align-items: center;
  display: grid;
  grid-template-columns: auto auto auto;
  row-gap: 12px;
  width: fit-content;

  > div:nth-child(3n + 1) {
    font-variant-numeric: tabular-nums;
    white-space: nowrap;

    svg {
      margin-right: 8px;
    }
  }

  > div:nth-child(3n + 2) {
    text-align: right;
  }

  column-gap: 4px;

  ${Breakpoints.xs} {
    column-gap: 8px;
  }

  ${Breakpoints.sm} {
    column-gap: 24px;
  }

  ${Breakpoints.xl} {
    column-gap: 48px;
  }
`;

const boxStyle = css`
  ${clipBorder()}
  background: ${applyVar('background-color')};
  padding: 12px;
`;

const minHeightStyle = css`
  ${Breakpoints.sm} {
    min-height: ${TileSize * 3}px;
  }

  ${Breakpoints.lg} {
    min-height: ${TileSize * 7}px;
  }

  ${Breakpoints.xl} {
    min-height: ${TileSize * 9}px;
  }
`;
