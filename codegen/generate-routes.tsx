#!/usr/bin/env node --no-warnings --experimental-specifier-resolution=node --loader ts-node/esm
import { parse } from '@babel/parser';
import { NodePath } from '@babel/traverse';
import { JSXIdentifier } from '@babel/types';
import chalk from 'chalk';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { format } from 'oxfmt';
import isOpenSource from '../infra/isOpenSource.tsx';
import sign from './lib/sign.tsx';
import traverse from './lib/traverse.tsx';

console.log(chalk.bold('› Generating routes...'));

const root = process.cwd();
const routesFileName = join(root, './apollo/Routes.tsx');
const files = ['./ares/src/ui/Main.tsx'];
const formatWithOxfmt = async (filePath: string, sourceText: string) => {
  const { code, errors } = await format(filePath, sourceText, {
    singleQuote: true,
  });
  if (errors.length) {
    throw new Error(
      `generate-routes: Failed to format '${filePath}' with oxfmt:\n${errors
        .map(({ message }) => message)
        .join('\n')}`,
    );
  }
  return code;
};

type Route = string;

const extract = (files: Array<string>): ReadonlySet<Route> => {
  const routes = new Set<Route>();
  for (const file of files) {
    const filePath = join(root, file);
    if (!existsSync(filePath)) {
      const message = `generate-routes: File '${filePath}' is not present.`;
      if (!isOpenSource()) {
        throw new Error(message);
      }

      console.warn('  ' + chalk.yellow(message));
      continue;
    }

    const ast = parse(readFileSync(filePath, 'utf8'), {
      plugins: ['typescript', 'jsx'],
      sourceType: 'module',
    });
    traverse(ast, {
      JSXIdentifier(path: NodePath<JSXIdentifier>) {
        if (
          path.node.name === 'Route' &&
          path.parentPath?.node?.type === 'JSXOpeningElement'
        ) {
          const attribute = path.parentPath
            .get('attributes')
            .find(
              (prop) =>
                prop.node?.type === 'JSXAttribute' &&
                prop.node.name.type === 'JSXIdentifier' &&
                prop.node.name.name === 'path',
            );
          if (
            attribute?.node &&
            attribute.node.type === 'JSXAttribute' &&
            attribute.node.value?.type === 'StringLiteral'
          ) {
            const routePath = attribute.node.value.value;
            if (routePath === '*') {
              return;
            }
            if (!routePath.startsWith('/')) {
              throw new Error(
                `generate-routes: Route path '${routePath}' must start with '/'.`,
              );
            }

            routes.add(routePath);
          }
        }
      },
    });
  }
  return routes;
};

const encodeRoute = (route: string) =>
  '`' + route.replaceAll(/:([^/]*?)+/gi, '${string}') + '${`?${string}` | ``}`';

const encodeRouteType = (routes: ReadonlySet<Route>): ReadonlySet<string> => {
  const encodedRoutes = new Set<string>();
  for (const route of routes) {
    if (!route.startsWith('/:')) {
      encodedRoutes.add(encodeRoute(route));
    }
  }
  return encodedRoutes;
};

const encodeUserRouteType = (
  routes: ReadonlySet<Route>,
): [
  userRoutes: ReadonlySet<string>,
  mapRoutes: ReadonlySet<string>,
  campaignRoutes: ReadonlySet<string>,
] => {
  const userRoutes = new Set<string>();
  const mapRoutes = new Set<string>();
  const campaignRoutes = new Set<string>();
  for (const route of routes) {
    if (route.startsWith('/:username')) {
      const userRoute = route.split('/').slice(2).join('/');
      if (userRoute?.length) {
        if (userRoute.startsWith(':slug')) {
          const mapRoute = userRoute.split('/').slice(1).join('/');
          mapRoutes.add(encodeRoute(mapRoute));
        } else if (userRoute.startsWith('campaign/')) {
          const campaignRoute = userRoute.split('/').slice(2).join('/');
          campaignRoutes.add(encodeRoute(campaignRoute));
        } else {
          userRoutes.add(encodeRoute(userRoute));
        }
      }
    }
  }
  return [userRoutes, mapRoutes, campaignRoutes];
};

const encodeTopLevelRouteNames = (
  routes: ReadonlySet<Route>,
): ReadonlySet<string> => {
  const topLevelRoutes = new Set<string>();
  for (const route of routes) {
    const topLevelRoute =
      route.split('/')[route.startsWith('/:username') ? 2 : 1];
    if (topLevelRoute?.length && !topLevelRoute.startsWith(':')) {
      topLevelRoutes.add(topLevelRoute);
    }
  }
  return topLevelRoutes;
};

const writeRoutesFile = async (routes: ReadonlySet<Route>) => {
  const [userRoutes, mapRoutes, campaignRoutes] = encodeUserRouteType(routes);
  const code = routes.size
    ? [
        `export type Route = ${[...encodeRouteType(routes)].join('|')};`,
        `export type UserCampaignRoute = ${[...campaignRoutes].join('|')};`,
        `export type UserMapRoute = ${[...mapRoutes].join('|')};`,
        `export type UserRoute = \`\${string}/\${UserMapRoute}\` | \`campaign/\${string}/\${UserCampaignRoute}\`${
          userRoutes.size ? ` | ${[...userRoutes].join('|')}` : ''
        };`,
        `export const Route = new Set(${JSON.stringify([
          ...encodeTopLevelRouteNames(routes),
        ])});`,
      ]
    : [
        `export type Route = string;`,
        `export type UserCampaignRoute = string;`,
        `export type UserMapRoute = string;`,
        `export type UserRoute = string;`,
        `export const Route = new Set<string>();`,
      ];
  writeFileSync(
    routesFileName,
    sign(await formatWithOxfmt(routesFileName, code.join('\n\n'))),
  );
};

await writeRoutesFile(extract(files));

console.log(chalk.bold.green('✓ Done generating routes.'));
