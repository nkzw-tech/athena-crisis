import { DoubleSize } from '@deities/athena/map/Configuration.tsx';
import { css, cx } from '@emotion/css';
import Close from '@iconify-icons/pixelarticons/close.js';
import { motion } from 'framer-motion';
import { ReactNode, useCallback } from 'react';
import AudioPlayer from './AudioPlayer.tsx';
import Breakpoints from './Breakpoints.tsx';
import { isSafari } from './Browser.tsx';
import useInput from './controls/useInput.tsx';
import { applyVar } from './cssVar.tsx';
import Icon from './Icon.tsx';
import MenuButton from './MenuButton.tsx';
import ScrollContainer from './ScrollContainer.tsx';
import Stack from './Stack.tsx';

export function useDialogNavigation<T>(
  states: ReadonlyArray<T> | undefined,
  currentState: number,
  setPanel: (panel: T) => void,
) {
  const next = useCallback(
    (event?: CustomEvent) => {
      event?.preventDefault();
      const newState =
        states && currentState !== -1
          ? states.at((currentState + 1) % states.length)
          : null;
      if (newState) {
        AudioPlayer.playSound('UI/Next');
        setPanel(newState);
      }
    },
    [currentState, setPanel, states],
  );

  const previous = useCallback(
    (event?: CustomEvent) => {
      event?.preventDefault();
      const newState =
        states && currentState !== -1 ? states.at(currentState - 1) : null;
      if (newState) {
        AudioPlayer.playSound('UI/Previous');
        setPanel(newState);
      }
    },
    [currentState, setPanel, states],
  );

  useInput('next', next, 'dialog');
  useInput('previous', previous, 'dialog');
  useInput(
    'navigate',
    (event) => {
      event.preventDefault();

      const { x } = event.detail;
      if (x < 0) {
        previous();
      } else if (x > 0) {
        next();
      }
    },
    'dialog',
  );
}

export default function Dialog({
  children,
  onClose,
  size = 'medium',
  transformOrigin,
}: {
  children: ReactNode;
  onClose: () => void | Promise<void>;
  size?: 'small' | 'medium' | 'large';
  transformOrigin: string;
}) {
  return (
    <>
      <div className={backgroundStyle} onClick={onClose} />
      <motion.div
        animate={{
          opacity: 1,
          transform: 'scale(1)',
        }}
        className={wrapperStyle}
        exit={{
          opacity: 0,
          transform: 'scale(0)',
        }}
        initial={{
          opacity: 0,
          transform: 'scale(0)',
        }}
        style={{
          transformOrigin,
        }}
        transition={{
          duration: 0.25,
          ease: [0.34, 1.26, 0.64, 1],
        }}
      >
        <Stack alignCenter center className={wrapperStyle}>
          <div className={cx(containerStyle, sizes[size])}>
            {children}
            <MenuButton
              className={cx(tabStyle, closeButtonStyle)}
              onClick={onClose}
            >
              <Icon button icon={Close} />
            </MenuButton>
          </div>
        </Stack>
      </motion.div>
    </>
  );
}

export const DialogScrollContainer = ({
  children,
}: {
  children: ReactNode;
}) => <ScrollContainer className={scrollStyle}>{children}</ScrollContainer>;

export const DialogTabBar = ({ children }: { children: ReactNode }) => (
  <div className={tabBarStyle}>{children}</div>
);

export const DialogTab = ({
  children,
  disabled,
  end,
  highlight,
  isIcon,
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  end?: boolean;
  highlight?: boolean;
  isIcon?: true;
  onClick?: () => void;
}) => (
  <div
    className={cx(
      tabStyle,
      isIcon && iconStyle,
      highlight && highlightStyle,
      end && tabEndStyle,
      disabled && disabledStyle,
      disabled && 'disabled',
    )}
    onClick={!disabled ? onClick : undefined}
  >
    {children}
  </div>
);

