import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Heroshot',
  description:
    'Free, open-source screenshot automation. Your UI changes constantly. Heroshot updates every screenshot in your docs with a single command.',
  sitemap: { hostname: 'https://heroshot.sh' },

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
      { text: 'Docs', link: '/docs/' },
      { text: 'Guides', link: '/docs/guide/automated-updates' },
      { text: 'Integrations', link: '/docs/integrations/vitepress' },
      { text: 'GitHub', link: 'https://github.com/omachala/heroshot', target: '_blank' },
      { text: 'NPM', link: 'https://www.npmjs.com/package/heroshot', target: '_blank' },
    ],

    sidebar: {
      '/docs/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is Heroshot?', link: '/docs/' },
            { text: 'Getting Started', link: '/docs/getting-started' },
          ],
        },
        {
          text: 'CLI',
          items: [
            { text: 'CLI Reference', link: '/docs/cli' },
            { text: 'Configuration', link: '/docs/config' },
          ],
        },
        {
          text: 'Guides',
          items: [{ text: 'Automated Updates', link: '/docs/guide/automated-updates' }],
        },
        {
          text: 'Integrations',
          items: [
            { text: 'VitePress', link: '/docs/integrations/vitepress' },
            { text: 'Docusaurus', link: '/docs/integrations/docusaurus' },
            { text: 'MkDocs', link: '/docs/integrations/mkdocs' },
            { text: 'Sphinx', link: '/docs/integrations/sphinx' },
            { text: 'GitBook', link: '/docs/integrations/gitbook' },
          ],
        },
      ],
    },

    socialLinks: [],

    footer: {
      copyright: '© 2026 Heroshot',
    },
  },
});
