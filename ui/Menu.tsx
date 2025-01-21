import { DoubleSize, TileSize } from '@deities/athena/map/Configuration.tsx';
import { css, cx } from '@emotion/css';
import CloseIcon from '@iconify-icons/pixelarticons/close.js';
import DragAndDrop from '@iconify-icons/pixelarticons/drag-and-drop.js';
import MenuIcon from '@iconify-icons/pixelarticons/menu.js';
import { motion } from 'framer-motion';
import {
  createContext,
  ReactNode,
  RefObject,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { App } from './App.tsx';
import { rumbleEffect } from './controls/setupGamePad.tsx';
import useBlockInput from './controls/useBlockInput.tsx';
import useInput from './controls/useInput.tsx';
import cssVar, { applyVar } from './cssVar.tsx';
import { useFullscreen } from './hooks/useFullScreen.tsx';
import Icon from './Icon.tsx';
import ExitFullscreen from './icons/ExitFullscreen.tsx';
import Fullscreen from './icons/Fullscreen.tsx';
import MenuButton from './MenuButton.tsx';
import Portal from './Portal.tsx';
import Stack from './Stack.tsx';

export const MenuClassName = 'menu-button';

export type MenuContext = RefObject<boolean>;

const Context = createContext<MenuContext>({ current: false });

export const MenuContext = ({ children }: { children: ReactNode }) => {
  return (
    <Context.Provider value={{ current: false }}>{children}</Context.Provider>
  );
};

export const useDisableOpenMenuOnCancel = () => {
  const context = useContext(Context);
  useEffect(() => {
    context.current = false;
  }, [context]);
};

export const useOpenMenuOnCancel = () => {
  const context = useContext(Context);
  useEffect(() => {
    context.current = true;
  }, [context]);
};

export default function Menu({
  children,
  controls,
  hide,
}: {
  children?: ((close: () => void) => ReactNode) | null;
  controls?: (isOpen: boolean) => ReactNode;
  hide?: boolean;
}) {
  const context = useContext(Context);
  const [isOpen, setIsOpen] = useState(false);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(!isOpen), [isOpen]);
  const isFullScreen = useFullscreen();
  const canToggleFullScreen = useMemo(() => App.canToggleFullScreen(), []);

  const isHidden = hide && !isOpen;

  useInput(
    'menu',
    useCallback(() => {
      rumbleEffect('menu');
      toggle();
    }, [toggle]),
    isOpen ? 'top' : undefined,
  );

  useInput(
    'cancel',
    useCallback(
      (event) => {
        if (isOpen) {
          event.preventDefault();
          close();
        }
      },
      [close, isOpen],
    ),
    'top',
  );

  useInput(
    'cancel',
    useCallback(
      (event) => {
        if (event.detail?.isEscape && context.current && !isOpen) {
          setIsOpen(true);
        }
      },
      [context, isOpen],
    ),
  );

  const toggleFullscreen = useCallback(() => {
    if (isOpen) {
      App.toggleFullscreen();
    }
  }, [isOpen]);

  useInput('zoom', toggleFullscreen, 'top');

  useBlockInput('top', isOpen);

  useLayoutEffect(() => {
    document.documentElement.style.setProperty(
      cssVar('ui-scale'),
      isOpen ? '0.85' : '1',
    );
    document.documentElement.style.setProperty(
      cssVar('ui-is-scaled'),
      isOpen ? '1' : '0',
    );
    document.documentElement.style.setProperty(
      cssVar('transform-origin'),
      window.scrollX +
        window.innerWidth / 2 +
        'px ' +
        (window.scrollY + window.innerHeight / 2) +
        'px',
    );
  }, [isOpen]);

  useEffect(() => {
    if (canToggleFullScreen) {
      const listener = (event: KeyboardEvent) => {
        if ((event.metaKey || event.ctrlKey) && event.key === 'f') {
          event.preventDefault();
          App.toggleFullscreen();
        }
      };
      window.addEventListener('keydown', listener);
      return () => window.removeEventListener('keydown', listener);
    }
  }, [canToggleFullScreen]);

  return (
    <Portal>
      <div
        className={cx(menuStyle, isOpen && openStyle, isOpen && MenuClassName)}
      >
        <div
          className={dotStyle}
          style={{ left: -2, opacity: isOpen ? 1 : 0, top: -2 }}
        />
        <div
          className={dotStyle}
          style={{ opacity: isOpen ? 1 : 0, right: -2, top: -2 }}
        />
        <div
          className={dotStyle}
          style={{ bottom: -2, left: -2, opacity: isOpen ? 1 : 0 }}
        />
        <div
          className={dotStyle}
          style={{ bottom: -2, opacity: isOpen ? 1 : 0, right: -2 }}
        />
        {isOpen && (
          <motion.div
            animate={{
              opacity: 1,
              transform: 'scale(1)',
            }}
            className={cx(overlayStyle, MenuClassName)}
            initial={{
              opacity: 0,
              transform: 'scale(0)',
            }}
            onClick={close}
            transition={{
              delay: 0.15,
              duration: 0.3,
              ease: [0.34, 1.26, 0.64, 1],
            }}
          >
            {children?.(close)}
          </motion.div>
        )}
        <Stack
          className={cx(linkContainerStyle, isOpen && openLinkContainerStyle)}
          stretch
          vertical
        >
          {canToggleFullScreen && (
            <Stack gap vertical>
              <a onClick={toggleFullscreen}>
                <Icon
                  button
                  icon={isFullScreen ? ExitFullscreen : Fullscreen}
                />
              </a>
            </Stack>
          )}
        </Stack>
        <Stack
          className={cx(
            controlsContainerStyle,
            isOpen && openControlsContainerStyle,
          )}
          stretch
        >
          {controls?.(isOpen)}
          {isOpen && App.canQuit && !isFullScreen && canToggleFullScreen && (
            <Stack className={dragStyle} end>
              <Icon button icon={DragAndDrop} />
            </Stack>
          )}
        </Stack>
        <MenuButton
          className={cx(
            MenuClassName,
            buttonStyle,
            isOpen && openButtonStyle,
            isHidden && hiddenStyle,
          )}
          hide={isHidden}
          onClick={toggle}
        >
          <Icon button icon={isOpen ? CloseIcon : MenuIcon} />
        </MenuButton>
      </div>
    </Portal>
  );
}

