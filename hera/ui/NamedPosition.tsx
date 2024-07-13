import {
  AnimationConfig,
  MaxHealth,
} from '@deities/athena/map/Configuration.tsx';
import { PlayerID } from '@deities/athena/map/Player.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import Icon from '@deities/ui/Icon.tsx';
import Heart from '@deities/ui/icons/Heart.tsx';
import Magic from '@deities/ui/icons/Magic.tsx';
import Stack from '@deities/ui/Stack.tsx';
import getHealthColor from '../behavior/attack/getHealthColor.tsx';
import FlashFlyout from './FlashFlyout.tsx';
import { FlyoutItem } from './Flyout.tsx';

export default function NamedPosition({
  animationConfig,
  currentViewer,
  map,
  tileSize,
  vector,
  zIndex,
}: {
  animationConfig: AnimationConfig;
  currentViewer: PlayerID | null;
  map: MapData;
  tileSize: number;
  vector: Vector;
  zIndex: number;
}) {
  const unit = map.units.get(vector);
  const hasName = unit && unit.hasName() && unit.player !== 0;
  const showHealth = unit && unit.health < MaxHealth;
  return (
    (hasName || showHealth) && (
      <FlashFlyout
        align="top-lower"
        animationConfig={animationConfig}
        items={[
          <FlyoutItem color={unit.player} key="unit-name">
            <Stack gap={4} nowrap>
              {hasName && (
                <Stack gap={1} nowrap>
                  {unit.getName(currentViewer)}
                  {unit.isLeader() && <Icon icon={Magic} />}
                </Stack>
              )}
              {showHealth ? (
                <Stack
                  gap={1}
                  nowrap
                  style={{
                    color:
                      getHealthColor(unit.health) || applyVar('text-color'),
                  }}
                >
                  {unit.health}
                  <Icon icon={Heart} />
                </Stack>
              ) : null}
            </Stack>
          </FlyoutItem>,
        ]}
        mini
        position={vector}
        tileSize={tileSize}
        width={map.size.width}
        zIndex={zIndex}
      />
    )
  );
}