const backgroundStyle = css`
  background-color: ${applyVar('background-color-light')};
  inset: 0;
  position: fixed;
  z-index: 29;
`;

const wrapperStyle = css`
  inset: 0;
  pointer-events: none;
  position: fixed;
  z-index: 30;
`;

const containerStyle = css`
  box-shadow:
    -4px 0 0 0 ${applyVar('border-color-light')},
    4px 0 0 0 ${applyVar('border-color-light')},
    0 4px 0 0 ${applyVar('border-color-light')};

  background: ${applyVar('background-color-bright')};
  border-top: 4px solid ${applyVar('border-color-light')};
  bottom: ${DoubleSize}px;
  pointer-events: all;
  position: fixed;
  top: ${DoubleSize * 2.2}px;
  transform: ${isSafari ? '' : `scale(${applyVar('ui-scale')})`};
  transition: transform 300ms ease;
  width: 93vw;
  z-index: calc(${applyVar('inset-z')} + 30);
`;

const sizes = {
  large: css`
    max-width: min(93vw, 1000px);
  `,
  medium: css`
    ${Breakpoints.sm} {
      width: min(90vw, 600px);
    }

    ${Breakpoints.xl} {
      width: 1000px;
    }

    ${Breakpoints.height.lg} {
      top: unset;
      bottom: unset;
      height: min(75vh, 860px);
    }

    ${Breakpoints.height.xl} {
      height: 980px;
    }
  `,
  small: css`
    height: 40vh;
    max-height: 420px;
    top: calc(50vh - max(20vh, 210px));

    ${Breakpoints.sm} {
      width: min(90vw, 600px);
    }
  `,
};

const scrollStyle = css`
  inset: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 16px;
  position: absolute;
`;

const tabBarStyle = css`
  display: flex;
  flex-wrap: nowrap;
  gap: 16px;
  padding-bottom: 8px;
  position: absolute;
  top: -48px;
  width: calc(100% - ${DoubleSize + 16}px);
`;

const tabStyle = css`
  box-shadow:
    -4px 0 0 0 ${applyVar('border-color-light')},
    4px 0 0 0 ${applyVar('border-color-light')},
    0 -4px 0 0 ${applyVar('border-color-light')};
  backdrop-filter: blur(4px);
  background-color: ${applyVar('border-color-light')};
  color: ${applyVar('text-color-bright')};
  cursor: pointer;
  padding: 12px;
  position: relative;
  transition:
    background-color 150ms ease,
    color 150ms ease;

  // Use clip on the horizontal axis to avoid the after element from being cut off
  // while still allowing the ellipsis on the text.
  overflow-x: clip;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:after {
    background: ${applyVar('background-color-bright')};
    bottom: -5px;
    content: '';
    display: block;
    height: 5px;
    left: 0;
    opacity: 0;
    pointer-events: none;
    position: absolute;
    right: 0;
    transition: opacity 150ms ease;
  }

  &:not(.disabled):hover {
    ${isSafari ? `overflow-x: visible;` : ''}
    background-color: ${applyVar('background-color-bright')};
    color: ${applyVar('text-color')};

    &:after {
      opacity: 1;
    }
  }
`;

const iconStyle = css`
  padding-bottom: 8px;
`;

const disabledStyle = css`
  opacity: 0.7;
  color: ${applyVar('text-color-inactive')};
`;

const highlightStyle = css`
  ${isSafari ? `overflow-x: visible;` : ''}
  background: ${applyVar('background-color-bright')};
  color: ${applyVar('text-color')};

  &:after {
    opacity: 1;
  }
`;

const tabEndStyle = css`
  align-self: end;
  margin-left: auto;
`;

const closeButtonStyle = css`
  color: ${applyVar('text-color-bright')};
  height: 44px;
  padding: 0;
  position: absolute;
  right: 0;
  top: -48px;
  width: 48px;
`;
