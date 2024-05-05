import { Route } from '@deities/apollo/Routes.tsx';
import { useCallback } from 'react';
import { NavigateOptions, useNavigate } from 'react-router-dom';

export default (process.env.IS_LANDING_PAGE
  ? () => {
      return useCallback((route: Route) => {
        location.href = `https://app.athenacrisis.com${route}`;
      }, []);
    }
  : useNavigate) as () => (to: Route, options?: NavigateOptions) => void;