const size = DoubleSize;
const fontSize = TileSize * 1.5;
const menuStyle = css`
  ${cssVar('text-color-active', applyVar('text-color-active-light'))}
  ${cssVar('highlight-color', applyVar('text-color-light'))}

  background-color: rgba(0, 0, 0, 0);
  border: 0 solid ${applyVar('background-color-dark')};
  color: ${applyVar('text-color')};
  height: 0;
  left: 0;
  position: fixed;
  right: 0;
  top: 0;
  transition:
    border-width 300ms ease,
    background-color 300ms ease,
    color 300ms ease,
    height 0ms 300ms ease;
  z-index: 3000;
`;

const dotStyle = css`
  background-color: ${applyVar('background-color-dark')};
  height: 6px;
  pointer-events: none;
  position: absolute;
  transition: opacity 300ms ease;
  width: 6px;
`;

const buttonStyle = css`
  left: env(safe-area-inset-left);
  top: env(safe-area-inset-top);
`;

const openButtonStyle = css`
  background: transparent;
  box-shadow: none;

  &:hover {
    color: ${applyVar('text-color-active-light')};
  }
`;

const hiddenStyle = css`
  pointer-events: none;
`;

const openStyle = css`
  ${cssVar('text-color', applyVar('text-color-light'))}

  background-color: ${applyVar('background-color-light')};
  border-width: ${size}px;
  border-top-width: calc(${size}px + env(safe-area-inset-top));
  height: 100%;
  transition:
    border-width 300ms ease,
    background-color 300ms ease,
    color 300ms ease;
  z-index: 4000;
`;

const overlayStyle = css`
  align-items: center;
  align-self: center;
  display: flex;
  height: 100%;
  inset: 0;
  justify-content: center;
  overflow: auto;
  overscroll-behavior: contain;
  padding: 16px;
  position: absolute;
`;

const linkContainerStyle = css`
  bottom: 8px;
  font-size: ${fontSize}px;
  left: 0;
  padding: 0 6px;
  pointer-events: none;
  position: fixed;
  top: ${size + 4}px;

  > div > a {
    display: block;
    height: 36px;
    opacity: 0;
    transform: translate3d(-100%, 0, 0);
    transition-delay: 0ms;
    transition:
      transform 300ms ease,
      opacity 200ms ease,
      visibility 300ms ease;
    visibility: hidden;
    -webkit-user-drag: none;

    &:hover {
      color: ${applyVar('text-color-active')};
    }
  }
`;

const openLinkContainerStyle = css`
  pointer-events: auto;

  > div > a {
    opacity: 1;
    transform: translate3d(0, 0, 0);
    transition:
      transform 300ms ease,
      opacity 300ms 100ms ease;
    visibility: visible;
  }

  > div:nth-child(2) > a {
    &:nth-child(1) {
      transition-delay: 220ms;
    }

    &:nth-child(2) {
      transition-delay: 260ms;
    }
  }
`;

const controlsContainerStyle = css`
  font-size: ${fontSize}px;
  height: 48px;
  left: ${size}px;
  pointer-events: none;
  position: fixed;
  right: 0;
  top: env(safe-area-inset-top);

  > div {
    opacity: 0;
    transform: translate3d(0, -100%, 0);
    transition-delay: 0ms;
    transition:
      transform 300ms ease,
      opacity 200ms ease,
      visibility 300ms ease;
    visibility: hidden;
  }
`;

const openControlsContainerStyle = css`
  pointer-events: auto;

  > div {
    opacity: 1;
    transform: translate3d(0, 0, 0);
    transition:
      transform 300ms ease,
      opacity 300ms 100ms ease;
    visibility: visible;

    &:nth-child(1) {
      transition-delay: 100ms;
    }
  }
`;

const dragStyle = css`
  -webkit-app-region: drag;
  flex: 1;
  padding: 8px 8px 0 0;
`;
