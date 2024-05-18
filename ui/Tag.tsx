import type { Route } from '@deities/apollo/Routes.tsx';
import { css, cx } from '@emotion/css';
import Close from '@iconify-icons/pixelarticons/close.js';
import { ButtonStyle } from './Button.tsx';
import clipBorder from './clipBorder.tsx';
import { applyVar } from './cssVar.tsx';
import getColor from './getColor.tsx';
import Icon from './Icon.tsx';
import getTagColor from './lib/getTagColor.tsx';
import Link from './Link.tsx';
import pixelBorder from './pixelBorder.tsx';

export default function Tag({
  className,
  onClick,
  removeTag,
  selected,
  tag,
  to,
}: Readonly<{
  className?: string;
  onClick?: () => void;
  removeTag?: () => void;
  selected?: boolean;
  tag: string;
  to?: Route;
}>) {
  className = cx(
    tagStyle,
    (to || onClick) && ButtonStyle,
    selected ? selectedStyle : regularStyle,
    className,
  );
  const style = {
    backgroundColor: getColor(getTagColor(tag), 0.2),
    color: getColor(getTagColor(tag)),
  };
  const children = (
    <>
      {tag}
      {removeTag && (
        <Icon button className={iconStyle} icon={Close} onClick={removeTag} />
      )}
    </>
  );
  return to ? (
    <Link
      className={className}
      key={tag}
      onClick={onClick}
      style={style}
      to={to}
    >
      {children}
    </Link>
  ) : (
    <span className={className} key={tag} onClick={onClick} style={style}>
      {children}
    </span>
  );
}

const tagStyle = css`
  background-color: ${applyVar('background-color-active')};
  color: ${applyVar('text-color')};
  display: inline-block;
  padding: 3px 6px 4px;
`;

const regularStyle = css`
  ${clipBorder(2)}
`;

const selectedStyle = css`
  ${pixelBorder(undefined, 2)}
`;

const iconStyle = css`
  cursor: pointer;
  margin-left: 4px;
  vertical-align: text-bottom;
`;
