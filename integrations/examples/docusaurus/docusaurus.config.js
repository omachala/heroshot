const { heroshot } = require('heroshot/plugins/docusaurus');

module.exports = {
  title: 'Heroshot Example',
  tagline: 'Minimal Docusaurus + Heroshot setup',
  url: 'https://example.com',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  favicon: 'img/favicon.ico',
  plugins: [heroshot()],
  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: false,
        },
        blog: false,
      },
    ],
  ],
  themeConfig: {
    navbar: {
      title: 'Heroshot Example',
    },
  },
};
