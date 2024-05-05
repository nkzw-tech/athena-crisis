#!/usr/bin/env node --no-warnings --experimental-specifier-resolution=node --loader ts-node/esm

import('./generate-actions.tsx');
import('./generate-campaign-names.tsx');
import('./generate-translations.tsx');
import('./generate-graphql.tsx');
import('./generate-routes.tsx');
