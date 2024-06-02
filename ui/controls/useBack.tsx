import { Route } from '@deities/apollo/Routes.tsx';
import { useCallback } from 'react';
import useLocation from '../hooks/useLocation.tsx';
import useNavigate from '../hooks/useNavigate.tsx';
import useInput from './useInput.tsx';

export default function useBack(to: Route) {
  const { search } = useLocation();
  const navigate = useNavigate();
  const backURL =
    (new URLSearchParams(search).get('back') as Route | undefined) || null;

  useInput(
    'cancel',
    useCallback(() => {
      navigate(backURL || to);
    }, [backURL, navigate, to]),
  );
}
