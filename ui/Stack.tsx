import { css, cx } from '@emotion/css';
import { CSSProperties, HTMLAttributes, ReactNode, Ref, useMemo } from 'react';
import Breakpoints from './Breakpoints.tsx';

export type Gap = 1 | 2 | 4 | 16 | 24 | 32 | true;

export type StackProps = {
  adaptive?: true;
  alignCenter?: true;
  alignEnd?: true;
  alignNormal?: true;
  center?: true;
  children?: ReactNode;
  className?: string;
  end?: true;
  flex1?: true;
  gap?: Gap;
  horizontalPadding?: true;
  inline?: true;
  nowrap?: true;
  padding?: true;
  ref?: Ref<HTMLDivElement>;
  reverse?: true;
  selfCenter?: true;
  start?: true;
  stretch?: true;
  style?: CSSProperties;
  vertical?: true;
  verticalPadding?: true;
};

export default function Stack({
  adaptive,
  alignCenter,
  alignEnd,
  alignNormal,
  center,
  className: initialClassName,
  end,
  flex1,
  gap: _gap,
  horizontalPadding,
  inline,
  nowrap,
  padding,
  ref,
  reverse,
  selfCenter,
  start,
  stretch,
  style,
  vertical,
  verticalPadding,
  ...props
}: HTMLAttributes<HTMLDivElement> & StackProps) {
  const gap = _gap === true ? defaultGap : _gap;
  if (gap) {
    style = { ...style, gap };
    if (padding || verticalPadding) {
      style = { ...style, paddingBottom: gap, paddingTop: gap };
    }
    if (padding || horizontalPadding) {
      style = { ...style, paddingLeft: gap, paddingRight: gap };
    }
  }

  const className = useMemo(
    () =>
      cx(
        baseStyle,
        inline && inlineStyle,
        adaptive && adaptiveStyle,
        vertical && verticalStyle,
        reverse && (vertical ? verticalReverseStyle : reverseStyle),
        reverse && adaptive && vertical && adaptiveVerticalReverseStyle,
        center && centerStyle,
        start && startStyle,
        end && endStyle,
        flex1 && flex1Style,
        alignNormal && flexStartStyle,
        alignCenter && alignCenterStyle,
        alignEnd && alignEndStyle,
        selfCenter && selfCenterStyle,
        nowrap && nowrapStyle,
        stretch && stretchStyle,
        initialClassName,
      ),
    [
      adaptive,
      alignCenter,
      alignEnd,
      alignNormal,
      center,
      initialClassName,
      end,
      flex1,
      inline,
      nowrap,
      reverse,
      selfCenter,
      start,
      stretch,
      vertical,
    ],
  );

  return <div {...props} className={className} ref={ref} style={style} />;
}

const defaultGap = 8;

const baseStyle = css`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
`;

const inlineStyle = css`
  display: inline-flex;
`;

const adaptiveStyle = css`
  flex-direction: column;

  ${Breakpoints.sm} {
    flex-direction: row;
  }
`;

const verticalStyle = css`
  flex-direction: column;
`;

const reverseStyle = css`
  flex-direction: row-reverse;
`;

const verticalReverseStyle = css`
  flex-direction: column-reverse;
`;

const adaptiveVerticalReverseStyle = css`
  ${Breakpoints.sm} {
    flex-direction: row;
  }
`;

const flex1Style = css`
  flex: 1;
`;

const centerStyle = css`
  justify-content: center;
`;

const startStyle = css`
  justify-content: flex-start;
`;

const nowrapStyle = css`
  flex-wrap: nowrap;
`;

const endStyle = css`
  justify-content: flex-end;
`;

const flexStartStyle = css`
  align-items: flex-start;
`;

const alignCenterStyle = css`
  align-items: center;
`;

const alignEndStyle = css`
  align-items: end;
`;

const stretchStyle = css`
  flex-grow: 1;
`;

const selfCenterStyle = css`
  align-self: center;
`;
