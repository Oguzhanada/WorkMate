/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_PLATFORM_BASE_URL || 'https://workmate.ie',
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/' },
      { userAgent: '*', disallow: ['/en/dashboard', '/en/post-job', '/en/profile', '/api/'] },
    ],
  },
  exclude: [
    '/en/dashboard*',
    '/en/post-job*',
    '/en/profile*',
    '/api/*',
    '/auth/*',
  ],
  changefreq: 'weekly',
  priority: 0.7,
  sitemapSize: 5000,
  generateIndexSitemap: false,
};
