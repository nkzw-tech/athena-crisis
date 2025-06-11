import { readFileSync } from 'node:fs';
import babelPluginEmotion from '@emotion/babel-plugin';
import react from '@vitejs/plugin-react';
import React from 'react';
import { defineConfig } from 'vocs';
import presets from '../infra/babelPresets.tsx';
import createResolver from '../infra/createResolver.tsx';

const Licht = JSON.parse(
  readFileSync('./node_modules/licht-theme/licht.json', 'utf8'),
);
const Dunkel = JSON.parse(
  readFileSync('./node_modules/dunkel-theme/dunkel.json', 'utf8'),
);

export default defineConfig({
  basePath: '/open-source',
  baseUrl: 'https://athenacrisis.com/open-source',
  description: 'Open Source Docs & Playground',
  editLink: {
    pattern:
      'https://github.com/nkzw-tech/athena-crisis/tree/main/docs/content/pages/:path',
    text: 'Edit on GitHub',
  },
  font: {
    mono: {
      google: 'Fira Code',
    },
  },
  head: (
    <>
      <link href="/apple-touch-icon.png" rel="apple-touch-icon" />
      <link
        as="font"
        href="/fonts/AthenaNova.woff2"
        rel="preload"
        type="font/woff2"
      />
    </>
  ),
  iconUrl: '/favicon.png',
  markdown: {
    code: {
      themes: {
        dark: Dunkel,
        light: Licht,
      },
    },
  },
  ogImageUrl:
    'https://vocs.dev/api/og?logo=%logo&title=%title&description=%description',
  rootDir: './content',
  sidebar: [
    {
      link: '/getting-started',
      text: 'Getting Started',
    },
    {
      items: [
        {
          link: '/core-concepts/overview',
          text: 'Overview',
        },
        {
          link: '/core-concepts/immutable-data-structures',
          text: 'Immutable Data Structures',
        },
        {
          link: '/core-concepts/map-data',
          text: 'MapData ',
        },
        {
          link: '/core-concepts/actions',
          text: 'Actions ',
        },
        {
          link: '/core-concepts/ai',
          text: 'AI Deep Dive',
        },
      ],
      text: 'Core Concepts',
    },
    {
      items: [
        {
          link: '/ui/game-components',
          text: 'Game Components',
        },
      ],
      text: 'UI Components',
    },
    {
      items: [
        {
          link: '/playground/map-editor',
          text: 'Map Editor',
        },
        {
          link: '/playground/ai',
          text: 'AI',
        },
      ],
      text: 'Playground',
    },
  ],
  socials: [
    {
      icon: 'github',
      link: 'https://github.com/nkzw-tech/athena-crisis',
    },
    {
      icon: 'discord',
      link: 'https://discord.gg/athenacrisis',
    },
    {
      icon: 'x',
      link: 'https://twitter.com/TheAthenaCrisis',
    },
  ],
  theme: {
    accentColor: '#c3217f',
  },
  title: 'Athena Crisis',
  topNav: [
    { link: '/core-concepts/overview', match: '/core-concepts', text: 'Docs' },
    {
      link: 'https://store.steampowered.com/app/2456430/Athena_Crisis/',
      text: 'AC on Steam',
    },
    {
      items: [
        {
          link: 'https://nkzw.tech',
          text: 'Nakazawa Tech',
        },
      ],
      text: 'More',
    },
  ],
  vite: {
    define: {
      'process.env.IS_LANDING_PAGE': `1`,
    },
    plugins: [
      react({
        babel: {
          plugins: [babelPluginEmotion],
          presets,
        },
      }),
    ],
    resolve: {
      alias: [createResolver()],
    },
  },
});
