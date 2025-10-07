import { css, cx } from '@emotion/css';
import Stack, { StackProps } from '@nkzw/stack';
import { HTMLAttributes } from 'react';
import clipBorder from './clipBorder.tsx';
import { applyVar } from './cssVar.tsx';

export default function InfoBox(
  props: HTMLAttributes<HTMLDivElement> & StackProps,
) {
  return (
    <Stack {...props} between className={cx(props.className, boxStyle)} wrap />
  );
}

const boxStyle = css`
  ${clipBorder()}

  background: ${applyVar('background-color')};
  padding: 12px;
`;
