import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

export const Context = createContext(false);

export const HideContext = ({ children }: { children: ReactNode }) => {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey &&
        event.code === 'KeyB'
      ) {
        event.preventDefault();

        setHidden((hidden) => !hidden);
      }
    };
    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, []);

  return <Context.Provider value={hidden}>{children}</Context.Provider>;
};

export default function useHide() {
  return useContext(Context);
}
