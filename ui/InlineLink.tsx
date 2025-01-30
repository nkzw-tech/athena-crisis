import { Route } from '@deities/apollo/Routes.tsx';
import { css, cx } from '@emotion/css';
import {
  AnchorHTMLAttributes,
  CSSProperties,
  MouseEvent,
  RefCallback,
  RefObject,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import AudioPlayer from './AudioPlayer.tsx';
import Breakpoints from './Breakpoints.tsx';
import useActive from './controls/useActive.tsx';
import { applyVar, CSSVariables } from './cssVar.tsx';
import useScrollIntoView from './hooks/useScrollIntoView.tsx';
import Link from './Link.tsx';
import pixelBorder from './pixelBorder.tsx';
import { Gap } from './Stack.tsx';

export const InlineLinkColor = 'InlineLink-color';

type InlineLinkProps = Readonly<{
  active?: boolean;
  alignCenter?: true;
  className?: string;
  gap?: Gap;
  hover?: boolean;
  inline?: true;
  onClick?: (event?: MouseEvent) => void;
  pixelBorderSize?: number;
  ref?: RefCallback<HTMLAnchorElement> | RefObject<HTMLAnchorElement | null>;
  selected?: boolean;
  selectedText?: boolean;
  style?: CSSProperties;
  to?: Route;
}>;

export const useInlineLink = ({
  active, // Do not pass `active` to the link element.
  alignCenter,
  className: initialClassName,
  gap: _gap,
  hover,
  inline,
  pixelBorderSize,
  selected,
  selectedText,
  style,
  ...props
}: InlineLinkProps = {}) => {
  const className = useMemo(
    () =>
      cx(
        'link',
        linkStyle,
        initialClassName,
        hover && 'hover',
        selected && 'selected',
        selectedText && 'selected-text',
        active && 'active',
        alignCenter && alignCenterStyle,
        inline && inlineStyle,
      ),
    [
      active,
      alignCenter,
      hover,
      initialClassName,
      inline,
      selected,
      selectedText,
    ],
  );
  const gap = _gap === true ? defaultGap : _gap;

  return {
    ...props,
    className,
    style:
      pixelBorderSize != null
        ? {
            gap,
            ...style,
            [vars.set('pixel-border-size')]: `${pixelBorderSize}px`,
          }
        : gap
          ? { ...style, gap }
          : style,
  };
};

export default (function InlineLink({
  onClick,
  ref,
  to,
  ...initialProps
}: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'onClick'> & InlineLinkProps) {
  const element = useRef<HTMLAnchorElement | null>(null);
  const click = useCallback(
    (event?: MouseEvent) => {
      AudioPlayer.playSound('UI/Accept');
      onClick?.(event);
    },
    [onClick],
  );

  const setRefs = useCallback(
    (anchorElement: HTMLAnchorElement | null) => {
      if (typeof ref === 'function') {
        ref(anchorElement);
      } else if (ref) {
        ref.current = anchorElement;
      }
      element.current = anchorElement;
    },
    [ref],
  );

  useScrollIntoView(element, initialProps.hover);
  useActive(initialProps.active, click, to);

  const props = useInlineLink(initialProps);
  return to ? (
    <Link {...props} onClick={click} ref={setRefs} to={to} />
  ) : (
    <a {...props} onClick={click} ref={setRefs} />
  );
});

const defaultGap = 8;

const vars = new CSSVariables<'pixel-border-size'>('il');

const linkStyle = css`
  ${vars.set('pixel-border-size', '2px')}

  -webkit-user-drag: none;
  background: transparent;
  transform: scaleX(1) scaleY(1);
  transition: transform 150ms ease;
  display: inline-flex;
  align-content: center;

  &.selected {
    ${pixelBorder(
      applyVar('text-color-active'),
      vars.apply('pixel-border-size'),
    )}
    background-color: ${applyVar('background-color-light')};
    color: ${applyVar('text-color-active')};
  }

  &.selected-text {
    color: ${applyVar('text-color-active')};
  }

  &:active,
  &.active {
    transform: scaleX(0.95) scaleY(0.98);
  }

  &:not(.active):not(.selected-text).hover {
    ${pixelBorder(
      applyVar('background-color-active'),
      vars.apply('pixel-border-size'),
    )}

    color: ${applyVar('text-color-bright')};
    background-color: ${applyVar('background-color-active')};
    text-decoration: none;
    text-shadow: rgba(0, 0, 0, 0.5) 1px 1px 0;

    .${InlineLinkColor} {
      color: ${applyVar('text-color-bright')} !important;
    }

    svg {
      filter: drop-shadow(1px 1px 0 rgba(0, 0, 0, 0.3));
    }
  }

  &:not(.active).selected.hover {
    ${pixelBorder(
      applyVar('text-color-active'),
      vars.apply('pixel-border-size'),
    )}
  }

  @media (hover: hover) {
    &.selected:hover {
      ${pixelBorder(
        applyVar('text-color-active'),
        vars.apply('pixel-border-size'),
      )}
      background-color: ${applyVar('background-color-light')};
      color: ${applyVar('text-color-active')};
    }

    &.selected-text:hover {
      color: ${applyVar('text-color-active')};
    }

    &:not(.active):not(.selected-text):hover {
      ${pixelBorder(
        applyVar('background-color-active'),
        vars.apply('pixel-border-size'),
      )}

      color: ${applyVar('text-color-bright')};
      background-color: ${applyVar('background-color-active')};
      text-decoration: none;
      text-shadow: rgba(0, 0, 0, 0.5) 1px 1px 0;

      .${InlineLinkColor} {
        color: ${applyVar('text-color-bright')} !important;
      }

      svg {
        filter: drop-shadow(1px 1px 0 rgba(0, 0, 0, 0.3));
      }
    }
  }
`;

const alignCenterStyle = css`
  align-items: center;
`;

const inlineStyle = css`
  display: inline;
`;

export const KeyboardShortcut = ({
  button,
  shortcut,
}: {
  button?: true;
  shortcut: string;
}) => (
  <span
    className={cx(keyboardShortcutStyle, button && buttonKeyboardShortcutStyle)}
  >
    {shortcut}
  </span>
);

const keyboardShortcutStyle = css`
  display: none;
  ${Breakpoints.sm} {
    ${pixelBorder(applyVar('background-color-dark'), 1.5)}

    align-items: center;
    color: ${applyVar('text-color')};
    display: flex;
    font-size: 0.7em;
    height: 16px;
    justify-content: center;
    padding-left: 2px;
    left: 2px;
    opacity: 0.5;
    position: absolute;
    text-transform: uppercase;
    top: 3px;
    width: 16px;

    .link:not(.active):not(.selected-text).hover &,
    .link:not(.active):not(.selected-text):hover & {
      ${pixelBorder(applyVar('text-color-bright'), 1.5)}

      color: ${applyVar('text-color-bright')};
      opacity: 1;
    }
  }
`;

const buttonKeyboardShortcutStyle = css`
  ${Breakpoints.sm} {
    top: 20px;
    left: 14px;

    .link:not(.active):not(.selected-text).hover &,
    .link:not(.active):not(.selected-text):hover & {
      ${pixelBorder(applyVar('text-color'), 1.5)}

      color: ${applyVar('text-color')};
      opacity: 0.5;
    }
  }
`;
