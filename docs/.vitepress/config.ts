import { defineConfig } from 'vitepress';
import { resolve } from 'node:path';
import llmstxt from 'vitepress-plugin-llms';
import { heroshot } from '../../integrations/shared/vitePlugin';

const SITE_URL = 'https://heroshot.sh';
const SITE_NAME = 'Heroshot';
const DEFAULT_DESCRIPTION =
  'Free, open-source screenshot automation. Your UI changes constantly. Heroshot updates every screenshot in your docs with a single command.';
const OG_IMAGE = `${SITE_URL}/screenshots/hero-desktop-light.png`;

export default defineConfig({
  vite: {
    plugins: [llmstxt(), heroshot()],
    resolve: {
      alias: {
        // Resolve heroshot integrations to local source (npm package doesn't include dist/integrations)
        'heroshot/vitepress': resolve(__dirname, '../../integrations/vue/src/index.ts'),
        'heroshot/vue': resolve(__dirname, '../../integrations/vue/src/index.ts'),
        'heroshot/react': resolve(__dirname, '../../integrations/react/src/index.ts'),
        'heroshot/docusaurus': resolve(__dirname, '../../integrations/react/src/index.ts'),
      },
    },
  },
  title: SITE_NAME,
  description: DEFAULT_DESCRIPTION,
  sitemap: { hostname: SITE_URL },

  // Dynamic page-level SEO via transformPageData
  transformPageData(pageData) {
    // Build canonical URL
    const canonicalUrl = `${SITE_URL}/${pageData.relativePath}`
      .replace(/index\.md$/, '')
      .replace(/\.md$/, '.html');

    // Get page-specific title and description
    const pageTitle = pageData.frontmatter.title || pageData.title;
    const fullTitle = pageTitle ? `${pageTitle} | ${SITE_NAME}` : SITE_NAME;
    const pageDescription =
      pageData.frontmatter.description || pageData.description || DEFAULT_DESCRIPTION;

    // Add dynamic head tags
    pageData.frontmatter.head ??= [];
    pageData.frontmatter.head.push(
      // Canonical URL - critical for SEO
      ['link', { rel: 'canonical', href: canonicalUrl }],
      // Robots
      ['meta', { name: 'robots', content: 'index, follow' }],
      // Dynamic Open Graph
      ['meta', { property: 'og:title', content: fullTitle }],
      ['meta', { property: 'og:description', content: pageDescription }],
      ['meta', { property: 'og:url', content: canonicalUrl }],
      // Dynamic Twitter
      ['meta', { name: 'twitter:title', content: fullTitle }],
      ['meta', { name: 'twitter:description', content: pageDescription }]
    );
  },

  head: [
    // Favicons - multiple formats for browser and Google Search
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/favicon-192.png' }],
    ['link', { rel: 'icon', href: '/favicon.ico', sizes: '48x48' }],
    ['link', { rel: 'apple-touch-icon', href: '/favicon-192.png' }],
    // Theme color for mobile browsers
    ['meta', { name: 'theme-color', content: '#ea580c' }],
    // Language
    ['meta', { property: 'og:locale', content: 'en_US' }],
    // Structured data for Google Search
    [
      'script',
      { type: 'application/ld+json' },
      JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/favicon-192.png`,
        image: `${SITE_URL}/favicon-192.png`,
        description: DEFAULT_DESCRIPTION,
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Windows, macOS, Linux',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      }),
    ],
    // Static Open Graph (fallbacks - dynamic ones override these)
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: SITE_NAME }],
    ['meta', { property: 'og:image', content: OG_IMAGE }],
    ['meta', { property: 'og:image:width', content: '2560' }],
    ['meta', { property: 'og:image:height', content: '1048' }],
    // Static Twitter (fallbacks)
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:image', content: OG_IMAGE }],
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
            { text: 'React', link: '/docs/integrations/react' },
            { text: 'Vue', link: '/docs/integrations/vue' },
            { text: 'Markdown', link: '/docs/integrations/markdown' },
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
