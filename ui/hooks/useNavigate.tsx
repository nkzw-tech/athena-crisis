import type { Route } from '@deities/apollo/Routes.tsx';
import { useCallback } from 'react';
import type { NavigateOptions } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

export default (process.env.IS_LANDING_PAGE
  ? () => {
      return useCallback((route: Route) => {
        location.href = `https://app.athenacrisis.com${route}`;
      }, []);
    }
  : useNavigate) as () => (to: Route, options?: NavigateOptions) => void;
