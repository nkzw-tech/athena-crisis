import {
  createContext,
  MutableRefObject,
  ReactNode,
  useContext,
  useEffect,
  useRef,
} from 'react';
import { useLocation } from 'react-router-dom';
import { PageTransitionDuration } from '../PageTransition.tsx';

const Context = createContext<MutableRefObject<boolean | null>>({
  current: false,
});

export const ScrollRestore = Context;

export const ScrollRestoreContext = ({ children }: { children: ReactNode }) => (
  <Context.Provider value={useRef(false)}>{children}</Context.Provider>
);

export default function useScrollRestore() {
  const { pathname } = useLocation();
  const context = useContext(Context);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (context.current) {
        context.current = false;
      } else {
        window.scrollTo(0, 0);
      }
    }, PageTransitionDuration * 1000);
    return () => clearTimeout(timer);
  }, [context, pathname]);
}
