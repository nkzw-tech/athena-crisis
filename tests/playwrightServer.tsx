import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import playwright from 'playwright';

export async function setup() {
  const instance = await playwright.chromium.launchServer();
  writeFileSync(
    join(dirname(fileURLToPath(import.meta.url)), 'testSetup'),
    instance.wsEndpoint(),
  );
  return async () => {
    await instance.close();
  };
}
