import { DoubleSize } from '@deities/athena/map/Configuration.tsx';
import Breakpoints, { lg } from '@deities/ui/Breakpoints.tsx';
import { isSafari } from '@deities/ui/Browser.tsx';
import clipBorder from '@deities/ui/clipBorder.tsx';
import { applyVar, insetStyle } from '@deities/ui/cssVar.tsx';
import Portal from '@deities/ui/Portal.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { css, cx } from '@emotion/css';
import { motion } from 'framer-motion';
import type { HTMLAttributes, ReactNode, RefObject } from 'react';

export default function BottomDrawer({
  children,
  expand,
  inset = 0,
  mode,
  ref,
  sidebar,
  visible,
}: Omit<HTMLAttributes<HTMLAnchorElement>, 'onClick'> &
  Readonly<{
    children: ReactNode;
    expand: boolean;
    inset?: number;
    mode?: string;
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
          expand && expandStyle,
          !hasInset && withoutInsetStyle,
        )}
        initial={{ opacity: visible ? 1 : 0 }}
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
          className={cx(!hasInset && containerWithoutInsetStyle)}
          nowrap
          vertical
        >
          {sidebar && (
            <Stack className={panelStyle} nowrap>
              {sidebar}
            </Stack>
          )}
          <Stack className={panelStyle} key={mode} vertical>
            {children}
          </Stack>
        </Stack>
      </motion.div>
    </Portal>
  );
}

export const SmallDrawerHeight = 180;
export const DrawerHeight = 240;

const style = css`
  ${clipBorder(4, 'top')}

  background: ${applyVar('background-color-dark')};
  bottom: ${applyVar('inset')};
  height: ${SmallDrawerHeight}px;
  left: ${applyVar('inset')};
  overflow: scroll;
  overscroll-behavior: contain;
  position: fixed;
  right: ${applyVar('inset')};
  transition: height 350ms ease-in-out;
  z-index: ${applyVar('inset-z')};

  ${Breakpoints.height.sm} {
    height: min(33vh, ${DrawerHeight}px);
  }

  ${Breakpoints.height.lg} {
    height: min(33vh, ${DrawerHeight * 2}px);
  }
`;

const extension = DoubleSize * 8;
const clip = `calc(${extension + 4}px * (1 - ${applyVar('ui-is-scaled')}))`;
const withoutInsetStyle = css`
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
    transform 300ms ease,
    height 350ms ease-in-out;
`;

const containerWithoutInsetStyle = css`
  margin: 0 ${extension}px ${DoubleSize}px;
`;

const expandStyle = css`
  height: max(calc(70vh - ${DoubleSize * 2}px), 340px);

  ${Breakpoints.height.sm} {
    height: min(calc(85vh - ${DoubleSize * 2}px), 720px);
  }
`;

const panelStyle = css`
  width: min(${lg}px, calc(90vw - ${applyVar('inset')} * 1.5));
`;

export const getDrawerPaddingStyle = (expand: boolean) =>
  expand ? expandedDrawerPaddingStyle : drawerPaddingStyle;

const drawerPaddingStyle = css`
  padding-bottom: calc(${SmallDrawerHeight}px + ${DoubleSize}px);

  ${Breakpoints.height.sm} {
    padding-bottom: calc(min(33vh, ${DrawerHeight}px) + ${DoubleSize}px);
  }
`;

const expandedDrawerPaddingStyle = css`
  padding-bottom: calc(480px + ${DoubleSize}px);

  ${Breakpoints.height.sm} {
    padding-bottom: calc(min(90vh, 720px) + ${DoubleSize}px);
  }
`;
