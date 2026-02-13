import {
  PerformanceStyleComparators,
  PerformanceStyleType,
} from '@deities/athena/map/PlayerPerformance.tsx';
import { css } from '@emotion/css';

export default function Comparator({ type }: { type: PerformanceStyleType }) {
  return <span className={comparatorStyle}>{PerformanceStyleComparators[type]}</span>;
}

const comparatorStyle = css`
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-weight: 200;
  text-align: center;
  width: 16px;
`;
