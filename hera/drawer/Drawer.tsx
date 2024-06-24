import { DoubleSize } from '@deities/athena/map/Configuration.tsx';
import Breakpoints, { lg } from '@deities/ui/Breakpoints.tsx';
import { isSafari } from '@deities/ui/Browser.tsx';
import clipBorder from '@deities/ui/clipBorder.tsx';
import { applyVar, insetStyle } from '@deities/ui/cssVar.tsx';
import Portal from '@deities/ui/Portal.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { css, cx } from '@emotion/css';
import { motion } from 'framer-motion';
import { ReactNode, RefObject } from 'react';

export type DrawerPosition = 'bottom' | 'left';

export default function Drawer({
  children,
  expand,
  inset = 0,
  mode,
  position = 'bottom',
  ref,
  sidebar,
  visible,
}: Readonly<{
  children: ReactNode;
  expand: boolean;
  inset?: number;
  mode?: string;
  position?: DrawerPosition;
  ref?: RefObject<HTMLDivElement>;
  sidebar?: ReactNode;
  visible: boolean;
}>) {
  const hasInset = inset > 0;
  return (
    <Portal>
      <motion.div
        animate={{
          opacity: 1,
        }}
        className={cx(
          style,
          baseStyle[position],
          expand && expandStyle[position],
          !hasInset && withoutInsetStyle[position],
        )}
        initial={{ opacity: visible ? 1 : 0 }}
        key={position}
        ref={ref}
        style={insetStyle(inset)}
        transition={{
          delay: inset ? 0.25 : 0,
          duration: 0.2,
          ease: 'easeInOut',
        }}
      >
        <Stack
          alignCenter
          className={cx(!hasInset && panelWithoutInsetStyle[position])}
          nowrap
          vertical
        >
          {sidebar && (
            <Stack className={panelStyle[position]} nowrap>
              {sidebar}
            </Stack>
          )}
          <Stack className={panelStyle[position]} key={mode} vertical>
            {children}
          </Stack>
        </Stack>
      </motion.div>
    </Portal>
  );
}

const drawerSize = 240;
const smallDrawerSize = drawerSize - 60;

const style = css`
  ${clipBorder(4, 'top')}

  background: ${applyVar('background-color-dark')};
  overflow: scroll;
  overscroll-behavior: contain;
  position: fixed;
  z-index: ${applyVar('inset-z')};
`;

const baseStyle = {
  bottom: css`
    bottom: ${applyVar('inset')};
    height: ${smallDrawerSize}px;
    left: ${applyVar('inset')};
    right: ${applyVar('inset')};
    transition: height 350ms ease-in-out;

    ${Breakpoints.height.sm} {
      height: min(33vh, ${drawerSize}px);
    }

    ${Breakpoints.height.lg} {
      height: min(33vh, ${drawerSize * 2}px);
    }
  `,
  left: css`
    bottom: ${applyVar('inset')};
    left: ${applyVar('inset')};
    top: ${applyVar('inset')};
    width: ${smallDrawerSize}px;
    transition: width 350ms ease-in-out;

    ${Breakpoints.sm} {
      width: min(45vw, ${drawerSize * 1.5}px);
    }

    ${Breakpoints.lg} {
      width: min(45vw, ${drawerSize * 3}px);
    }
  `,
};

const extension = DoubleSize * 8;
const clip = `calc(${extension + 4}px * (1 - ${applyVar('ui-is-scaled')}))`;

const withoutInsetStyle = {
  bottom: css`
    clip-path: polygon(
      0 4px,
      ${clip} 4px,
      ${clip} 0,
      calc(100% - ${clip}) 0,
      calc(100% - ${clip}) 4px,
      100% 4px,
      100% calc(100% - 4px),
      calc(100%) calc(100%),
      calc(100%) 100%,
      ${clip} 100%,
      ${clip} calc(100%),
      0 calc(100%)
    );

    bottom: -${DoubleSize}px;
    left: calc(-${extension}px * ${applyVar('ui-scale')});
    right: calc(-${extension}px * ${applyVar('ui-scale')});

    transform-origin: top center;
    transform: ${isSafari ? '' : `scale(${applyVar('ui-scale')})`};
    transition:
      height 350ms ease,
      left 350ms ease,
      right 350ms ease,
      transform 350ms ease;
  `,

  left: css`
    bottom: calc(-${extension}px * ${applyVar('ui-scale')});
    left: -${DoubleSize * 2}px;
    top: calc(-${extension}px * ${applyVar('ui-scale')});

    transform-origin: center right;
    transform: ${isSafari ? '' : `scale(${applyVar('ui-scale')})`};
    transition:
      bottom 350ms ease,
      top 350ms ease,
      transform 350ms ease,
      width 350ms ease;
  `,
};

const panelStyle = {
  bottom: css`
    width: min(${lg}px, calc(90vw - ${applyVar('inset')} * 1.5));
  `,
  left: css`
    width: 95%;
  `,
};

const panelWithoutInsetStyle = {
  bottom: css`
    margin: 0 ${extension}px ${DoubleSize}px;
  `,
  left: css`
    margin: ${extension + DoubleSize}px 0 ${extension}px ${DoubleSize * 2}px;
  `,
};

const expandStyle = {
  bottom: css`
    height: max(calc(70vh - ${DoubleSize * 2}px), 340px);

    ${Breakpoints.height.sm} {
      height: min(calc(85vh - ${DoubleSize * 2}px), 720px);
    }
  `,
  left: css`
    width: max(calc(70vw - ${DoubleSize * 3}px), 640px);

    ${Breakpoints.sm} {
      width: min(calc(85vw - ${DoubleSize * 4}px), 1024px);
    }
  `,
};

const paddingStyles = {
  bottom: css`
    padding-bottom: calc(${smallDrawerSize}px + ${DoubleSize}px);

    ${Breakpoints.height.sm} {
      padding-bottom: calc(min(33vh, ${drawerSize}px) + ${DoubleSize}px);
    }
  `,
  left: css`
    padding-left: calc(${smallDrawerSize}px + ${DoubleSize}px);

    ${Breakpoints.sm} {
      padding-left: calc(min(33vw, ${drawerSize}px) + ${DoubleSize * 1.5}px);
    }
  `,
};

const expandedPaddingStyles = {
  bottom: css`
    padding-bottom: calc(${drawerSize * 2} + ${DoubleSize}px);

    ${Breakpoints.height.sm} {
      padding-bottom: calc(min(90vh, 720px) + ${DoubleSize}px);
    }
  `,
  left: css`
    padding-left: calc(${smallDrawerSize}px + ${DoubleSize}px);

    ${Breakpoints.sm} {
      padding-left: calc(min(33vw, 1024px) + ${DoubleSize * 1.5}px);
    }
  `,
};

export const getDrawerPaddingStyle = (
  position: DrawerPosition,
  expand: boolean,
) => (expand ? expandedPaddingStyles : paddingStyles)[position];
