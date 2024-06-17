import { App } from '@deities/ui/App.tsx';
import useInput from '@deities/ui/controls/useInput.tsx';
import Icon from '@deities/ui/Icon.tsx';
import { useInlineLink } from '@deities/ui/InlineLink.tsx';
import Reload from '@deities/ui/Reload.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { css } from '@emotion/css';
import Close from '@iconify-icons/pixelarticons/close.js';
import { useCallback, useState } from 'react';
import Notification from './Notification.tsx';

const target = App.canQuit ? '_blank' : undefined;

export default function NewVersionNotification({
  hasNewAppVersion,
  hasNewVersion,
  reload,
}: {
  hasNewAppVersion: boolean;
  hasNewVersion: boolean;
  reload: () => void;
}) {
  const [hideNotification, setHideNotification] = useState(false);

  useInput(
    'accept',
    useCallback(
      (event) => {
        if (hasNewAppVersion && !hideNotification) {
          event.preventDefault();
          window.open('https://app.athenacrisis.com/download', target);
        }
      },
      [hasNewAppVersion, hideNotification],
    ),
    'top',
  );

  useInput(
    'cancel',
    useCallback(
      (event) => {
        if (hasNewAppVersion && !hideNotification) {
          event.preventDefault();
          setHideNotification(true);
        }
      },
      [hasNewAppVersion, hideNotification],
    ),
    'top',
  );

  const linkProps = useInlineLink();

  return (
    <Stack className={absoluteStyle} gap vertical>
      {hasNewAppVersion && !hideNotification && (
        <Notification offset={hasNewVersion ? 0.5 : 0}>
          <Icon
            button
            className={iconStyle}
            icon={Close}
            onClick={() => setHideNotification(true)}
          />
          <Stack gap vertical>
            <h2>
              <fbt desc="Headline for new version">New Version available</fbt>
            </h2>
            <p>
              <fbt desc="New native app version notification">
                A new version of the Athena Crisis App is available. Tap here to{' '}
                <a
                  href="https://app.athenacrisis.com/download"
                  onClick={() => setHideNotification(true)}
                  target={target}
                  {...linkProps}
                >
                  download the new version
                </a>.
              </fbt>
            </p>
          </Stack>
        </Notification>
      )}
      {hasNewVersion && (
        <Notification>
          <p>
            <fbt desc="New version notification">
              Athena Crisis was updated.
            </fbt>{' '}
            <Reload reload={reload} />
          </p>
        </Notification>
      )}
    </Stack>
  );
}

const absoluteStyle = css`
  position: absolute;
  z-index: 1000000;
`;

const iconStyle = css`
  cursor: pointer;
  height: 32px;
  padding: 4px;
  position: absolute;
  right: 0px;
  top: 0px;
  width: 32px;
`;
