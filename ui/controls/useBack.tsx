import { Route } from '@deities/apollo/Routes.tsx';
import { useCallback } from 'react';
import useNavigate from '../hooks/useNavigate.tsx';
import useInput from './useInput.tsx';

export default function useBack(to: Route) {
  const navigate = useNavigate();
  useInput(
    'cancel',
    useCallback(() => {
      navigate(to);
    }, [navigate, to]),
  );
}
