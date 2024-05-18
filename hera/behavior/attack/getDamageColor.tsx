import { MaxHealth } from '@deities/athena/map/Configuration.tsx';
import type { FlyoutColor } from '../../ui/Flyout.tsx';

export default function getDamageColor(
  damage: number | null,
  previousHealth: number,
): FlyoutColor {
  const thresholdYellow = MaxHealth * 0.3;
  const thresholdRed = MaxHealth * 0.15;
  return !damage
    ? 'error'
    : damage >= previousHealth
      ? 'green'
      : damage <= thresholdRed
        ? 'red'
        : damage <= thresholdYellow
          ? 'orange'
          : null;
}
