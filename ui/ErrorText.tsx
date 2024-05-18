import type { ReactNode } from 'react';
import { memo } from 'react';
import { applyVar } from './cssVar.tsx';

export default memo(function ErrorText({ children }: { children: ReactNode }) {
  return <p style={{ color: applyVar('error-color') }}>{children}</p>;
});
