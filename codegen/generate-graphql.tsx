#!/usr/bin/env node --no-warnings --experimental-specifier-resolution=node --loader ts-node/esm
import { writeFileSync } from 'node:fs';
import { join, posix, relative, sep } from 'node:path';
import chalk from 'chalk';
import { globSync } from 'glob';
import { format } from 'prettier';
import isOpenSource from '../infra/isOpenSource.tsx';
import sign from './lib/sign.tsx';

console.log(chalk.bold('› Generating GraphQL schema import map...'));

const root = process.cwd();
const path = join(root, 'artemis/graphql');
const outputFile = join(path, 'schemaImportMap.tsx');

const files = (
  await Promise.all(
    globSync(`${path}/{nodes,mutations}/*.tsx`.split(sep).join(posix.sep)),
  )
)
  .map((file) => relative(path, file.slice(0, file.lastIndexOf('.'))))
  .sort((a, b) => String(a).localeCompare(String(b)));

if (files.length) {
  writeFileSync(
    outputFile,
    sign(
      await format(
        `${files.map((name) => `import './${name}.tsx';`).join('\n')}`,
        {
          filepath: outputFile,
          singleQuote: true,
        },
      ),
    ),
  );
} else {
  const message = `generate-graphql: No GraphQL schema files found.`;
  if (!isOpenSource()) {
    throw new Error(message);
  }

  console.warn('  ' + chalk.yellow(message));
}

console.log(chalk.bold.green('✓ Done generating GraphQL schema import map.'));
