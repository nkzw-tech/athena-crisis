import { AnimationConfig, MaxHealth } from '@deities/athena/map/Configuration.tsx';
import { PlayerID } from '@deities/athena/map/Player.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import Icon from '@deities/ui/Icon.tsx';
import Heart from '@deities/ui/icons/Heart.tsx';
import Stack from '@nkzw/stack';
import getHealthColor from '../behavior/attack/getHealthColor.tsx';
import Medal from '../Medal.tsx';
import Tick from '../Tick.tsx';
import TransportedUnitTile from '../TransportedUnitTile.tsx';
import { PlayerDetails } from '../Types.tsx';
import FlashFlyout from './FlashFlyout.tsx';
import { FlyoutItem } from './Flyout.tsx';

export default function NamedPosition({
  animationConfig,
  currentViewer,
  map,
  playerDetails,
  tileSize,
  unit,
  vector,
  zIndex,
}: {
  animationConfig: AnimationConfig;
  currentViewer: PlayerID | null;
  map: MapData;
  playerDetails: PlayerDetails;
  tileSize: number;
  unit: Unit;
  vector: Vector;
  zIndex: number;
}) {
  const hasName = unit.hasName() && unit.player !== 0;
  const showHealth = unit && unit.health < MaxHealth;
  return hasName || showHealth || unit?.transports?.length ? (
    <FlashFlyout
      align="top-lower"
      animationConfig={animationConfig}
      items={[
        hasName || showHealth ? (
          <FlyoutItem center color={unit.player} key="unit-name">
            <Stack center gap={4}>
              {hasName && (
                <Stack between gap={4}>
                  {unit.getName(currentViewer)}
                  {unit.isLeader() && <Medal player={unit.player} zoom={1} />}
                </Stack>
              )}
              {showHealth ? (
                <Stack
                  between
                  gap={1}
                  style={{
                    color: getHealthColor(unit.health) || applyVar('text-color'),
                  }}
                >
                  {unit.health}
                  <Icon icon={Heart} />
                </Stack>
              ) : null}
            </Stack>
          </FlyoutItem>
        ) : null,
        unit.transports?.length ? (
          <FlyoutItem color={unit.player} key="unit-transports" size="large">
            <Tick animationConfig={animationConfig}>
              <Stack between gap style={{ zoom: 0.75 }}>
                {unit.transports.map((transportedUnit, index) => (
                  <TransportedUnitTile
                    animationConfig={animationConfig}
                    key={index}
                    map={map}
                    playerDetails={playerDetails}
                    tileSize={tileSize}
                    unit={transportedUnit}
                  />
                ))}
              </Stack>
            </Tick>
          </FlyoutItem>
        ) : null,
      ]}
      position={vector}
      tileSize={tileSize}
      width={map.size.width}
      zIndex={zIndex}
    />
  ) : null;
}
