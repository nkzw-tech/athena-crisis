import { basename, extname } from 'node:path';
import jestImageSnapshot from 'jest-image-snapshot';
import stripAnsi from 'strip-ansi';
import { expect } from 'vitest';

expect.extend({
  toMatchImageSnapshot: jestImageSnapshot.configureToMatchImageSnapshot({
    comparisonMethod: 'ssim',
    customSnapshotIdentifier: ({
      counter,
      currentTestName,
      testPath,
    }: {
      counter: number;
      currentTestName: string;
      testPath: string;
    }) => {
      const name = basename(testPath, '.test' + extname(testPath)) + 'Test';
      const testName = stripAnsi(currentTestName).split(' > ', 2)[1];
      return `${name}-${testName
        // eslint-disable-next-line no-control-regex
        .replaceAll(/[^\u0000-\u007F]|\s+/gi, '-')
        .replaceAll(/-{2,}/g, '-')}-${counter}`;
    },
    dumpInlineDiffToConsole: true,
    failureThreshold: 0.015,
    failureThresholdType: 'percent',
  }),
});
