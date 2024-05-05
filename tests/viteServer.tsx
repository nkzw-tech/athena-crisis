import startServer from '../infra/startServer.tsx';

const APP_PORT = 3001;
const BASE_URL = `http://localhost:${APP_PORT}/display.html`;

export async function setup() {
  const server = await startServer({
    name: 'Tests',
    port: APP_PORT,
    root: import.meta.dirname,
    silent: true,
  });

  fetch(BASE_URL);

  return async () => {
    await server.close();
  };
}
