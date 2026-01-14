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
    logo: '/nav-logo.svg',

    nav: [
      { text: 'Docs', link: '/guide/' },
      { text: 'Guides', link: '/guide/automated-updates' },
      { text: 'CLI', link: '/api/cli' },
      { text: 'GitHub', link: 'https://github.com/omachala/heroshot', target: '_blank' },
      { text: 'NPM', link: 'https://www.npmjs.com/package/heroshot', target: '_blank' },
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

    socialLinks: [],

    footer: {
      copyright: '© 2026 Heroshot',
    },
  },
});
