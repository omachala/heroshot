const { withHeroshot } = require('heroshot/plugins/next');

/** @type {import('next').NextConfig} */
const nextConfig = {};

module.exports = withHeroshot(nextConfig);
