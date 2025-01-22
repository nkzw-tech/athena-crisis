import {
  createContext,
  ReactNode,
  RefObject,
  useContext,
  useEffect,
  useRef,
} from 'react';
import { PageTransitionDuration } from '../PageTransition.tsx';
import useLocation from './useLocation.tsx';

const Context = createContext<RefObject<boolean | null>>({
  current: false,
});

export const ScrollRestore = Context;

export const ScrollRestoreContext = ({ children }: { children: ReactNode }) => (
  <Context.Provider value={useRef(false)}>{children}</Context.Provider>
);

export default function useScrollRestore() {
  const { hash, pathname } = useLocation();
  const context = useRef(useContext(Context));
  useEffect(() => {
    let timer = setTimeout(() => {
      if (context.current) {
        context.current.current = false;
      } else if (hash.length > 1) {
        timer = setTimeout(() => {
          document.getElementById(hash.slice(1))?.scrollIntoView({
            behavior: 'smooth',
          });
        }, PageTransitionDuration * 3000);
      } else {
        window.scrollTo(0, 0);
      }
    }, PageTransitionDuration * 1000);
    return () => clearTimeout(timer);
  }, [context, hash, pathname]);
}

export function useSkipScrollRestore() {
  const scrollRestoreContext = useRef(useContext(ScrollRestore));
  useEffect(() => {
    scrollRestoreContext.current.current = true;
  }, [scrollRestoreContext]);
}
