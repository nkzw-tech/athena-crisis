import { Criteria, Objective } from '@deities/athena/Objectives.tsx';
import { css, cx } from '@emotion/css';
import getCriteriaName from '../lib/getCriteriaName.tsx';
import MiniPlayerIcon from '../ui/MiniPlayerIcon.tsx';

export default function ObjectiveTitle({
  index,
  objective,
  short,
}: {
  index?: number;
  objective: Objective;
  short?: true;
}) {
  const space = index != null ? (short ? ` ` : `: `) : '';
  return (
    <span className={cx(titleStyle, short && nowrapStyle)}>
      {index != null
        ? `${objective.hidden ? 'S' : ''}${objective.type !== Criteria.Default && objective.optional ? 'O' : 'W'}${index + 1}`
        : null}
      {short ? space : `${space}${getCriteriaName(objective.type)} `}
      {objective.type !== Criteria.Default &&
        objective.players?.map((id) => <MiniPlayerIcon gap id={id} key={id} />)}
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
