import { applyVar } from './cssVar.tsx';

export default function pixelBorder(
  color: string = applyVar('border-color'),
  size: string | number = 4,
) {
  if (typeof size === 'number') {
    size = `${size}px`;
  }
  return `box-shadow: calc(-1 * ${size}) 0 0 0 ${color}, ${size} 0 0 0 ${color}, 0 calc(-1 * ${size}) 0 0 ${color}, 0 ${size} 0 0 ${color};`;
}
