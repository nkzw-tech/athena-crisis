import jestImageSnapshot from 'jest-image-snapshot';
import { expect } from 'vitest';

expect.extend({
  toMatchImageSnapshot: jestImageSnapshot.configureToMatchImageSnapshot({
    comparisonMethod: 'ssim',
    customSnapshotIdentifier: ({
      defaultIdentifier,
    }: {
      defaultIdentifier: string;
    }) => defaultIdentifier.replaceAll('-test-tsx-', '-'),
    dumpInlineDiffToConsole: true,
    failureThreshold: 0.015,
    failureThresholdType: 'percent',
  }),
});
