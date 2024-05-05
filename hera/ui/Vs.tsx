import { applyVar } from '@deities/ui/cssVar.tsx';
import { css } from '@emotion/css';

export default function Vs() {
  return (
    <div className={style}>
      <fbt desc="Label for 'versus' in a list of players playing against each other">
        vs.
      </fbt>
    </div>
  );
}

const style = css`
  color: ${applyVar('text-color')};
  font-size: 1.25em;
  margin: 0 16px 4px;
  white-space: nowrap;

  &:before {
    content: '\\00a0\\00a0\\00a0';
    text-decoration-line: line-through;
    margin-right: 8px;
  }

  &:after {
    content: '\\00a0\\00a0\\00a0';
    text-decoration-line: line-through;
    margin-left: 8px;
  }
`;
