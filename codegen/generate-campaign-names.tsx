#!/usr/bin/env node --no-warnings --experimental-specifier-resolution=node --loader ts-node/esm
import { writeFileSync } from 'node:fs';
import { join, posix, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import toSlug from '@deities/apollo/lib/toSlug.tsx';
import chalk from 'chalk';
import { globSync } from 'glob';
import { format } from 'prettier';
import sign from './lib/sign.tsx';

console.log(chalk.bold('› Generating campaign names...'));

const root = process.cwd();
const globs: ReadonlyArray<string> = [
  './hermes/map-fixtures/*.tsx',
  './fixtures/map/*.tsx',
];
const outputFile = join(root, './hermes/CampaignMapName.tsx');

const maps = (
  await Promise.all(
    globs
      .flatMap((path) => globSync(join(root, path).split(sep).join(posix.sep)))
      .map((file) => import(pathToFileURL(file).toString())),
  )
)
  .filter((module) => module.metadata.tags?.includes('campaign'))
  .map((module) => toSlug(module.metadata.name))
  .sort((a, b) => String(a).localeCompare(String(b)));

writeFileSync(
  outputFile,
  sign(
    await format(
      `export type CampaignMapName = ${maps
        .map((name) => `'${name}'`)
        .join(' | ')};`,
      {
        filepath: outputFile,
        singleQuote: true,
      },
    ),
  ),
);

console.log(chalk.bold.green('✓ Done generating campaign names.'));
