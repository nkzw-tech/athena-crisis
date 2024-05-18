import type { BaseColor } from './getColor.tsx';
import getColor from './getColor.tsx';

export default function gradient(
  color: BaseColor | ReadonlyArray<BaseColor> | undefined,
  alpha = 0.9,
  direction = 'to bottom right',
) {
  const colors = Array.isArray(color) ? color : color != null ? [color] : null;
  return colors?.length
    ? `linear-gradient(${direction}, ${(colors.length > 1
        ? colors
        : [colors[0], colors[0]]
      )
        .map((color) => getColor(color, alpha))
        .join(', ')})`
    : `rgb(0, 0, 0, ${alpha === 1 ? 1 : Math.max(0, alpha - 0.4)})`;
}
