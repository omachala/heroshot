import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Heroshot',
  description: 'Screenshot automation CLI tool',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['script', { async: '', src: 'https://www.googletagmanager.com/gtag/js?id=G-3MGBYS1GNM' }],
    [
      'script',
      {},
      `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-3MGBYS1GNM');`,
    ],
  ],

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'API', link: '/api/cli' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is Heroshot?', link: '/guide/' },
            { text: 'Getting Started', link: '/guide/getting-started' },
          ],
        },
        {
          text: 'Guides',
          items: [{ text: 'Automated Updates', link: '/guide/automated-updates' }],
        },
      ],
      '/api/': [
        {
          text: 'Reference',
          items: [{ text: 'CLI', link: '/api/cli' }],
        },
      ],
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/AlteriusOmega/heroshot' }],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present',
    },
  },
});
