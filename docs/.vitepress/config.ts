import { defineConfig } from 'vitepress';
import llmstxt from 'vitepress-plugin-llms';
import { heroshot } from '../../integrations/shared/vitePlugin';

export default defineConfig({
  vite: {
    plugins: [llmstxt(), heroshot()],
  },
  title: 'Heroshot',
  description:
    'Free, open-source screenshot automation. Your UI changes constantly. Heroshot updates every screenshot in your docs with a single command.',
  sitemap: { hostname: 'https://heroshot.sh' },

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    // Open Graph
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'Heroshot' }],
    [
      'meta',
      {
        property: 'og:description',
        content:
          'Free, open-source screenshot automation. Define once, regenerate forever with one command.',
      },
    ],
    ['meta', { property: 'og:url', content: 'https://heroshot.sh' }],
    [
      'meta',
      { property: 'og:image', content: 'https://heroshot.sh/screenshots/hero-desktop-light.png' },
    ],
    ['meta', { property: 'og:image:width', content: '2560' }],
    ['meta', { property: 'og:image:height', content: '1048' }],
    ['meta', { property: 'og:site_name', content: 'Heroshot' }],
    // Twitter
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'Heroshot' }],
    [
      'meta',
      {
        name: 'twitter:description',
        content:
          'Free, open-source screenshot automation. Define once, regenerate forever with one command.',
      },
    ],
    [
      'meta',
      { name: 'twitter:image', content: 'https://heroshot.sh/screenshots/hero-desktop-light.png' },
    ],
    // Analytics
    ['script', { async: '', src: 'https://www.googletagmanager.com/gtag/js?id=G-3MGBYS1GNM' }],
    [
      'script',
      {},
      `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-3MGBYS1GNM');`,
    ],
  ],

  lastUpdated: true,

  themeConfig: {
    logo: '/nav-logo.svg',
    siteTitle: 'Heroshot',

    search: {
      provider: 'local',
    },

    editLink: {
      pattern: 'https://github.com/omachala/heroshot/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    lastUpdated: {
      text: 'Last updated',
    },

    outline: {
      level: [2, 3],
      label: 'On this page',
    },

    nav: [
      { text: 'Docs', link: '/docs/' },
      { text: 'Guides', link: '/docs/guide/automated-updates' },
      { text: 'Integrations', link: '/docs/integrations/vitepress' },
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

    socialLinks: [
      { icon: 'github', link: 'https://github.com/omachala/heroshot' },
      { icon: 'npm', link: 'https://www.npmjs.com/package/heroshot' },
    ],

    footer: {
      copyright: '© 2026 Heroshot',
    },
  },
});
