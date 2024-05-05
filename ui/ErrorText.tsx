import { memo, ReactNode } from 'react';
import { applyVar } from './cssVar.tsx';

export default memo(function ErrorText({ children }: { children: ReactNode }) {
  return <p style={{ color: applyVar('error-color') }}>{children}</p>;
});
