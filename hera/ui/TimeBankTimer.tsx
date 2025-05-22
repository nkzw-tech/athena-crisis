import dateNow from '@deities/apollo/lib/dateNow.tsx';
import { useEffect, useState } from 'react';
import formatDuration from '../lib/formatDuration.tsx';

const Timer = ({
  duration,
  setDuration,
}: {
  duration: number;
  setDuration: (fn: (duration: number) => number) => void;
}) => {
  useEffect(() => {
    const interval = setInterval(
      () => setDuration((duration) => duration - 1),
      1000,
    );
    return () => clearInterval(interval);
  }, [setDuration]);

  return formatDuration(Math.max(0, duration));
};

export default function TimeBankTimer({ time: initialTime }: { time: number }) {
  const [duration, setDuration] = useState(() =>
    Math.floor((initialTime - dateNow()) / 1000),
  );

  return duration > 0 ? (
    <Timer duration={duration} setDuration={setDuration} />
  ) : (
    formatDuration(Math.max(0, duration))
  );
}
