import type { NativeApp } from '../App.tsx';

export default function waitForAppInitialization(app: Partial<NativeApp> | null): Promise<void> {
  if (app?.whenReady) {
    return app.whenReady();
  }

  if (!app?.getSteamUserId || app.getSteamUserId()) {
    return Promise.resolve();
  }

  // Older Electron clients expose an empty ID before initialization and '0' when
  // Steam is unavailable. Wait for either a real ID or that non-Steam sentinel.
  // Very old clients can keep the ID empty, so always allow password login after
  // a bounded wait instead of leaving those users on the loading screen.
  return new Promise((resolve) => {
    const finish = () => {
      clearInterval(interval);
      clearTimeout(timeout);
      resolve();
    };
    const interval = setInterval(() => {
      if (app.getSteamUserId?.()) {
        finish();
      }
    }, 50);
    const timeout = setTimeout(finish, 5000);
  });
}
