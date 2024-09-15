import InfoBox from '@deities/ui/InfoBox.tsx';
import { css } from '@emotion/css';
import { ReactNode } from 'react';

export default function TileBox({ children }: { children: ReactNode }) {
  return (
    <InfoBox className={boxStyle} gap vertical>
      {children}
    </InfoBox>
  );
}

const boxStyle = css`
  width: fit-content;
`;
