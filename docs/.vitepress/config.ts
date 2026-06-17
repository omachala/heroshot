import { defineConfig } from 'vitepress';
import { resolve } from 'node:path';
import llmstxt from 'vitepress-plugin-llms';
import { heroshot } from '../../integrations/shared/vitePlugin';

const SITE_URL = 'https://heroshot.dev';
const SITE_NAME = 'Heroshot';
const SITE_TITLE = 'Heroshot - Screenshot Automation for Documentation';
const DEFAULT_DESCRIPTION =
  'Free, open-source CLI tool that automates documentation screenshots. Define once with a visual picker, regenerate forever with one command. Works with VitePress, Docusaurus, MkDocs, Sphinx, and more.';
const DEFAULT_KEYWORDS =
  'screenshot automation, documentation screenshots, automated screenshots, screenshot tool, documentation tool, playwright screenshots, vitepress, docusaurus, mkdocs';
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
        'heroshot/svelte': resolve(__dirname, '../../integrations/svelte/src/index.ts'),
        'heroshot/sveltekit': resolve(__dirname, '../../integrations/svelte/src/index.ts'),
        'heroshot/next': resolve(__dirname, '../../integrations/next/src/index.ts'),
        'heroshot/nuxt': resolve(__dirname, '../../integrations/vue/src/index.ts'),
      },
    },
  },
  title: SITE_NAME,
  titleTemplate: `:title | ${SITE_NAME}`,
  description: DEFAULT_DESCRIPTION,
  sitemap: { hostname: SITE_URL },

  // Dynamic page-level SEO via transformPageData
  transformPageData(pageData) {
    // Build canonical URL
    const canonicalUrl = `${SITE_URL}/${pageData.relativePath}`
      .replace(/index\.md$/, '')
      .replace(/\.md$/, '.html');

    // Homepage gets the full branded title, other pages get "Page | Heroshot"
    const isHomePage = pageData.relativePath === 'index.md';
    const pageTitle = pageData.frontmatter.title || pageData.title;
    const fullTitle = isHomePage
      ? pageTitle || SITE_TITLE
      : pageTitle
        ? `${pageTitle} | ${SITE_NAME}`
        : SITE_NAME;
    const pageDescription =
      pageData.frontmatter.description || pageData.description || DEFAULT_DESCRIPTION;
    const pageKeywords = pageData.frontmatter.keywords || DEFAULT_KEYWORDS;

    // Add dynamic head tags
    pageData.frontmatter.head ??= [];
    pageData.frontmatter.head.push(
      // Canonical URL - critical for SEO
      ['link', { rel: 'canonical', href: canonicalUrl }],
      // Robots
      ['meta', { name: 'robots', content: 'index, follow' }],
      // Keywords
      ['meta', { name: 'keywords', content: pageKeywords }],
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
        alternateName: 'heroshot',
        url: SITE_URL,
        logo: `${SITE_URL}/favicon-192.png`,
        image: OG_IMAGE,
        screenshot: OG_IMAGE,
        description: DEFAULT_DESCRIPTION,
        applicationCategory: 'DeveloperApplication',
        applicationSubCategory: 'Documentation Tools',
        operatingSystem: 'Windows, macOS, Linux',
        programmingLanguage: 'TypeScript',
        runtimePlatform: 'Node.js',
        softwareRequirements: 'Node.js 18+',
        downloadUrl: 'https://www.npmjs.com/package/heroshot',
        installUrl: 'https://www.npmjs.com/package/heroshot',
        releaseNotes: 'https://github.com/omachala/heroshot/releases',
        keywords:
          'screenshot automation, documentation screenshots, automated screenshots, playwright, CLI tool',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        },
        author: {
          '@type': 'Person',
          name: 'Ondrej Machala',
          url: 'https://github.com/omachala',
        },
        maintainer: {
          '@type': 'Person',
          name: 'Ondrej Machala',
          url: 'https://github.com/omachala',
        },
        sourceOrganization: {
          '@type': 'Organization',
          name: 'Heroshot',
          url: SITE_URL,
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
          text: 'Reference',
          items: [
            { text: 'CLI', link: '/docs/cli' },
            {
              text: 'Configuration',
              link: '/docs/config',
              items: [
                { text: 'Global Config', link: '/docs/config-reference' },
                { text: 'Screenshot', link: '/docs/screenshot-reference' },
                { text: 'Browser', link: '/docs/browser-reference' },
                { text: 'Actions', link: '/docs/actions-reference' },
              ],
            },
          ],
        },
        {
          text: 'Guides',
          items: [
            { text: 'Getting Started', link: '/docs/getting-started' },
            { text: 'Screenshot Design', link: '/docs/guide/screenshot-design' },
            { text: 'Automated Updates', link: '/docs/guide/automated-updates' },
            { text: 'Version Control', link: '/docs/guide/version-control' },
            { text: 'Authentication', link: '/docs/guide/authentication' },
            { text: 'Troubleshooting Selectors', link: '/docs/guide/troubleshooting-selectors' },
            { text: 'AI Agents', link: '/docs/ai-agents' },
          ],
        },
        {
          text: 'Integrations',
          items: [
            {
              text: 'Docs',
              items: [
                { text: 'VitePress', link: '/docs/integrations/vitepress' },
                { text: 'Docusaurus', link: '/docs/integrations/docusaurus' },
                { text: 'MkDocs', link: '/docs/integrations/mkdocs' },
                { text: 'Sphinx', link: '/docs/integrations/sphinx' },
                { text: 'GitBook', link: '/docs/integrations/gitbook' },
              ],
            },
            {
              text: 'Full Stack',
              items: [
                { text: 'Next', link: '/docs/integrations/nextjs' },
                { text: 'Nuxt', link: '/docs/integrations/nuxt' },
                { text: 'SvelteKit', link: '/docs/integrations/sveltekit' },
              ],
            },
            {
              text: 'UI',
              items: [
                { text: 'React', link: '/docs/integrations/react' },
                { text: 'Vue', link: '/docs/integrations/vue' },
                { text: 'Svelte', link: '/docs/integrations/svelte' },
                { text: 'Markdown', link: '/docs/integrations/markdown' },
              ],
            },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/omachala/heroshot' },
      { icon: 'npm', link: 'https://www.npmjs.com/package/heroshot' },
    ],

    // Footer rendered via custom SiteFooter.vue component
  },
});
