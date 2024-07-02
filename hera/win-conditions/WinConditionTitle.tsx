import { Criteria, WinCondition } from '@deities/athena/WinConditions.tsx';
import { css, cx } from '@emotion/css';
import getCriteriaName from '../lib/getCriteriaName.tsx';
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
      {index != null
        ? `${condition.hidden ? 'S' : ''}${condition.type !== Criteria.Default && condition.optional ? 'O' : 'W'}${index + 1}`
        : null}
      {short ? space : `${space}${getCriteriaName(condition.type)} `}
      {condition.type !== Criteria.Default &&
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
