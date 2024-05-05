import { MaxHealth } from '@deities/athena/map/Configuration.tsx';
import getColor from '@deities/ui/getColor.tsx';

export default function getHealthColor(health: number): string | undefined {
  return health < MaxHealth / 3
    ? getColor('red')
    : health < (MaxHealth / 3) * 2
      ? getColor('orange')
      : undefined;
}
