import type { AnimationConfig } from '@deities/athena/map/Configuration.tsx';
import type { TimerFunction } from '../Types.tsx';

export default async function sleep(
  scheduleTimer: TimerFunction,
  { AnimationDuration, Instant }: AnimationConfig,
  duration: 'short' | 'long',
) {
  if (!Instant && AnimationDuration > 0) {
    await new Promise((resolve) =>
      scheduleTimer(
        resolve,
        AnimationDuration * (duration === 'short' ? 0.5 : 1.8),
      ),
    );
  }
}
