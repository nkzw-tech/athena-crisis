import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';
import useAlert from './useAlert.tsx';

export function usePrompt({
  message,
  when,
}: {
  message: string;
  when: boolean;
}) {
  const { alert } = useAlert();
  const blocker = useBlocker(when);

  useEffect(() => {
    if (blocker.state === 'blocked') {
      alert({
        onAccept: () => setTimeout(blocker.proceed, 0),
        onCancel: () => blocker.reset(),
        text: message,
      });
    }
  }, [alert, blocker, message]);

  useEffect(() => {
    if (blocker.state === 'blocked' && !when) {
      blocker.reset();
    }
  }, [blocker, when]);
}
