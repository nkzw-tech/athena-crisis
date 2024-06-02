import { useLocation as _useLocation } from 'react-router-dom';

export default process.env.IS_LANDING_PAGE
  ? function useLocation(): ReturnType<typeof _useLocation> {
      return {
        ...window.location,
        key: '',
        state: null,
      };
    }
  : _useLocation;
