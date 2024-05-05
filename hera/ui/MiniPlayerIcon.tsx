import { PlayerID } from '@deities/athena/map/Player.tsx';
import cssVar, { applyVar } from '@deities/ui/cssVar.tsx';
import getColor from '@deities/ui/getColor.tsx';
import pixelBorder from '@deities/ui/pixelBorder.tsx';
import { css, cx } from '@emotion/css';

export default function MiniPlayerIcon({
  gap,
  id,
}: {
  gap?: true;
  id: PlayerID;
}) {
  return (
    <span
      className={cx(style, gap && gapStyle)}
      key={id}
      style={{
        [cssVar('background-color')]: getColor(id),
      }}
    >
      {id}
    </span>
  );
}

const style = css`
  ${pixelBorder(applyVar('background-color'), 2)}

  align-items: center;
  background-color: ${applyVar('background-color')};
  color: #fff;
  display: inline-flex;
  font-size: 0.7em;
  height: 16px;
  justify-content: center;
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.7);
  width: 16px;
`;

const gapStyle = css`
  margin-right: 2px;
`;
