import { css, cx } from '@emotion/css';
import { motion } from 'framer-motion';
import type { ComponentProps, MouseEvent, ReactNode } from 'react';
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import AudioPlayer from '../AudioPlayer.tsx';
import { isWindows } from '../Browser.tsx';
import useBlockInput from '../controls/useBlockInput.tsx';
import useHorizontalMenuNavigation from '../controls/useHorizontalMenuNavigation.tsx';
import useInput from '../controls/useInput.tsx';
import { applyVar } from '../cssVar.tsx';
import pixelBorder from '../pixelBorder.tsx';
import Portal from '../Portal.tsx';
import { PulseStyle } from '../RainbowPulseStyle.tsx';
import Stack from '../Stack.tsx';

type Props = ComponentProps<typeof Alert>;

export type AlertContext = Readonly<{
  alert: (props: Props) => void;
  hide: () => void;
}>;

const Context = createContext<AlertContext>({
  alert: () => {},
  hide: () => {},
});

export const AlertContext = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<Props | null>(null);
  return (
    <Context.Provider
      value={useMemo(
        () => ({
          alert: setState,
          hide: () => setState(null),
        }),
        [],
      )}
    >
      {children}
      {state && <Alert {...state} />}
    </Context.Provider>
  );
};

export default function useAlert() {
  return useContext(Context);
}

const Alert = ({
  acceptText = <fbt desc="Button to accept a dialog">Ok</fbt>,
  onAccept,
  onCancel,
  preventCancel,
  text,
  title,
}: {
  acceptText?: ReactNode;
  onAccept?: () => void;
  onCancel?: () => void;
  preventCancel?: true;
  text: ReactNode;
  title?: ReactNode;
}) => {
  const { hide } = useAlert();

  const showCancel = onAccept && !preventCancel;
  const [selected] = useHorizontalMenuNavigation(
    showCancel ? 2 : 1,
    'top',
    true,
  );

  const cancel = useCallback(
    (event: CustomEvent<unknown> | MouseEvent) => {
      event.preventDefault();
      if (!preventCancel) {
        hide();
        AudioPlayer.playSound('UI/Cancel');
        onCancel?.();
      }
    },
    [hide, onCancel, preventCancel],
  );

  const accept = useCallback(
    (event: CustomEvent<unknown> | MouseEvent) => {
      if (showCancel && selected === 0) {
        cancel(event);
        return;
      }

      event.preventDefault();
      hide();
      AudioPlayer.playSound('UI/Accept');
      onAccept?.();
    },
    [cancel, hide, onAccept, selected, showCancel],
  );

  useBlockInput('top');
  useInput('accept', accept, 'top');
  useInput('cancel', cancel, 'top');
  useInput('menu', (event) => event.preventDefault(), 'top');

  return (
    <Portal>
      <div className={backgroundStyle} onClick={cancel} />
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
        transition={{
          duration: 0.25,
          ease: [0.34, 1.26, 0.64, 1],
        }}
      >
        <Stack alignCenter center className={wrapperStyle}>
          <div className={containerStyle}>
            <Stack gap={32} stretch vertical>
              <Stack gap>
                {title && <h2>{title}</h2>}
                <p>{text}</p>
              </Stack>

              <Stack
                className={isWindows ? reverseStyle : undefined}
                {...(showCancel ? null : { end: true })}
              >
                {showCancel && (
                  <button
                    className={cx(selected === 0 && cx('focus', PulseStyle))}
                    onClick={cancel}
                  >
                    <fbt desc="Button to cancel a dialog">Cancel</fbt>
                  </button>
                )}
                <button
                  className={cx(
                    acceptStyle,
                    selected === (showCancel ? 1 : 0) &&
                      cx('focus', PulseStyle),
                  )}
                  onClick={accept}
                >
                  {acceptText}
                </button>
              </Stack>
            </Stack>
          </div>
        </Stack>
      </motion.div>
    </Portal>
  );
};

const backgroundStyle = css`
  background-color: ${applyVar('background-color-light')};
  inset: 0;
  position: fixed;
  z-index: 10000;
`;

const wrapperStyle = css`
  inset: 0;
  pointer-events: none;
  position: fixed;
  z-index: 10001;
`;

const containerStyle = css`
  ${pixelBorder(applyVar('border-color-light'))}
  background: ${applyVar('background-color-bright')};
  filter: drop-shadow(0 0 10px ${applyVar('border-color-light')});
  padding: 16px;
  pointer-events: all;
  position: fixed;
  width: min(480px, 90vw);
  z-index: 10002;
`;

const reverseStyle = css`
  flex-direction: row-reverse;
`;

const acceptStyle = css`
  ${pixelBorder(applyVar('highlight-color'), 2)}
  color: ${applyVar('highlight-color')};
`;
