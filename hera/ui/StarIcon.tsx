import { applyVar } from '@deities/ui/cssVar.tsx';
import getColor from '@deities/ui/getColor.tsx';
import Icon from '@deities/ui/Icon.tsx';
import { StarEmpty, StarFull } from '@deities/ui/icons/Stars.tsx';
import { css, cx } from '@emotion/css';
import React from 'react';

export default function StarIcon({
  className,
  small,
  starClassName,
  type,
}: {
  className?: string;
  small?: true;
  starClassName?: string;
  type: 'achieved' | 'chaos' | 'missed';
}) {
  const size = small ? 24 : 96;
  return (
    <div className={cx(relativeStyle, className)}>
      <Icon
        className={cx(
          starStyle,
          type === 'achieved'
            ? achievedStyle
            : type === 'chaos'
              ? chaosStyle
              : missedStyle,
          starClassName,
        )}
        height={size}
        icon={StarFull}
        width={size}
      />
      <Icon
        className={cx(starStyle, outlineStyle)}
        height={size}
        icon={StarEmpty}
        width={size}
      />
    </div>
  );
}

const relativeStyle = css`
  position: relative;
`;

const starStyle = css`
  display: block;
`;

const outlineStyle = css`
  color: #433612;
  inset: 0;
  position: absolute;
`;

const missedStyle = css`
  color: ${applyVar('color-silver')};
`;

const achievedStyle = css`
  color: ${applyVar('color-gold')};
`;

const chaosStyle = css`
  color: ${getColor('red')};
`;
