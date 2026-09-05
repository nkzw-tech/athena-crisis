import { afterEach, expect, test, vi } from 'vitest';
import waitForAppInitialization from '../waitForAppInitialization.tsx';

afterEach(() => {
  vi.useRealTimers();
});

test('uses the readiness promise when the desktop bridge supports it', async () => {
  const ready = Promise.withResolvers<void>();
  const whenReady = vi.fn(() => ready.promise);
  const onReady = vi.fn();
  const result = waitForAppInitialization({ whenReady }).then(onReady);
  await Promise.resolve();
  expect(whenReady).toHaveBeenCalledOnce();
  expect(onReady).not.toHaveBeenCalled();
  ready.resolve();
  await result;
  expect(onReady).toHaveBeenCalledOnce();
});

test.each(['123', '0'])(
  'waits for a legacy desktop bridge to initialize with ID %j',
  async (id) => {
    vi.useFakeTimers();
    const getSteamUserId = vi.fn(() => '');
    const onReady = vi.fn();
    const ready = waitForAppInitialization({ getSteamUserId }).then(onReady);
    await vi.advanceTimersByTimeAsync(250);
    expect(onReady).not.toHaveBeenCalled();
    getSteamUserId.mockReturnValue(id);
    await vi.advanceTimersByTimeAsync(50);
    await ready;
    expect(onReady).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  },
);

test.each(['123', '0'])('does not delay a legacy bridge that already has ID %j', async (id) => {
  vi.useFakeTimers();
  await expect(waitForAppInitialization({ getSteamUserId: () => id })).resolves.toBeUndefined();
  expect(vi.getTimerCount()).toBe(0);
});

test('bounds the wait for very old non-Steam clients that always report an empty ID', async () => {
  vi.useFakeTimers();
  const onReady = vi.fn();
  const ready = waitForAppInitialization({ getSteamUserId: () => '' }).then(onReady);
  await vi.advanceTimersByTimeAsync(4999);
  expect(onReady).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(1);
  await ready;
  expect(onReady).toHaveBeenCalledOnce();
  expect(vi.getTimerCount()).toBe(0);
});

test.each([null, {}])('does not wait without Steam bridge capabilities: %j', async (app) => {
  vi.useFakeTimers();
  await expect(waitForAppInitialization(app)).resolves.toBeUndefined();
  expect(vi.getTimerCount()).toBe(0);
});
