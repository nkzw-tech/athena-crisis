import { WinCondition, WinCriteria } from '@deities/athena/WinConditions.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
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
    <span className={containerStyle}>
      <span className={cx(titleStyle, short && nowrapStyle)}>
        {index != null ? `W${index + 1}` : null}
        {short ? space : `${space}${getWinCriteriaName(condition.type)} `}
        {condition.type !== WinCriteria.Default &&
          condition.players?.map((id) => (
            <MiniPlayerIcon gap id={id} key={id} />
          ))}
      </span>
      {condition.type !== WinCriteria.Default && condition.optional && (
        <span className={optionalStyle}>(optional)</span>
      )}
    </span>
  );
}

const containerStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const titleStyle = css`
  align-items: center;
  display: inline-flex;
  gap: 8px;
`;

const nowrapStyle = css`
  white-space: nowrap;
`;

const optionalStyle = css`
  font-size: 0.7em;
  display: flex;
  justify-content: end;
  color: ${applyVar('text-color-inactive')};
`;
