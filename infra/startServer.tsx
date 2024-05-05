import { join } from 'node:path';
import chalk from 'chalk';
import { ViteDevServer as _ViteDevServer, createServer } from 'vite';

export default async function startServer({
  name,
  port,
  root,
  silent,
}: {
  name: 'Ares' | 'Deimos' | 'Tests';
  port: number;
  root: string;
  silent?: boolean;
}): Promise<ViteDevServer> {
  const server = await createServer({
    configFile: join(root, './vite.config.ts'),
    root,
    server: {
      port,
    },
  });
  await server.listen();

  if (!silent) {
    console.log(chalk.green.bold(name));
    server.printUrls();
  }

  return server;
}

export type ViteDevServer = _ViteDevServer;
