#!/usr/bin/env node --no-warnings --experimental-specifier-resolution=node --loader ts-node/esm
import toSlug from '@deities/apollo/lib/toSlug.tsx';
import chalk from 'chalk';
import { globSync } from 'glob';
import { writeFileSync } from 'node:fs';
import { join, posix, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { format } from 'oxfmt';
import sign from './lib/sign.tsx';

console.log(chalk.bold('› Generating campaign names...'));

const root = process.cwd();
const globs: ReadonlyArray<string> = ['./hermes/map-fixtures/*.tsx', './fixtures/map/*.tsx'];
const outputFile = join(root, './hermes/CampaignMapName.tsx');
const formatWithOxfmt = async (filePath: string, sourceText: string) => {
  const { code, errors } = await format(filePath, sourceText, {
    singleQuote: true,
  });
  if (errors.length) {
    throw new Error(
      `generate-campaign-names: Failed to format '${filePath}' with oxfmt:\n${errors
        .map(({ message }) => message)
        .join('\n')}`,
    );
  }
  return code;
};

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
    await formatWithOxfmt(
      outputFile,
      `export type CampaignMapName = ${maps.map((name) => `'${name}'`).join(' | ')};`,
    ),
  ),
);

console.log(chalk.bold.green('✓ Done generating campaign names.'));
