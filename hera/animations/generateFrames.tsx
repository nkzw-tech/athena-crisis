import { CSSProperties } from 'react';

export default function generateFrames(
  spriteSize: number,
  frameCount: number,
  property: 'vertical' | 'horizontal',
): ReadonlyArray<CSSProperties> {
  const frames: Array<CSSProperties> = [];
  const propertyName =
    property === 'vertical' ? 'backgroundPositionY' : 'backgroundPositionX';
  for (let i = 0; i < frameCount; i++) {
    frames.push({
      [propertyName]: `${-i * spriteSize}px`,
    });
  }
  return frames;
}
