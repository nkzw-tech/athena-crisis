import { css, cx } from '@emotion/css';
import { HTMLAttributes } from 'react';
import clipBorder from './clipBorder.tsx';
import { applyVar } from './cssVar.tsx';
import Stack, { StackProps } from './Stack.tsx';

export default function InfoBox(
  props: HTMLAttributes<HTMLDivElement> & StackProps,
) {
  return <Stack {...props} className={cx(props.className, boxStyle)} />;
}

const boxStyle = css`
  ${clipBorder()}

  background: ${applyVar('background-color')};
  padding: 12px;
`;
