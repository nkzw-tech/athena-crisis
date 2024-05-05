import clipBorder from '@deities/ui/clipBorder.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { css } from '@emotion/css';
import { ReactNode } from 'react';

export default function TileBox({ children }: { children: ReactNode }) {
  return (
    <Stack className={boxStyle} gap vertical>
      {children}
    </Stack>
  );
}

const boxStyle = css`
  ${clipBorder()}
  background: ${applyVar('background-color')};
  padding: 12px;
  width: fit-content;
`;
