import { AnimationConfig } from '@deities/athena/map/Configuration.tsx';
import { TimerFunction } from '../Types.tsx';

export default async function sleep(
  scheduleTimer: TimerFunction,
  { AnimationDuration, Instant }: AnimationConfig,
  duration: 'short' | 'long',
) {
  if (!Instant && AnimationDuration > 0) {
    await new Promise<void>((resolve) =>
      scheduleTimer(
        resolve,
        AnimationDuration * (duration === 'short' ? 0.5 : 1.8),
      ),
    );
  }
}
