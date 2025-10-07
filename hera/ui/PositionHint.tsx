import { AnimationConfig } from '@deities/athena/map/Configuration.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import Stack from '@nkzw/stack';
import FlashFlyout from './FlashFlyout.tsx';
import { FlyoutItem } from './Flyout.tsx';

export default function PositionHint({
  animationConfig,
  map,
  tileSize,
  vector,
  zIndex,
}: {
  animationConfig: AnimationConfig;
  map: MapData;
  tileSize: number;
  vector: Vector;
  zIndex: number;
}) {
  return (
    <FlashFlyout
      align="top-lower"
      animationConfig={animationConfig}
      delay={300}
      items={[
        <FlyoutItem key="position">
          <Stack between wrap>
            {vector.x}-{vector.y}
          </Stack>
        </FlyoutItem>,
      ]}
      mini
      position={vector}
      tileSize={tileSize}
      width={map.size.width}
      zIndex={zIndex}
    />
  );
}
