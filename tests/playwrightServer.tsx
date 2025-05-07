import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import playwright from 'playwright';

export async function setup() {
  const instance = await playwright.chromium.launchServer();
  writeFileSync(join(import.meta.dirname, 'testSetup'), instance.wsEndpoint());
  return async () => {
    await instance.close();
  };
}
