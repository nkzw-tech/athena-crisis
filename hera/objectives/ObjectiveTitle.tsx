import {
  Criteria,
  Objective,
  ObjectiveID,
} from '@deities/athena/Objectives.tsx';
import { css, cx } from '@emotion/css';
import getCriteriaName from '../lib/getCriteriaName.tsx';
import MiniPlayerIcon from '../ui/MiniPlayerIcon.tsx';

export default function ObjectiveTitle({
  id,
  objective,
  short,
}: {
  id?: ObjectiveID;
  objective: Objective;
  short?: true;
}) {
  const space = id != null ? (short ? ` ` : `: `) : '';
  return (
    <span className={cx(titleStyle, short && nowrapStyle)}>
      {id != null
        ? `${objective.hidden ? 'S' : ''}${objective.type !== Criteria.Default && objective.optional ? 'O' : 'W'}${id + 1}`
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
