import SpriteVector from '@deities/athena/map/SpriteVector.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import { Sprites } from 'athena-crisis:images';
import getEntityPosition from '../render/getEntityPosition.tsx';
import Animation, { MapAnimationProps } from './Animation.tsx';
import generateFrames from './generateFrames.tsx';

const layout = { anchor: { x: 6, y: 10 }, frameSize: 36 } as const;
const frames = generateFrames(layout.frameSize, 18, 'vertical');

export default function Heal({
  entitySize,
  position,
  tileSize,
  unitDirection,
  ...props
}: Omit<MapAnimationProps, 'sound'> & {
  position: Vector;
  unitDirection: 'left' | 'right';
}) {
  const { x, y } = getEntityPosition(position, tileSize, entitySize);
  return (
    <Animation
      direction={unitDirection}
      frames={frames}
      frameSize={layout.frameSize}
      position={new SpriteVector(x - layout.anchor.x, y - layout.anchor.y)}
      sound="Unit/Heal"
      source={Sprites.Heal}
      {...props}
    />
  );
}
