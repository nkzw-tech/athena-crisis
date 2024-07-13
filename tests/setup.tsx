import jestImageSnapshot from 'jest-image-snapshot';
import { expect } from 'vitest';

expect.extend({
  toMatchImageSnapshot: jestImageSnapshot.configureToMatchImageSnapshot({
    comparisonMethod: 'ssim',
    customSnapshotIdentifier: ({ defaultIdentifier }) =>
      defaultIdentifier.replaceAll('-test-tsx-', '-'),
    dumpInlineDiffToConsole: true,
    failureThreshold: 0.01,
    failureThresholdType: 'percent',
  }),
});
