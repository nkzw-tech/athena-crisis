import { Route } from '@deities/apollo/Routes.tsx';
import { useCallback, useMemo } from 'react';
import useLocation from '../hooks/useLocation.tsx';
import useNavigate from '../hooks/useNavigate.tsx';
import useInput from './useInput.tsx';

export function getBackURL(search: string): Route | null {
  const backURL = new URLSearchParams(search).get('back') as Route | null;
  return backURL && backURL !== '/' && !backURL.startsWith('/?') ? backURL : null;
}

export default function useBack(to: Route) {
  const { search } = useLocation();
  const navigate = useNavigate();
  const backURL = useMemo(() => getBackURL(search), [search]);

  useInput(
    'cancel',
    useCallback(() => {
      navigate(backURL || to);
    }, [backURL, navigate, to]),
  );
}
