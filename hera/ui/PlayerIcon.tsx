import { TileSize } from '@deities/athena/map/Configuration.tsx';
import type { DynamicPlayerID } from '@deities/athena/map/Player.tsx';
import cssVar, { applyVar } from '@deities/ui/cssVar.tsx';
import getColor from '@deities/ui/getColor.tsx';
import pixelBorder from '@deities/ui/pixelBorder.tsx';
import { css, cx } from '@emotion/css';

const playerIconText = (id: DynamicPlayerID) => {
  switch (id) {
    case 'self':
      return 'S';
    case 'team':
      return 'T';
    case 'opponent':
      return 'O';
    default:
      return id;
  }
};

export default function PlayerIcon({
  button,
  className,
  cursorStyle,
  id,
  inline,
  onClick,
  selected,
}: {
  button?: true;
  className?: string;
  cursorStyle?: 'grab' | 'grabbing';
  id: DynamicPlayerID;
  inline?: true;
  onClick?: () => void;
  selected?: boolean;
}) {
  return (
    <div
      className={cx(
        style,
        selected && highlightStyle,
        !inline && blockStyle,
        (button || onClick) && buttonStyle,
        className,
      )}
      key={id}
      onClick={onClick}
      style={{
        [cssVar('background-color')]: getColor(id),
        cursor: cursorStyle,
      }}
    >
      {playerIconText(id)}
    </div>
  );
}

const style = css`
  ${pixelBorder(applyVar('background-color'), 2)}

  align-items: center;
  background-color: ${applyVar('background-color')};
  color: #fff;
  display: inline-flex;
  height: ${TileSize}px;
  justify-content: center;
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.7);
  transform: scale(1);
  transition: transform 150ms ease;
  width: ${TileSize}px;
`;

const blockStyle = css`
  font-size: 24px;
  height: 37.5px;
  min-width: 37.5px;
  width: 37.5px;
`;

const buttonStyle = css`
  cursor: pointer;

  &:hover {
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.9);
  }
`;

const highlightStyle = css`
  ${pixelBorder(applyVar('border-color'), 2)}
`;
