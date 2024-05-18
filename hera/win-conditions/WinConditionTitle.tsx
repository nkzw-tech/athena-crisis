import type { WinCondition } from '@deities/athena/WinConditions.tsx';
import { WinCriteria } from '@deities/athena/WinConditions.tsx';
import { css, cx } from '@emotion/css';
import getWinCriteriaName from '../lib/getWinCriteriaName.tsx';
import MiniPlayerIcon from '../ui/MiniPlayerIcon.tsx';

export default function WinConditionTitle({
  condition,
  index,
  short,
}: {
  condition: WinCondition;
  index?: number;
  short?: true;
}) {
  const space = index != null ? (short ? ` ` : `: `) : '';
  return (
    <span className={cx(titleStyle, short && nowrapStyle)}>
      {index != null ? `W${index + 1}` : null}
      {short ? space : `${space}${getWinCriteriaName(condition.type)} `}
      {condition.type !== WinCriteria.Default &&
        condition.players?.map((id) => <MiniPlayerIcon gap id={id} key={id} />)}
    </span>
  );
}

const titleStyle = css`
  align-items: center;
  display: inline-flex;
  gap: 8px;
`;

const nowrapStyle = css`
  white-space: nowrap;
`;
