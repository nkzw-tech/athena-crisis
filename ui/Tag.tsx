import { Route } from '@deities/apollo/Routes.tsx';
import { css, cx } from '@emotion/css';
import Close from '@iconify-icons/pixelarticons/close.js';
import { ButtonStyle } from './Button.tsx';
import clipBorder from './clipBorder.tsx';
import useActive from './controls/useActive.tsx';
import { applyVar } from './cssVar.tsx';
import getColor, { BaseColor } from './getColor.tsx';
import Icon from './Icon.tsx';
import getTagColor from './lib/getTagColor.tsx';
import Link from './Link.tsx';
import pixelBorder from './pixelBorder.tsx';

export default function Tag({
  active,
  capitalize,
  className,
  color,
  isMessage,
  onClick,
  onRemove,
  selected,
  size = 'medium',
  tag,
  to,
}: Readonly<{
  active?: boolean;
  capitalize?: boolean;
  className?: string;
  color?: BaseColor;
  isMessage?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  selected?: boolean;
  size?: 'small' | 'medium';
  tag: string;
  to?: Route;
}>) {
  if (color == null) {
    color = getTagColor(tag);
  }

  className = cx(
    tagStyle,
    (to || onClick) && ButtonStyle,
    selected ? selectedStyle : regularStyle,
    size === 'small' && smallTagStyle,
    capitalize && capitalizeStyle,
    isMessage && messageTagStyle,
    className,
  );

  const style = {
    backgroundColor: getColor(color, 0.2),
    color: getColor(color),
  };
  const children = (
    <>
      {tag}
      {onRemove && <Icon button className={iconStyle} icon={Close} onClick={onRemove} />}
    </>
  );

  useActive(active, onClick, to);

  return to ? (
    <Link className={className} key={tag} onClick={onClick} style={style} to={to}>
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

const messageTagStyle = css`
  line-height: 20px;
  height: 26px;
`;

const smallTagStyle = css`
  padding: 0 4px 1px;
  margin: 1px 0;
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

const capitalizeStyle = css`
  &::first-letter {
    text-transform: uppercase;
  }
`;
