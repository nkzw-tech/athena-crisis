import { Route } from '@deities/apollo/Routes.tsx';
import { useEffect, useRef } from 'react';
import useNavigate from '../hooks/useNavigate.tsx';
import { NativeTimeout } from './throttle.tsx';

export default function useActive(isActive: boolean | undefined, click?: () => void, to?: Route) {
  const navigate = useNavigate();
  const timer = useRef<NativeTimeout>(null);

  useEffect(() => {
    if (timer.current == null && isActive) {
      timer.current = setTimeout(() => {
        timer.current = null;
        click?.();
        if (to) {
          navigate(to);
        }
      }, 100);
    }
  }, [isActive, click, navigate, to]);
}
