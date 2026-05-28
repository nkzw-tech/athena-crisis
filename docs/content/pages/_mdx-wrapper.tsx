import type React from 'react';
import { Layout } from 'vocs';

export default function MdxWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link href="/apple-touch-icon.png" rel="apple-touch-icon" />
      <link as="font" href="/fonts/AthenaNova.woff2" rel="preload" type="font/woff2" />
      <Layout>{children}</Layout>
    </>
  );
}
