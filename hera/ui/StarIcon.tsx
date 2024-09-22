import { TileSize } from '@deities/athena/map/Configuration.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import getColor from '@deities/ui/getColor.tsx';
import Icon from '@deities/ui/Icon.tsx';
import { StarEmpty, StarFull } from '@deities/ui/icons/Stars.tsx';
import { css, cx } from '@emotion/css';
import React from 'react';

export default function StarIcon({
  className,
  size,
  starClassName,
  type,
}: {
  className?: string;
  size?: 'small' | 'medium' | 'large';
  starClassName?: string;
  type: 'achieved' | 'chaos' | 'missed';
}) {
  const dimensions =
    TileSize * (size === 'small' ? 1 : size === 'medium' ? 2 : 3);

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
        height={dimensions}
        icon={StarFull}
        width={dimensions}
      />
      <Icon
        className={cx(starStyle, outlineStyle)}
        height={dimensions}
        icon={StarEmpty}
        width={dimensions}
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
